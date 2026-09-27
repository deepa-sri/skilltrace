import difflib

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models, transaction
from django.utils import timezone

from .constants import (CONSENT_PURPOSES, DISTRICT_CHOICES, EDUCATION_CHOICES,
                        EMPLOYMENT_STATUS, GENDER_CHOICES)


class User(AbstractUser):
    class Role(models.TextChoices):
        TRAINEE = "TRAINEE", "Trainee"
        PROVIDER = "PROVIDER", "Training provider"
        EMPLOYER = "EMPLOYER", "Employer"
        OFFICER = "OFFICER", "Verification officer"
        ADMIN = "ADMIN", "Government administrator"

    role = models.CharField(max_length=12, choices=Role.choices, default=Role.TRAINEE)
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=15, blank=True, db_index=True)
    district = models.CharField(max_length=3, choices=DISTRICT_CHOICES, blank=True)
    preferred_language = models.CharField(max_length=5, default="en")
    organisation = models.CharField(max_length=200, blank=True, help_text="Employer organisation name")
    provider = models.ForeignKey("training.SkillingProvider", null=True, blank=True, on_delete=models.SET_NULL, related_name="staff")
    is_demo = models.BooleanField(default=False)
    anonymised = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.full_name or self.username} ({self.role})"


class UTISequence(models.Model):
    district = models.CharField(max_length=3)
    year = models.PositiveIntegerField()
    last = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("district", "year")

    @classmethod
    def next_uti(cls, district):
        year = timezone.now().year
        with transaction.atomic():
            seq, _ = cls.objects.select_for_update().get_or_create(district=district, year=year)
            seq.last += 1
            seq.save(update_fields=["last"])
            return f"MH-{district}-{year}-{seq.last:06d}"


class TraineeProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    uti = models.CharField("Unique Trainee Identifier", max_length=24, unique=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    district = models.CharField(max_length=3, choices=DISTRICT_CHOICES)
    location = models.CharField(max_length=120, blank=True)
    education_level = models.CharField(max_length=15, choices=EDUCATION_CHOICES, blank=True)
    qualification = models.CharField(max_length=150, blank=True)
    preferred_roles = models.JSONField(default=list, blank=True)
    training_interests = models.JSONField(default=list, blank=True)
    career_goals = models.TextField(blank=True)
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS, default="SEEKING")
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    consent_state = models.JSONField(default=dict, blank=True, help_text="Cache of latest consent per purpose")
    target_role = models.ForeignKey("outcomes.TargetRole", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.uti

    def has_consent(self, purpose):
        return bool(self.consent_state.get(purpose))

    @staticmethod
    def find_duplicates(full_name, phone, dob):
        """Soft de-duplication across programmes: same phone, or same DOB with a close name."""
        matches = []
        qs = TraineeProfile.objects.select_related("user").filter(user__anonymised=False)
        candidates = qs.filter(models.Q(user__phone=phone) | models.Q(dob=dob)) if (phone or dob) else qs.none()
        for p in candidates[:200]:
            ratio = difflib.SequenceMatcher(None, (p.user.full_name or "").lower(), (full_name or "").lower()).ratio()
            same_phone = phone and p.user.phone == phone
            same_dob = dob and p.dob == dob
            if (same_phone and ratio > 0.6) or (same_dob and ratio > 0.85) or (same_phone and same_dob):
                matches.append({"uti": p.uti, "name_similarity": round(ratio, 2), "phone_match": bool(same_phone), "dob_match": bool(same_dob)})
        return matches


class ConsentRecord(models.Model):
    """Append-only consent ledger. The latest row per purpose is the current state."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consents")
    purpose = models.CharField(max_length=30, choices=CONSENT_PURPOSES)
    granted = models.BooleanField()
    version = models.CharField(max_length=10)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    action = models.CharField(max_length=60)
    entity = models.CharField(max_length=60, blank=True)
    entity_id = models.CharField(max_length=64, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=160)
    body = models.TextField(blank=True)
    link = models.CharField(max_length=200, blank=True)
    kind = models.CharField(max_length=20, default="INFO")
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
