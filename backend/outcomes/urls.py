from django.urls import path

from . import views

urlpatterns = [
    path("roles/", views.roles),
    path("me/employment/", views.my_employment),
    path("me/employment/<int:pk>/request-verification/", views.request_verification),
    path("me/non-placement/", views.my_reasons),
    path("me/non-placement/<int:pk>/", views.dispute_reason),
    path("me/followups/", views.my_followups),
    path("me/followups/<int:pk>/respond/", views.respond_followup),
    path("me/competency/", views.competency),
    path("me/skill-gap/", views.skill_gap),
    path("employer/verifications/", views.employer_requests),
    path("employer/verifications/<int:pk>/respond/", views.employer_respond),
    path("verify/employment/<uuid:token>/", views.token_verification),
    path("admin/followups/run/", views.run_followups),
]
