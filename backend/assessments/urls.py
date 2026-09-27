from django.urls import path

from . import views

urlpatterns = [
    path("me/assessments/", views.overview),
    path("me/assessments/start/", views.start),
    path("me/assessments/<uuid:pk>/", views.detail),
    path("me/assessments/<uuid:pk>/answer/", views.answer),
    path("me/assessments/<uuid:pk>/events/", views.events),
    path("me/assessments/<uuid:pk>/submit/", views.submit),
    path("officer/assessments/", views.flagged),
    path("officer/assessments/<uuid:pk>/review/", views.review),
    path("ai/generate-questions/", views.generate_questions),
    path("question-bank/", views.question_bank),
]
