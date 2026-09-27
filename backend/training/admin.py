from django.contrib import admin

from .models import SkillingProgramme, SkillingProvider, TrainingEnrollment

admin.site.register(SkillingProvider, list_display=("name", "code", "provider_type", "district"))
admin.site.register(SkillingProgramme, list_display=("code", "name", "provider", "sector", "funding_scheme"), list_filter=("sector", "funding_scheme"))
admin.site.register(TrainingEnrollment, list_display=("trainee", "programme", "status", "attendance_pct", "completion_date"), list_filter=("status",))
