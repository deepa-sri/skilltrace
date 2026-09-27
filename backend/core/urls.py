from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("meta/", views.meta),
    path("auth/register/", views.register),
    path("auth/login/", views.login),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("me/", views.me),
    path("me/consents/", views.consents),
    path("me/anonymise/", views.anonymise),
    path("me/notifications/", views.notifications),
    path("me/journey/", views.journey),
    path("me/timeline/", views.timeline),
    path("admin/audit/", views.audit_log),
]
