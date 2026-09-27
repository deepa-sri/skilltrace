from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.constants import EMPLOYMENT_STATUS, PLACED_STATUSES
from core.permissions import IsAdmin, IsEmployer, IsTrainee
from core.utils import audit, notify

from . import services
from .models import EmployerVerification, EmploymentOutcome, FollowUpSchedule, NonPlacementReason, TargetRole


class OutcomeSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    verification_label = serializers.CharField(source="get_verification_status_display", read_only=True)
    type_label = serializers.CharField(source="get_employment_type_display", read_only=True)
    verifications = serializers.SerializerMethodField()

    class Meta:
        model = EmploymentOutcome
        fields = ["id", "status", "status_label", "employer_name", "employer_email", "business_type", "job_role", "sector", "district",
                  "start_date", "employment_type", "type_label", "monthly_income", "related_skills", "consent_for_verification",
                  "verification_status", "verification_label", "months_since_training", "is_current", "source", "recorded_at", "verifications"]
        read_only_fields = ["verification_status", "months_since_training", "is_current", "source", "recorded_at"]

    def get_verifications(self, obj):
        return [{"status": v.status, "requested_at": v.requested_at, "responded_at": v.responded_at, "notes": v.notes} for v in obj.verifications.all()]

    def validate(self, data):
        st = data.get("status")
        if st in ("EMPLOYED", "APPRENTICE") and not data.get("employer_name"):
            raise serializers.ValidationError({"employer_name": "Employer name is required for this status"})
        if st == "SELF_EMPLOYED" and not data.get("business_type"):
            raise serializers.ValidationError({"business_type": "Describe your business or work type"})
        inc = data.get("monthly_income")
        if inc is not None and (inc < 500 or inc > 1000000):
            raise serializers.ValidationError({"monthly_income": "Monthly income looks invalid. Enter an amount in rupees per month"})
        sd = data.get("start_date")
        if sd and sd > timezone.localdate():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the future"})
        if st not in PLACED_STATUSES:
            data["monthly_income"] = None
        return data


class ReasonSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    intervention = serializers.SerializerMethodField()

    class Meta:
        model = NonPlacementReason
        fields = ["id", "category", "category_label", "notes", "categorised_by", "disputed", "dispute_note", "created_at", "intervention"]
        read_only_fields = ["categorised_by", "created_at"]

    def get_intervention(self, obj):
        return services.INTERVENTIONS.get(obj.category)


def _record_outcome(user, data, source="SELF"):
    enrollment, months = services.months_since_completion(user)
    with transaction.atomic():
        EmploymentOutcome.objects.filter(trainee=user, is_current=True).update(is_current=False)
        o = EmploymentOutcome.objects.create(trainee=user, enrollment=enrollment, months_since_training=months, source=source, **data)
        user.profile.employment_status = o.status
        user.profile.save(update_fields=["employment_status", "updated_at"])
    return o


@api_view(["GET", "POST"])
@permission_classes([IsTrainee])
def my_employment(request):
    if request.method == "POST":
        s = OutcomeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        o = _record_outcome(request.user, s.validated_data)
        audit(request, "employment.updated", "EmploymentOutcome", o.id, status=o.status)
        return Response(OutcomeSerializer(o).data, status=201)
    qs = EmploymentOutcome.objects.filter(trainee=request.user).prefetch_related("verifications")
    return Response(OutcomeSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsTrainee])
def request_verification(request, pk):
    o = EmploymentOutcome.objects.filter(pk=pk, trainee=request.user).first()
    if not o or o.status not in PLACED_STATUSES:
        return Response({"detail": "Only employment, apprenticeship or self-employment records can be verified"}, status=400)
    if not request.user.profile.has_consent("EMPLOYER_VERIFICATION"):
        return Response({"detail": "Grant 'employer verification' consent first", "code": "consent_required"}, status=403)
    if o.status == "SELF_EMPLOYED":
        o.verification_status = "MANUAL_REVIEW"
        o.consent_for_verification = True
        o.save()
        return Response(OutcomeSerializer(o).data)
    email = (request.data.get("employer_email") or o.employer_email or "").strip().lower()
    if not email:
        return Response({"detail": "Employer HR email is required to send a verification request"}, status=400)
    if o.verifications.filter(status="REQUESTED").exists():
        return Response({"detail": "A verification request is already pending"}, status=400)
    v = EmployerVerification.objects.create(outcome=o, employer_email=email, employer_name=o.employer_name)
    o.employer_email = email
    o.consent_for_verification = True
    o.verification_status = "REQUESTED"
    o.save()
    from core.models import User
    for emp in User.objects.filter(role="EMPLOYER").filter(email__iexact=email) | User.objects.filter(role="EMPLOYER", organisation__iexact=o.employer_name):
        notify(emp, "Employment verification request", f"Please verify {request.user.full_name}'s employment", "/employer", "ACTION")
    audit(request, "employment.verification_requested", "EmployerVerification", v.id)
    data = OutcomeSerializer(o).data
    data["verification_link"] = f"{settings.FRONTEND_URL}/verify/employment/{v.token}"
    return Response(data)


