import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.constants import DISTRICT_CHOICES, EMPLOYMENT_STATUS


class TargetRole(models.Model):
    """Job role with skill requirements. `openings` is demo market demand, not live data."""
    name = models.CharField(max_length=120, unique=True)
    sector = models.CharField(max_length=80)
    description = models.CharField(max_length=255, blank=True)
    required = models.JSONField(default=list, help_text='[{"skill": "SQL", "level": "INTERMEDIATE"}]')
    soft_skill_min = models.PositiveSmallIntegerField(default=60)
    openings = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class EmploymentOutcome(models.Model):
    VERIFICATION = [
        ("SELF_REPORTED", "Self-reported"), ("REQUESTED", "Verification requested"),
        ("CONFIRMED", "Employer confirmed"), ("REJECTED", "Employer rejected"),
        ("DISPUTED", "Disputed"), ("UNABLE", "Unable to verify"), ("MANUAL_REVIEW", "Manual review"),
    ]
    TYPES = [("FULL_TIME", "Full-time"), ("PART_TIME", "Part-time"), ("CONTRACT", "Contract"), ("GIG", "Gig / freelance"), ("SEASONAL", "Seasonal")]
    SOURCES = [("SELF", "Trainee"), ("FOLLOWUP", "Follow-up response"), ("PROVIDER", "Provider")]
    trainee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="employment_outcomes")
    enrollment = models.ForeignKey("training.TrainingEnrollment", null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS)
    employer_name = models.CharField(max_length=200, blank=True)
    employer_email = models.EmailField(blank=True)
    business_type = models.CharField(max_length=120, blank=True)
    job_role = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=80, blank=True)
    district = models.CharField(max_length=3, choices=DISTRICT_CHOICES, blank=True)
    start_date = models.DateField(null=True, blank=True)
    employment_type = models.CharField(max_length=10, choices=TYPES, blank=True)
    monthly_income = models.PositiveIntegerField(null=True, blank=True, help_text="INR per month")
    related_skills = models.JSONField(default=list, blank=True)
    consent_for_verification = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=15, choices=VERIFICATION, default="SELF_REPORTED")
    months_since_training = models.PositiveSmallIntegerField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    source = models.CharField(max_length=10, choices=SOURCES, default="SELF")
    recorded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-recorded_at"]


class EmployerVerification(models.Model):
    STATUS = [("REQUESTED", "Requested"), ("CONFIRMED", "Confirmed"), ("REJECTED", "Rejected"), ("DISPUTED", "Disputed")]
    outcome = models.ForeignKey(EmploymentOutcome, on_delete=models.CASCADE, related_name="verifications")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    employer_email = models.EmailField(blank=True)
    employer_name = models.CharField(max_length=200, blank=True)
    responder = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    status = models.CharField(max_length=10, choices=STATUS, default="REQUESTED")
    confirmed_role = models.CharField(max_length=120, blank=True)
    confirmed_income = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(default=timezone.now)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]


class NonPlacementReason(models.Model):
    CATEGORIES = [
        ("SKILL_MISMATCH", "Skill mismatch"), ("LACK_EXPERIENCE", "Lack of experience"),
        ("LOCATION", "Location constraints"), ("WAGE_EXPECTATION", "Wage expectations"),
        ("NO_OPPORTUNITIES", "Lack of job opportunities"), ("INCOMPLETE_CERT", "Incomplete certification"),
        ("COMMUNICATION", "Communication difficulties"), ("PERSONAL", "Personal or logistical barriers"),
        ("FURTHER_EDUCATION", "Further education"), ("OTHER", "Other or not specified"),
    ]
    trainee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="non_placement_reasons")
    outcome = models.ForeignKey(EmploymentOutcome, null=True, blank=True, on_delete=models.SET_NULL)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    notes = models.TextField(blank=True)
    categorised_by = models.CharField(max_length=10, default="TRAINEE", help_text="TRAINEE, GEMINI or RULES")
    disputed = models.BooleanField(default=False)
    dispute_note = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class FollowUpSchedule(models.Model):
    MILESTONES = [("D30", "Day 30 · employment status"), ("D90", "Day 90 · employment or job search"),
                  ("D180", "Day 180 · retention and income"), ("D365", "Day 365 · career progression")]
    CHANNELS = [("IN_APP", "In-app"), ("SMS", "SMS"), ("WHATSAPP", "WhatsApp"), ("IVR", "IVR"), ("EMAIL", "Email")]
    STATUS = [("SCHEDULED", "Scheduled"), ("SENT", "Sent"), ("RESPONDED", "Responded"), ("UNREACHABLE", "Unreachable")]
    trainee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="followups")
    enrollment = models.ForeignKey("training.TrainingEnrollment", on_delete=models.CASCADE, related_name="followups")
    milestone = models.CharField(max_length=5, choices=MILESTONES)
    due_date = models.DateField()
    channel = models.CharField(max_length=10, choices=CHANNELS, default="IN_APP")
    status = models.CharField(max_length=12, choices=STATUS, default="SCHEDULED")
    attempts = models.PositiveSmallIntegerField(default=0)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    response = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ("enrollment", "milestone")
        ordering = ["due_date"]
