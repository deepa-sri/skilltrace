from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AuditLog, ConsentRecord, Notification, TraineeProfile, User


@admin.register(User)
class SkillTraceUserAdmin(UserAdmin):
    list_display = ("email", "full_name", "role", "district", "is_demo", "is_active")
    list_filter = ("role", "district", "is_demo")
    fieldsets = UserAdmin.fieldsets + (("SkillTrace", {"fields": ("role", "full_name", "phone", "district", "organisation", "provider", "preferred_language", "is_demo", "anonymised")}),)


@admin.register(TraineeProfile)
class TraineeProfileAdmin(admin.ModelAdmin):
    list_display = ("uti", "user", "district", "employment_status")
    search_fields = ("uti", "user__full_name", "user__email")
    list_filter = ("district", "employment_status")


admin.site.register(ConsentRecord, list_display=("user", "purpose", "granted", "version", "created_at"))
admin.site.register(AuditLog, list_display=("created_at", "actor", "action", "entity", "entity_id"))
admin.site.register(Notification, list_display=("user", "title", "read", "created_at"))
