from django.urls import path

from . import views

urlpatterns = [
    path("admin/analytics/", views.dashboard),
    path("admin/insights/", views.insights),
    path("public/stats/", views.public_stats),
]
