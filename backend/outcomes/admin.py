from django.contrib import admin

from .models import EmployerVerification, EmploymentOutcome, FollowUpSchedule, NonPlacementReason, TargetRole

admin.site.register(TargetRole, list_display=("name", "sector", "openings"))
admin.site.register(EmploymentOutcome, list_display=("trainee", "status", "employer_name", "monthly_income", "verification_status", "is_current"), list_filter=("status", "verification_status"))
admin.site.register(EmployerVerification, list_display=("outcome", "employer_email", "status", "requested_at"))
admin.site.register(NonPlacementReason, list_display=("trainee", "category", "categorised_by", "disputed"))
admin.site.register(FollowUpSchedule, list_display=("trainee", "milestone", "due_date", "status", "attempts"), list_filter=("milestone", "status"))
