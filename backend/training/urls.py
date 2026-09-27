from django.urls import path

from . import views

urlpatterns = [
    path("programmes/", views.programmes),
    path("providers/", views.providers),
    path("me/enrollments/", views.my_enrollments),
    path("provider/programmes/", views.provider_programmes),
    path("provider/programmes/<int:pk>/", views.provider_programme_detail),
    path("provider/enrollments/", views.provider_enrollments),
    path("provider/enrollments/<int:pk>/", views.provider_enrollment_detail),
    path("provider/analytics/", views.provider_analytics),
]
