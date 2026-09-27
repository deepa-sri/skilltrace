from django.contrib import admin

from .models import AssessmentEvent, AssessmentSession, Question

admin.site.register(Question, list_display=("id", "kind", "skill", "domain", "topic", "difficulty", "source", "active"), list_filter=("kind", "domain", "skill", "source", "active"))
admin.site.register(AssessmentSession, list_display=("id", "trainee", "kind", "skill", "attempt_no", "status", "score", "review_status"), list_filter=("kind", "status", "review_status"))
admin.site.register(AssessmentEvent, list_display=("session", "event_type", "created_at"))
