from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.models import TraineeProfile
from core.permissions import IsProvider, IsTrainee
from core.utils import audit, notify

from .models import SkillingProgramme, SkillingProvider, TrainingEnrollment
from .serializers import EnrollmentSerializer, ProgrammeSerializer, ProviderSerializer
from .services import complete_enrollment


@api_view(["GET"])
@permission_classes([AllowAny])
def programmes(request):
    qs = SkillingProgramme.objects.filter(is_active=True).select_related("provider").annotate(enrolled=Count("enrollments"))
    for f in ("district", "sector"):
        if request.query_params.get(f):
            qs = qs.filter(**{f: request.query_params[f]})
    if request.query_params.get("q"):
        qs = qs.filter(name__icontains=request.query_params["q"])
    return Response(ProgrammeSerializer(qs.order_by("name"), many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def providers(request):
    return Response(ProviderSerializer(SkillingProvider.objects.all().order_by("name"), many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsTrainee])
def my_enrollments(request):
    if request.method == "POST":
        if not request.user.profile.has_consent("TRAINING_RECORDS"):
            return Response({"detail": "Training record consent is required"}, status=403)
        prog = SkillingProgramme.objects.filter(pk=request.data.get("programme"), is_active=True).first()
        if not prog:
            return Response({"detail": "Programme not found"}, status=404)
        e, created = TrainingEnrollment.objects.get_or_create(
            trainee=request.user, programme=prog,
            defaults={"start_date": prog.start_date, "end_date": prog.end_date, "cohort": f"{prog.start_date.year if prog.start_date else ''}-SELF"},
        )
        if not created:
            return Response({"detail": "You are already enrolled in this programme"}, status=400)
        audit(request, "enrollment.self_created", "TrainingEnrollment", e.id, programme=prog.code)
        for staff in prog.provider.staff.all():
            notify(staff, "New enrollment awaiting confirmation", f"{request.user.full_name} enrolled in {prog.name}", "/provider/enrollments", "ACTION")
    qs = request.user.enrollments.select_related("programme__provider")
    return Response(EnrollmentSerializer(qs, many=True).data)


# ---------- Provider portal ----------

def _provider(request):
    return request.user.provider


@api_view(["GET", "POST"])
@permission_classes([IsProvider])
def provider_programmes(request):
    prov = _provider(request)
    if not prov:
        return Response({"detail": "Your account is not linked to a provider"}, status=403)
    if request.method == "POST":
        s = ProgrammeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        p = s.save(provider=prov)
        audit(request, "programme.created", "SkillingProgramme", p.id, code=p.code)
    qs = prov.programmes.annotate(enrolled=Count("enrollments")).order_by("-start_date")
    return Response(ProgrammeSerializer(qs, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsProvider])
def provider_programme_detail(request, pk):
    p = SkillingProgramme.objects.filter(pk=pk, provider=_provider(request)).first()
    if not p:
        return Response({"detail": "Not found"}, status=404)
    s = ProgrammeSerializer(p, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    audit(request, "programme.updated", "SkillingProgramme", p.id)
    return Response(s.data)


@api_view(["GET", "POST"])
@permission_classes([IsProvider])
def provider_enrollments(request):
    prov = _provider(request)
    if request.method == "POST":
        prog = SkillingProgramme.objects.filter(pk=request.data.get("programme"), provider=prov).first()
        profile = TraineeProfile.objects.filter(uti__iexact=(request.data.get("uti") or "").strip()).select_related("user").first()
        if not prog or not profile:
            return Response({"detail": "Programme or UTI not found"}, status=404)
        if not profile.has_consent("TRAINING_RECORDS"):
            return Response({"detail": "Trainee has not consented to training record storage"}, status=403)
        e, created = TrainingEnrollment.objects.get_or_create(
            trainee=profile.user, programme=prog,
            defaults={"start_date": prog.start_date, "end_date": prog.end_date, "provider_confirmed": True, "status": "IN_PROGRESS",
                      "cohort": request.data.get("cohort") or f"{prog.start_date.year if prog.start_date else ''}-B1"},
        )
        if not created:
            return Response({"detail": "Trainee already enrolled"}, status=400)
        audit(request, "enrollment.provider_created", "TrainingEnrollment", e.id, uti=profile.uti)
        notify(profile.user, "Enrollment confirmed", f"{prov.name} enrolled you in {prog.name}", "/trainee/training", "SUCCESS")
    qs = TrainingEnrollment.objects.filter(programme__provider=prov).select_related("programme__provider", "trainee__profile")
    if request.query_params.get("programme"):
        qs = qs.filter(programme_id=request.query_params["programme"])
    if request.query_params.get("status"):
        qs = qs.filter(status=request.query_params["status"])
    if request.query_params.get("q"):
        q = request.query_params["q"]
        qs = qs.filter(trainee__full_name__icontains=q) | qs.filter(trainee__profile__uti__icontains=q)
    return Response(EnrollmentSerializer(qs.order_by("-enrolled_on")[:300], many=True).data)


@api_view(["PATCH"])
@permission_classes([IsProvider])
def provider_enrollment_detail(request, pk):
    e = TrainingEnrollment.objects.filter(pk=pk, programme__provider=_provider(request)).select_related("programme__provider", "trainee").first()
    if not e:
        return Response({"detail": "Not found"}, status=404)
    data = request.data
    if "attendance_pct" in data:
        e.attendance_pct = max(0, min(100, int(data["attendance_pct"])))
    if data.get("confirm"):
        e.provider_confirmed = True
        if e.status == "ENROLLED":
            e.status = "IN_PROGRESS"
    new_status = data.get("status")
    if new_status == "COMPLETED" and e.status != "COMPLETED":
        if e.attendance_pct < 70:
            return Response({"detail": "Attendance must be at least 70% to mark completion"}, status=400)
        e.save()
        complete_enrollment(e, issue_certificate=bool(data.get("issue_certificate", True)))
        audit(request, "enrollment.completed", "TrainingEnrollment", e.id, certificate=e.certificate_number)
    else:
        if new_status in ("ENROLLED", "IN_PROGRESS", "DROPOUT"):
            e.status = new_status
        e.save()
        audit(request, "enrollment.updated", "TrainingEnrollment", e.id, status=e.status, attendance=e.attendance_pct)
    e.refresh_from_db()
    return Response(EnrollmentSerializer(e).data)


@api_view(["GET"])
@permission_classes([IsProvider])
def provider_analytics(request):
    from analytics.compute import compute
    prov = _provider(request)
    data = compute(request.query_params.dict(), provider_id=prov.id)
    data["provider"] = ProviderSerializer(prov).data
    data.pop("districts", None)
    return Response(data)
