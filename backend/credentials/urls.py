from django.urls import path

from . import views

urlpatterns = [
    path("skills/", views.taxonomy),
    path("issuers/", views.issuers),
    path("me/certificates/", views.my_certificates),
    path("me/certificates/<int:pk>/reverify/", views.reverify),
    path("me/certificates/<int:pk>/request-review/", views.request_review),
    path("me/skills/", views.my_skills),
    path("me/skills/<int:pk>/", views.delete_skill),
    path("officer/certificates/", views.officer_certificates),
    path("officer/certificates/<int:pk>/decision/", views.officer_decision),
]
