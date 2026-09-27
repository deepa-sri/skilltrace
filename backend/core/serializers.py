from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .constants import CONSENT_PURPOSES, DISTRICT_NAME
from .models import AuditLog, ConsentRecord, Notification, TraineeProfile, User


class ProfileSerializer(serializers.ModelSerializer):
    district_name = serializers.SerializerMethodField()
    target_role_name = serializers.CharField(source="target_role.name", read_only=True, default=None)

    class Meta:
        model = TraineeProfile
        fields = ["uti", "dob", "gender", "district", "district_name", "location", "education_level", "qualification",
                  "preferred_roles", "training_interests", "career_goals", "employment_status", "experience_years",
                  "consent_state", "target_role", "target_role_name", "created_at"]
        read_only_fields = ["uti", "consent_state", "created_at", "employment_status"]

    def get_district_name(self, obj):
        return DISTRICT_NAME.get(obj.district)


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    provider_name = serializers.CharField(source="provider.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "district", "preferred_language", "organisation",
                  "provider", "provider_name", "is_demo", "profile"]
        read_only_fields = ["id", "email", "role", "provider", "is_demo"]

    def get_profile(self, obj):
        p = getattr(obj, "profile", None) if obj.role == "TRAINEE" else None
        return ProfileSerializer(p).data if p else None


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.RegexField(r"^[6-9]\d{9}$", error_messages={"invalid": "Enter a valid 10-digit Indian mobile number"})
    password = serializers.CharField(min_length=8, write_only=True)
    dob = serializers.DateField()
    gender = serializers.ChoiceField(choices=["F", "M", "O", "N"])
    district = serializers.ChoiceField(choices=list(DISTRICT_NAME.keys()))
    location = serializers.CharField(required=False, allow_blank=True)
    education_level = serializers.CharField(required=False, allow_blank=True)
    qualification = serializers.CharField(required=False, allow_blank=True)
    employment_status = serializers.CharField(required=False, default="SEEKING")
    career_goals = serializers.CharField(required=False, allow_blank=True)
    preferred_roles = serializers.ListField(child=serializers.CharField(), required=False)
    preferred_language = serializers.ChoiceField(choices=["en", "mr", "hi"], default="en")
    consents = serializers.DictField(child=serializers.BooleanField())
    confirm_not_duplicate = serializers.BooleanField(default=False)

    def validate_email(self, v):
        if User.objects.filter(email__iexact=v).exists():
            raise serializers.ValidationError("An account with this email already exists")
        return v.lower()

    def validate_password(self, v):
        validate_password(v)
        return v

    def validate_consents(self, v):
        valid = {c for c, _ in CONSENT_PURPOSES}
        if not v.get("TRAINING_RECORDS"):
            raise serializers.ValidationError("Consent to store training records is required to create a trainee record")
        return {k: bool(val) for k, val in v.items() if k in valid}


class ConsentRecordSerializer(serializers.ModelSerializer):
    purpose_label = serializers.CharField(source="get_purpose_display", read_only=True)

    class Meta:
        model = ConsentRecord
        fields = ["id", "purpose", "purpose_label", "granted", "version", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "link", "kind", "read", "created_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "actor_name", "action", "entity", "entity_id", "meta", "ip_address", "created_at"]

    def get_actor_name(self, obj):
        return f"{obj.actor.full_name} ({obj.actor.role})" if obj.actor else "system"
