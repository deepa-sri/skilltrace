from rest_framework import serializers

from .models import SkillingProgramme, SkillingProvider, TrainingEnrollment


class ProviderSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source="get_district_display", read_only=True)
    type_label = serializers.CharField(source="get_provider_type_display", read_only=True)

    class Meta:
        model = SkillingProvider
        fields = ["id", "name", "code", "provider_type", "type_label", "district", "district_name", "accreditation"]


class ProgrammeSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source="provider.name", read_only=True)
    district_name = serializers.CharField(source="get_district_display", read_only=True)
    enrolled = serializers.IntegerField(read_only=True, default=None)

    class Meta:
        model = SkillingProgramme
        fields = ["id", "provider", "provider_name", "name", "code", "sector", "funding_scheme", "duration_hours",
                  "delivery_mode", "nsqf_level", "qp_code", "target_skills", "district", "district_name", "cohort_size",
                  "start_date", "end_date", "is_active", "description", "enrolled"]
        read_only_fields = ["provider"]


class EnrollmentSerializer(serializers.ModelSerializer):
    programme_detail = ProgrammeSerializer(source="programme", read_only=True)
    trainee_name = serializers.CharField(source="trainee.full_name", read_only=True)
    trainee_uti = serializers.CharField(source="trainee.profile.uti", read_only=True, default="")
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = TrainingEnrollment
        fields = ["id", "programme", "programme_detail", "trainee_name", "trainee_uti", "cohort", "enrolled_on", "start_date",
                  "end_date", "completion_date", "attendance_pct", "status", "status_label", "provider_confirmed", "certificate_number"]
        read_only_fields = ["provider_confirmed", "certificate_number", "completion_date"]
