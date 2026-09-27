from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .ai import ai_enabled
from .constants import (CONSENT_PURPOSES, DISTRICTS, EDUCATION_CHOICES, EMPLOYMENT_STATUS,
                        GENDER_CHOICES, REQUIRED_CONSENTS)
from .models import AuditLog, ConsentRecord, Notification, TraineeProfile, User, UTISequence
from .permissions import IsAdmin, IsTrainee
from .serializers import (AuditLogSerializer, ConsentRecordSerializer, NotificationSerializer,
                          ProfileSerializer, RegisterSerializer, UserSerializer)
from .utils import audit, set_consent


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


@api_view(["GET"])
@permission_classes([AllowAny])
def meta(request):
    from credentials.models import SkillTaxonomy
    from outcomes.models import NonPlacementReason, TargetRole
    return Response({
        "districts": [{"code": c, "name": n, "division": d, "row": rc[0], "col": rc[1]} for c, n, d, rc in DISTRICTS],
        "genders": GENDER_CHOICES,
        "education": EDUCATION_CHOICES,
        "employment_status": EMPLOYMENT_STATUS,
        "consent_purposes": [{"code": c, "label": l, "required": c in REQUIRED_CONSENTS} for c, l in CONSENT_PURPOSES],
        "consent_version": settings.SKILLTRACE["CONSENT_VERSION"],
        "skills": list(SkillTaxonomy.objects.values("id", "name", "category")),
        "roles": list(TargetRole.objects.values("id", "name", "sector")),
        "non_placement_categories": NonPlacementReason.CATEGORIES,
        "ai_enabled": ai_enabled(),
        "policy": {k: settings.SKILLTRACE[k] for k in ("SOFT_DURATION_MIN", "TECH_DURATION_MIN", "MAX_ATTEMPTS", "PASS_MARK", "TECH_QUESTIONS")},
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    d = s.validated_data
    dups = TraineeProfile.find_duplicates(d["full_name"], d["phone"], d["dob"])
    if dups and not d["confirm_not_duplicate"]:
        masked = [{**m, "uti": m["uti"][:-4] + "****"} for m in dups]
        return Response({"detail": "A trainee record with matching details may already exist. Log in with that record, or confirm this is a different person.",
                         "code": "possible_duplicate", "matches": masked}, status=status.HTTP_409_CONFLICT)
    with transaction.atomic():
        user = User.objects.create_user(
            username=d["email"], email=d["email"], password=d["password"], full_name=d["full_name"],
            phone=d["phone"], district=d["district"], role="TRAINEE", preferred_language=d["preferred_language"],
            first_name=d["full_name"].split(" ")[0],
        )
        profile = TraineeProfile.objects.create(
            user=user, uti=UTISequence.next_uti(d["district"]), dob=d["dob"], gender=d["gender"], district=d["district"],
            location=d.get("location", ""), education_level=d.get("education_level", ""), qualification=d.get("qualification", ""),
            employment_status=d.get("employment_status") or "SEEKING", career_goals=d.get("career_goals", ""),
            preferred_roles=d.get("preferred_roles", []),
        )
        for purpose, _ in CONSENT_PURPOSES:
            set_consent(user, purpose, d["consents"].get(purpose, False), request)
        audit(request, "trainee.registered", "TraineeProfile", profile.uti, actor=user, duplicates_overridden=bool(dups))
    user.refresh_from_db()
    return Response({"user": UserSerializer(user).data, "tokens": tokens_for(user)}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    ident = (request.data.get("identifier") or "").strip()
    password = request.data.get("password") or ""
    user = User.objects.filter(Q(email__iexact=ident) | Q(phone=ident) | Q(profile__uti__iexact=ident)).first()

    if not user or user.anonymised or not authenticate(username=user.username, password=password):
        return Response({"detail": "Incorrect email, phone, UTI or password"}, status=401)
    audit(request, "auth.login", "User", user.id, actor=user)
    return Response({"user": UserSerializer(user).data, "tokens": tokens_for(user)})


@api_view(["GET", "PATCH"])
def me(request):
    user = request.user
    if request.method == "PATCH":
        us = UserSerializer(user, data=request.data, partial=True)
        us.is_valid(raise_exception=True)
        us.save()
        if user.role == "TRAINEE" and isinstance(request.data.get("profile"), dict):
            ps = ProfileSerializer(user.profile, data=request.data["profile"], partial=True)
            ps.is_valid(raise_exception=True)
            ps.save()
        audit(request, "profile.updated", "User", user.id)
        user.refresh_from_db()
    return Response(UserSerializer(user).data)


@api_view(["GET", "POST"])
@permission_classes([IsTrainee])
def consents(request):
    user = request.user
    if request.method == "POST":
        purpose = request.data.get("purpose")
        granted = bool(request.data.get("granted"))
        if purpose not in dict(CONSENT_PURPOSES):
            return Response({"detail": "Unknown consent purpose"}, status=400)
        if purpose in REQUIRED_CONSENTS and not granted:
            return Response({"detail": "Training record consent is required while your account is active. Use 'Withdraw and anonymise' to leave."}, status=400)
        set_consent(user, purpose, granted, request)
        audit(request, "consent.granted" if granted else "consent.withdrawn", "Consent", purpose)
    history = ConsentRecordSerializer(user.consents.all()[:100], many=True).data
    state = [{"purpose": c, "label": l, "granted": user.profile.has_consent(c), "required": c in REQUIRED_CONSENTS} for c, l in CONSENT_PURPOSES]
    return Response({"state": state, "history": history, "version": settings.SKILLTRACE["CONSENT_VERSION"]})


@api_view(["POST"])
@permission_classes([IsTrainee])
def anonymise(request):
    """Withdraw all consent and anonymise identifying fields. Aggregate-safe records remain
    but are excluded from analytics because GOVT_ANALYTICS consent is withdrawn."""
    if request.data.get("confirm") != "WITHDRAW":
        return Response({"detail": "Type WITHDRAW to confirm"}, status=400)
    user = request.user
    with transaction.atomic():
        for purpose, _ in CONSENT_PURPOSES:
            set_consent(user, purpose, False, request)
        audit(request, "consent.withdraw_all_and_anonymise", "User", user.id)
        user.full_name = "Withdrawn trainee"
        user.first_name = user.last_name = ""
        user.phone = ""
        user.email = f"withdrawn-{user.id}@invalid.local"
        user.username = user.email
        user.anonymised = True
        user.is_active = False
        user.save()
        p = user.profile
        p.dob = None
        p.location = ""
        p.career_goals = ""
        p.save()
    return Response({"detail": "Consent withdrawn and personal details anonymised."})


@api_view(["GET", "POST"])
def notifications(request):
    if request.method == "POST":
        ids = request.data.get("ids")
        qs = request.user.notifications.all()
        (qs.filter(id__in=ids) if ids else qs).update(read=True)
    qs = request.user.notifications.all()[:40]
    return Response({"unread": request.user.notifications.filter(read=False).count(), "items": NotificationSerializer(qs, many=True).data})


@api_view(["GET"])
@permission_classes([IsTrainee])
def journey(request):
    """Step completion for the trainee journey stepper."""
    u = request.user
    from assessments.models import AssessmentSession
    from credentials.models import CertificateRecord, SkillRecord
    from outcomes.models import EmploymentOutcome, FollowUpSchedule
    sessions = AssessmentSession.objects.filter(trainee=u).exclude(status="IN_PROGRESS").exclude(review_status="INVALIDATED")
    steps = [
        {"key": "register", "done": True},
        {"key": "consent", "done": u.profile.has_consent("TRAINING_RECORDS")},
        {"key": "training", "done": u.enrollments.exists(), "detail": u.enrollments.filter(status="COMPLETED").count()},
        {"key": "certificate", "done": CertificateRecord.objects.filter(trainee=u).exists()},
        {"key": "skills", "done": SkillRecord.objects.filter(trainee=u).exists()},
        {"key": "soft", "done": sessions.filter(kind="SOFT").exists(), "mandatory": True},
        {"key": "technical", "done": sessions.filter(kind="TECH").exists()},
        {"key": "gap", "done": bool(u.profile.target_role_id)},
        {"key": "employment", "done": EmploymentOutcome.objects.filter(trainee=u).exists()},
        {"key": "followup", "done": FollowUpSchedule.objects.filter(trainee=u, status="RESPONDED").exists()},
    ]
    done = sum(1 for s in steps if s["done"])
    return Response({"steps": steps, "progress": round(100 * done / len(steps))})


@api_view(["GET"])
@permission_classes([IsTrainee])
def timeline(request):
    """Longitudinal record: every event across modules in time order."""
    u = request.user
    from assessments.models import AssessmentSession
    from credentials.models import CertificateRecord
    from outcomes.models import EmployerVerification, EmploymentOutcome, FollowUpSchedule, NonPlacementReason
    ev = [{"date": u.profile.created_at, "type": "registration", "title": "Registered and UTI issued", "detail": u.profile.uti}]
    for e in u.enrollments.select_related("programme__provider"):
        ev.append({"date": e.created_at, "type": "training", "title": f"Enrolled in {e.programme.name}", "detail": e.programme.provider.name})
        if e.completion_date:
            ev.append({"date": e.completion_date, "type": "training", "title": f"Completed {e.programme.name}", "detail": f"Attendance {e.attendance_pct}%"})
    for c in CertificateRecord.objects.filter(trainee=u):
        ev.append({"date": c.created_at, "type": "certificate", "title": f"Certificate submitted: {c.course_name}", "detail": c.get_status_display()})
    for s in AssessmentSession.objects.filter(trainee=u).exclude(status="IN_PROGRESS").select_related("skill"):
        name = "Soft-skill assessment" if s.kind == "SOFT" else f"{s.skill.name if s.skill else 'Technical'} assessment"
        ev.append({"date": s.submitted_at, "type": "assessment", "title": f"{name} · attempt {s.attempt_no}", "detail": f"{s.score}/100 · {s.band.title()}" + (" · under review" if s.review_status == "FLAGGED" else "")})
    for o in EmploymentOutcome.objects.filter(trainee=u):
        detail = " · ".join(x for x in [o.job_role, o.employer_name, f"₹{o.monthly_income:,}/month" if o.monthly_income else ""] if x)
        ev.append({"date": o.recorded_at, "type": "employment", "title": f"Status: {o.get_status_display()}", "detail": detail, "income": o.monthly_income})
    for v in EmployerVerification.objects.filter(outcome__trainee=u, responded_at__isnull=False):
        ev.append({"date": v.responded_at, "type": "verification", "title": f"Employer {v.get_status_display().lower()} employment", "detail": v.employer_name})
    for f in FollowUpSchedule.objects.filter(trainee=u, responded_at__isnull=False):
        ev.append({"date": f.responded_at, "type": "followup", "title": f"Responded to {f.get_milestone_display()}", "detail": ""})
    for r in NonPlacementReason.objects.filter(trainee=u):
        ev.append({"date": r.created_at, "type": "reason", "title": "Non-placement reason recorded", "detail": r.get_category_display()})

    def key(e):
        d = e["date"]
        return d.isoformat() if hasattr(d, "isoformat") else str(d)
    ev.sort(key=key, reverse=True)
    for e in ev:
        e["date"] = key(e)
    return Response(ev)


@api_view(["GET"])
@permission_classes([IsAdmin])
def audit_log(request):
    qs = AuditLog.objects.select_related("actor")
    if request.query_params.get("action"):
        qs = qs.filter(action__icontains=request.query_params["action"])
    return Response(AuditLogSerializer(qs[:200], many=True).data)
