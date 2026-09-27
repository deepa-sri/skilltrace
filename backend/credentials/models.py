from django.conf import settings
from django.db import models
from django.utils import timezone


class Issuer(models.Model):
    """Authorised issuer registry. `supports_lookup` means we can check certificate numbers
    against IssuedCertificate (a simulated issuer database for the prototype)."""
    TYPES = [("SSC", "Sector Skill Council"), ("GOVT", "Government body"), ("PROVIDER", "Training provider"), ("PRIVATE", "Private platform")]
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    issuer_type = models.CharField(max_length=10, choices=TYPES)
    aliases = models.JSONField(default=list, blank=True)
    supports_lookup = models.BooleanField(default=True)
    verification_url_prefix = models.CharField(max_length=200, blank=True)
    is_authorised = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class IssuedCertificate(models.Model):
    issuer = models.ForeignKey(Issuer, on_delete=models.CASCADE, related_name="issued")
    cert_number = models.CharField(max_length=60)
    holder_name = models.CharField(max_length=150)
    course_name = models.CharField(max_length=200)
    issue_date = models.DateField()
    holder_uti = models.CharField(max_length=24, blank=True)
    revoked = models.BooleanField(default=False)

    class Meta:
        unique_together = ("issuer", "cert_number")


class CertificateRecord(models.Model):
    STATUS = [
        ("PENDING", "Pending"),
        ("DOCUMENT_CHECKED", "Document checked"),
        ("ISSUER_VERIFIED", "Issuer verified"),
        ("PARTIALLY_VERIFIED", "Partially verified"),
        ("MANUAL_REVIEW", "Manual review"),
        ("REJECTED", "Rejected"),
        ("VERIFICATION_UNAVAILABLE", "Verification unavailable"),
    ]
    trainee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificates")
    enrollment = models.ForeignKey("training.TrainingEnrollment", null=True, blank=True, on_delete=models.SET_NULL)
    file = models.FileField(upload_to="certificates/%Y/%m/", null=True, blank=True)
    original_name = models.CharField(max_length=200, blank=True)
    file_hash = models.CharField(max_length=64, blank=True, db_index=True)
    holder_name = models.CharField(max_length=150)
    issuer_name = models.CharField(max_length=200)
    issuer = models.ForeignKey(Issuer, null=True, blank=True, on_delete=models.SET_NULL)
    cert_number = models.CharField(max_length=60, db_index=True)
    course_name = models.CharField(max_length=200)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    verification_url = models.URLField(blank=True)
    status = models.CharField(max_length=25, choices=STATUS, default="PENDING")
    checks = models.JSONField(default=list, blank=True)
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class SkillTaxonomy(models.Model):
    CATEGORIES = [
        ("PROGRAMMING", "Programming"), ("DATA", "Data"), ("ACCOUNTING", "Accounting"),
        ("ELECTRICAL", "Electrical"), ("DIGITAL", "Digital literacy"), ("TRADE", "Trade skills"),
        ("HEALTHCARE", "Healthcare"), ("RETAIL", "Retail & sales"), ("COMMUNICATION", "Communication"),
    ]
    name = models.CharField(max_length=80, unique=True)
    category = models.CharField(max_length=15, choices=CATEGORIES)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class SkillRecord(models.Model):
    SOURCES = [("SELF", "Self-declared"), ("CERTIFICATE", "Certificate"), ("TRAINING", "Training")]
    ASSESSMENT = [
        ("NOT_ASSESSED", "Not assessed"), ("PENDING", "Assessment pending"), ("PASSED", "Passed"),
        ("NEEDS_IMPROVEMENT", "Needs improvement"), ("UNDER_REVIEW", "Under review"),
    ]
    EXPERIENCE = [("NONE", "No experience"), ("LT1", "Less than 1 year"), ("1TO3", "1 to 3 years"), ("GT3", "More than 3 years")]
    trainee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skills")
    skill = models.ForeignKey(SkillTaxonomy, on_delete=models.CASCADE)
    source = models.CharField(max_length=12, choices=SOURCES, default="SELF")
    experience = models.CharField(max_length=5, choices=EXPERIENCE, default="NONE")
    certificate = models.ForeignKey(CertificateRecord, null=True, blank=True, on_delete=models.SET_NULL)
    evidence_note = models.CharField(max_length=255, blank=True)
    assessment_status = models.CharField(max_length=20, choices=ASSESSMENT, default="NOT_ASSESSED")
    competency_level = models.CharField(max_length=15, default="NOT_ASSESSED")
    best_score = models.PositiveSmallIntegerField(null=True, blank=True)
    last_assessed = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("trainee", "skill")
        ordering = ["skill__name"]
