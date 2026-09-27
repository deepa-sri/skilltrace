from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.permissions import IsOfficer, IsTrainee
from core.utils import audit, notify

from .models import CertificateRecord, Issuer, SkillRecord, SkillTaxonomy
from .verification import run_verification, sha256_file, validate_upload


class CertificateSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    issuer_matched = serializers.CharField(source="issuer.name", read_only=True, default=None)
    trainee_name = serializers.CharField(source="trainee.full_name", read_only=True)
    trainee_uti = serializers.CharField(source="trainee.profile.uti", read_only=True, default="")
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CertificateRecord
        fields = ["id", "holder_name", "issuer_name", "issuer_matched", "cert_number", "course_name", "issue_date", "expiry_date",
                  "verification_url", "status", "status_label", "checks", "review_notes", "reviewed_at", "created_at",
                  "original_name", "file_url", "trainee_name", "trainee_uti", "enrollment"]
        read_only_fields = ["status", "checks", "review_notes", "reviewed_at", "created_at", "original_name"]

    def get_file_url(self, obj):
        req = self.context.get("request")
        return req.build_absolute_uri(obj.file.url) if (obj.file and req) else None


class SkillRecordSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="skill.name", read_only=True)
    category = serializers.CharField(source="skill.get_category_display", read_only=True)
    source_label = serializers.CharField(source="get_source_display", read_only=True)
    has_assessment = serializers.SerializerMethodField()

    class Meta:
        model = SkillRecord
        fields = ["id", "skill", "name", "category", "source", "source_label", "experience", "certificate", "evidence_note",
                  "assessment_status", "competency_level", "best_score", "last_assessed", "has_assessment"]
        read_only_fields = ["assessment_status", "competency_level", "best_score", "last_assessed"]

    def get_has_assessment(self, obj):
        return obj.skill.questions.filter(active=True).count() >= 4


@api_view(["GET"])
@permission_classes([AllowAny])
def taxonomy(request):
    from django.db.models import Count, Q
    qs = SkillTaxonomy.objects.annotate(qcount=Count("questions", filter=Q(questions__active=True)))
    return Response([{"id": s.id, "name": s.name, "category": s.get_category_display(), "description": s.description, "has_assessment": s.qcount >= 4} for s in qs])


@api_view(["GET"])
@permission_classes([AllowAny])
def issuers(request):
    return Response(list(Issuer.objects.filter(is_authorised=True).values("id", "name", "code", "issuer_type", "supports_lookup")))


@api_view(["GET", "POST"])
@permission_classes([IsTrainee])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def my_certificates(request):
    if request.method == "POST":
        if not request.user.profile.has_consent("CERT_VERIFICATION"):
            return Response({"detail": "Grant 'certificate verification' consent before submitting certificates", "code": "consent_required"}, status=403)
        f = request.FILES.get("file")
        err = validate_upload(f)
        if err:
            audit(request, "certificate.upload_rejected", "CertificateRecord", "", reason=err)
            return Response({"detail": err}, status=400)
        s = CertificateSerializer(data=request.data, context={"request": request})
        s.is_valid(raise_exception=True)
        rec = s.save(trainee=request.user, file=f, original_name=f.name if f else "", file_hash=sha256_file(f) if f else "")
        run_verification(rec)
        audit(request, "certificate.submitted", "CertificateRecord", rec.id, status=rec.status)
        # Link certificate to skills whose name appears in the course
        for sk in SkillTaxonomy.objects.all():
            if sk.name.lower() in rec.course_name.lower():
                SkillRecord.objects.update_or_create(trainee=request.user, skill=sk, defaults={"certificate": rec, "source": "CERTIFICATE"})
        return Response(CertificateSerializer(rec, context={"request": request}).data, status=201)
    qs = CertificateRecord.objects.filter(trainee=request.user).select_related("issuer")
    return Response(CertificateSerializer(qs, many=True, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsTrainee])
def reverify(request, pk):
    rec = CertificateRecord.objects.filter(pk=pk, trainee=request.user).first()
    if not rec:
        return Response({"detail": "Not found"}, status=404)
    if rec.status in ("ISSUER_VERIFIED", "MANUAL_REVIEW") or rec.reviewer_id:
        return Response({"detail": "This certificate cannot be re-run right now"}, status=400)
    run_verification(rec)
    audit(request, "certificate.reverified", "CertificateRecord", rec.id, status=rec.status)
    return Response(CertificateSerializer(rec, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsTrainee])
def request_review(request, pk):
    rec = CertificateRecord.objects.filter(pk=pk, trainee=request.user).first()
    if not rec or rec.status in ("ISSUER_VERIFIED", "MANUAL_REVIEW"):
        return Response({"detail": "Review cannot be requested for this certificate"}, status=400)
    rec.status = "MANUAL_REVIEW"
    rec.review_notes = f"Trainee note: {request.data.get('note', '')}".strip()
    rec.save()
    audit(request, "certificate.review_requested", "CertificateRecord", rec.id)
    return Response(CertificateSerializer(rec, context={"request": request}).data)


@api_view(["GET", "POST"])
@permission_classes([IsTrainee])
def my_skills(request):
    if request.method == "POST":
        skill = SkillTaxonomy.objects.filter(pk=request.data.get("skill")).first()
        if not skill:
            return Response({"detail": "Choose a skill from the taxonomy"}, status=400)
        rec, created = SkillRecord.objects.get_or_create(trainee=request.user, skill=skill, defaults={
            "source": "SELF", "experience": request.data.get("experience", "NONE"), "evidence_note": request.data.get("evidence_note", "")})
        if not created:
            return Response({"detail": "Skill already in your profile"}, status=400)
        audit(request, "skill.declared", "SkillRecord", rec.id, skill=skill.name)
    qs = SkillRecord.objects.filter(trainee=request.user).select_related("skill")
    return Response(SkillRecordSerializer(qs, many=True).data)


@api_view(["DELETE"])
@permission_classes([IsTrainee])
def delete_skill(request, pk):
    rec = SkillRecord.objects.filter(pk=pk, trainee=request.user, best_score__isnull=True).first()
    if not rec:
        return Response({"detail": "Assessed skills are kept as part of your record"}, status=400)
    rec.delete()
    return Response(status=204)


# ---------- Verification officer ----------

@api_view(["GET"])
@permission_classes([IsOfficer])
def officer_certificates(request):
    status = request.query_params.get("status", "MANUAL_REVIEW")
    qs = CertificateRecord.objects.select_related("trainee__profile", "issuer")
    if status != "ALL":
        qs = qs.filter(status=status)
    return Response(CertificateSerializer(qs[:200], many=True, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsOfficer])
def officer_decision(request, pk):
    rec = CertificateRecord.objects.filter(pk=pk).select_related("trainee").first()
    decision = request.data.get("decision")
    if not rec or decision not in ("ISSUER_VERIFIED", "PARTIALLY_VERIFIED", "REJECTED", "VERIFICATION_UNAVAILABLE"):
        return Response({"detail": "Invalid decision"}, status=400)
    notes = (request.data.get("notes") or "").strip()
    if decision == "REJECTED" and not notes:
        return Response({"detail": "A reason is required when rejecting"}, status=400)
    rec.status = decision
    rec.reviewer = request.user
    rec.review_notes = notes
    rec.reviewed_at = timezone.now()
    rec.save()
    audit(request, "certificate.reviewed", "CertificateRecord", rec.id, decision=decision)
    notify(rec.trainee, "Certificate review complete", f"{rec.course_name}: {rec.get_status_display()}", "/trainee/certificates")
    return Response(CertificateSerializer(rec, context={"request": request}).data)
