from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

admin.site.site_header = "SkillTrace administration"


def health(_):
    return JsonResponse({"status": "ok", "service": "skilltrace-api"})


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/health/", health),
    path("api/", include("core.urls")),
    path("api/", include("training.urls")),
    path("api/", include("credentials.urls")),
    path("api/", include("assessments.urls")),
    path("api/", include("outcomes.urls")),
    path("api/", include("analytics.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
