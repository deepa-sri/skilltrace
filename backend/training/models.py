from django.conf import settings
from django.db import models
from django.utils import timezone

from core.constants import DISTRICT_CHOICES


class SkillingProvider(models.Model):
    TYPES = [("GOVT", "Government"), ("PRIVATE", "Private"), ("NGO", "NGO"), ("ITI", "ITI")]
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    provider_type = models.CharField(max_length=10, choices=TYPES)
    district = models.CharField(max_length=3, choices=DISTRICT_CHOICES)
    accreditation = models.CharField(max_length=80, blank=True)
    contact_email = models.EmailField(blank=True)
    issuer = models.ForeignKey("credentials.Issuer", null=True, blank=True, on_delete=models.SET_NULL, related_name="providers")
    is_demo = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class SkillingProgramme(models.Model):
    MODES = [("CLASSROOM", "Classroom"), ("ONLINE", "Online"), ("BLENDED", "Blended"), ("OJT", "On-the-job")]
    provider = models.ForeignKey(SkillingProvider, on_delete=models.CASCADE, related_name="programmes")
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30, unique=True)
    sector = models.CharField(max_length=80)
    funding_scheme = models.CharField(max_length=80, help_text="PMKVY, State scheme, CSR, etc.")
    duration_hours = models.PositiveIntegerField(default=120)
    delivery_mode = models.CharField(max_length=10, choices=MODES, default="CLASSROOM")
    nsqf_level = models.PositiveSmallIntegerField(null=True, blank=True)
    qp_code = models.CharField(max_length=30, blank=True)
    target_skills = models.JSONField(default=list, blank=True)
    district = models.CharField(max_length=3, choices=DISTRICT_CHOICES)
    cohort_size = models.PositiveIntegerField(default=30)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code} {self.name}"


class TrainingEnrollment(models.Model):
    STATUS = [("ENROLLED", "Enrolled"), ("IN_PROGRESS", "In progress"), ("COMPLETED", "Completed"), ("DROPOUT", "Dropped out")]
    trainee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    programme = models.ForeignKey(SkillingProgramme, on_delete=models.CASCADE, related_name="enrollments")
    cohort = models.CharField(max_length=20, blank=True)
    enrolled_on = models.DateField(default=timezone.localdate)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    attendance_pct = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=12, choices=STATUS, default="ENROLLED")
    provider_confirmed = models.BooleanField(default=False)
    certificate_number = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("trainee", "programme")
        ordering = ["-enrolled_on"]