@api_view(["GET", "POST"])
@permission_classes([IsTrainee])
def my_reasons(request):
    if request.method == "POST":
        cat = request.data.get("category")
        notes = request.data.get("notes", "")
        by = "TRAINEE"
        if not cat or cat == "AUTO":
            cat, by = services.categorise_reason(notes)
        if cat not in dict(NonPlacementReason.CATEGORIES):
            return Response({"detail": "Unknown category"}, status=400)
        current = EmploymentOutcome.objects.filter(trainee=request.user, is_current=True).first()
        r = NonPlacementReason.objects.create(trainee=request.user, outcome=current, category=cat, notes=notes, categorised_by=by)
        audit(request, "non_placement.recorded", "NonPlacementReason", r.id, category=cat, by=by)
    qs = NonPlacementReason.objects.filter(trainee=request.user)
    return Response(ReasonSerializer(qs, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsTrainee])
def dispute_reason(request, pk):
    r = NonPlacementReason.objects.filter(pk=pk, trainee=request.user).first()
    if not r:
        return Response({"detail": "Not found"}, status=404)
    if request.data.get("category") in dict(NonPlacementReason.CATEGORIES):
        r.category = request.data["category"]
        r.categorised_by = "TRAINEE"
    r.disputed = bool(request.data.get("disputed", r.disputed))
    r.dispute_note = request.data.get("dispute_note", r.dispute_note)
    r.save()
    audit(request, "non_placement.corrected", "NonPlacementReason", r.id)
    return Response(ReasonSerializer(r).data)


@api_view(["GET"])
@permission_classes([IsTrainee])
def my_followups(request):
    qs = FollowUpSchedule.objects.filter(trainee=request.user).select_related("enrollment__programme")
    today = timezone.localdate()
    return Response([{
        "id": f.id, "milestone": f.milestone, "label": f.get_milestone_display(), "due_date": f.due_date, "status": f.status,
        "channel": f.get_channel_display(), "attempts": f.attempts, "responded_at": f.responded_at, "response": f.response,
        "programme": f.enrollment.programme.name, "can_respond": f.status in ("SENT", "SCHEDULED") and f.due_date <= today,
    } for f in qs])


@api_view(["POST"])
@permission_classes([IsTrainee])
def respond_followup(request, pk):
    f = FollowUpSchedule.objects.filter(pk=pk, trainee=request.user).first()
    if not f or f.status in ("RESPONDED",):
        return Response({"detail": "This follow-up is not open"}, status=400)
    if f.due_date > timezone.localdate():
        return Response({"detail": "This follow-up is not due yet"}, status=400)
    data = request.data
    status = data.get("status")
    if status not in dict(EMPLOYMENT_STATUS):
        return Response({"detail": "Choose your current status"}, status=400)
    payload = {k: data.get(k) for k in ("status", "employer_name", "job_role", "business_type", "monthly_income", "employment_type", "sector") if data.get(k) not in (None, "")}
    s = OutcomeSerializer(data=payload)
    s.is_valid(raise_exception=True)
    o = _record_outcome(request.user, s.validated_data, source="FOLLOWUP")
    reason = None
    if status not in PLACED_STATUSES and (data.get("reason") or data.get("reason_notes")):
        cat, by = (data["reason"], "TRAINEE") if data.get("reason") not in (None, "", "AUTO") else services.categorise_reason(data.get("reason_notes"))
        reason = NonPlacementReason.objects.create(trainee=request.user, outcome=o, category=cat, notes=data.get("reason_notes", ""), categorised_by=by)
    f.status = "RESPONDED"
    f.responded_at = timezone.now()
    f.response = {"status": status, "income": o.monthly_income, "reason": reason.category if reason else None}
    f.save()
    audit(request, "followup.responded", "FollowUpSchedule", f.id, milestone=f.milestone, status=status)
    return Response({"detail": "Thank you. Your record is updated.", "outcome": OutcomeSerializer(o).data})


@api_view(["GET"])
@permission_classes([AllowAny])
def roles(request):
    return Response(list(TargetRole.objects.values("id", "name", "sector", "description", "required", "openings")))


@api_view(["GET"])
@permission_classes([IsTrainee])
def competency(request):
    return Response(services.competency_profile(request.user))


@api_view(["GET"])
@permission_classes([IsTrainee])
def skill_gap(request):
    rid = request.query_params.get("role") or request.user.profile.target_role_id
    role = TargetRole.objects.filter(pk=rid).first() if rid else None
    if not role:
        return Response({"detail": "Choose a target role"}, status=400)
    if request.user.profile.target_role_id != role.id:
        request.user.profile.target_role = role
        request.user.profile.save(update_fields=["target_role", "updated_at"])
    return Response(services.skill_gap(request.user, role))


# ---------- Employer ----------

def _verification_payload(v):
    o = v.outcome
    p = getattr(o.trainee, "profile", None)
    return {
        "id": v.id, "token": str(v.token), "status": v.status, "requested_at": v.requested_at, "responded_at": v.responded_at,
        "trainee": o.trainee.full_name, "uti_masked": (p.uti[:-4] + "****") if p else "",
        "claimed": {"employer": o.employer_name, "role": o.job_role, "start_date": o.start_date, "type": o.get_employment_type_display(), "monthly_income": o.monthly_income},
        "confirmed_role": v.confirmed_role, "confirmed_income": v.confirmed_income, "notes": v.notes,
    }


def _apply_employer_response(v, data, responder=None):
    decision = data.get("decision")
    if decision not in ("CONFIRMED", "REJECTED", "DISPUTED"):
        return "Choose confirm, reject or dispute"
    if v.status != "REQUESTED":
        return "This request has already been answered"
    v.status = decision
    v.confirmed_role = data.get("confirmed_role", "")
    try:
        v.confirmed_income = int(data["confirmed_income"]) if data.get("confirmed_income") else None
    except (TypeError, ValueError):
        return "Confirmed income must be a number"
    v.notes = data.get("notes", "")
    v.responder = responder
    v.responded_at = timezone.now()
    v.save()
    o = v.outcome
    o.verification_status = {"CONFIRMED": "CONFIRMED", "REJECTED": "REJECTED", "DISPUTED": "DISPUTED"}[decision]
    if decision == "DISPUTED":
        o.verification_status = "MANUAL_REVIEW"
    o.save(update_fields=["verification_status"])
    notify(o.trainee, "Employer responded", f"{v.employer_name or 'Your employer'} marked your employment as {decision.lower()}", "/trainee/employment")
    return None


@api_view(["GET"])
@permission_classes([IsEmployer])
def employer_requests(request):
    u = request.user
    qs = EmployerVerification.objects.select_related("outcome__trainee__profile")
    qs = qs.filter(employer_email__iexact=u.email) | qs.filter(outcome__employer_name__iexact=u.organisation)
    return Response([_verification_payload(v) for v in qs.distinct().order_by("-requested_at")[:200]])


@api_view(["POST"])
@permission_classes([IsEmployer])
def employer_respond(request, pk):
    u = request.user
    v = EmployerVerification.objects.filter(pk=pk).select_related("outcome__trainee").first()
    if not v or (v.employer_email.lower() != u.email.lower() and v.outcome.employer_name.lower() != u.organisation.lower()):
        return Response({"detail": "Not found"}, status=404)
    err = _apply_employer_response(v, request.data, u)
    if err:
        return Response({"detail": err}, status=400)
    audit(request, "employer.responded", "EmployerVerification", v.id, decision=v.status)
    return Response(_verification_payload(v))


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def token_verification(request, token):
    """Secure link sent to an employer's HR email, for employers without an account."""
    v = EmployerVerification.objects.filter(token=token).select_related("outcome__trainee__profile").first()
    if not v:
        return Response({"detail": "Invalid or expired verification link"}, status=404)
    if request.method == "POST":
        err = _apply_employer_response(v, request.data)
        if err:
            return Response({"detail": err}, status=400)
        audit(request, "employer.responded_via_link", "EmployerVerification", v.id, decision=v.status)
    return Response(_verification_payload(v))


# ---------- Admin: follow-up engine ----------

@api_view(["POST"])
@permission_classes([IsAdmin])
def run_followups(request):
    result = services.run_followups()
    audit(request, "followups.engine_run", "FollowUpSchedule", "", **result)
    return Response(result)
