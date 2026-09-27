import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

SOFT_DOMAINS = [
    ("COMMUNICATION", "Communication"),
    ("PROBLEM_SOLVING", "Problem-solving"),
    ("TEAMWORK", "Teamwork"),
    ("TIME_MANAGEMENT", "Time management"),
    ("PROFESSIONALISM", "Professionalism"),
    ("ADAPTABILITY", "Adaptability"),
    ("DIGITAL_LITERACY", "Digital literacy"),
]


class Question(models.Model):
    KINDS = [("SOFT", "Soft skill"), ("TECH", "Technical")]
    kind = models.CharField(max_length=4, choices=KINDS)
    skill = models.ForeignKey("credentials.SkillTaxonomy", null=True, blank=True, on_delete=models.CASCADE, related_name="questions")
    domain = models.CharField(max_length=20, blank=True, choices=SOFT_DOMAINS)
    topic = models.CharField(max_length=80, blank=True)
    difficulty = models.PositiveSmallIntegerField(default=2)
    text = models.TextField()
    options = models.JSONField()
    correct_index = models.PositiveSmallIntegerField()
    explanation = models.TextField(blank=True)
    source = models.CharField(max_length=10, default="SEED")
    active = models.BooleanField(default=True)


class AssessmentSession(models.Model):
    STATUS = [("IN_PROGRESS", "In progress"), ("SUBMITTED", "Submitted"), ("AUTO_SUBMITTED", "Auto-submitted at time limit")]
    REVIEW = [("NONE", "No review needed"), ("FLAGGED", "Flagged for review"), ("CLEARED", "Cleared"), ("INVALIDATED", "Invalidated")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trainee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assessment_sessions")
    kind = models.CharField(max_length=4, choices=Question.KINDS)
    skill = models.ForeignKey("credentials.SkillTaxonomy", null=True, blank=True, on_delete=models.SET_NULL)
    attempt_no = models.PositiveSmallIntegerField(default=1)
    question_ids = models.JSONField(default=list)
    option_orders = models.JSONField(default=dict, help_text="question_id -> shuffled original option indexes")
    answers = models.JSONField(default=dict, help_text="question_id -> displayed option index")
    visited = models.JSONField(default=list)
    started_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS, default="IN_PROGRESS")
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    correct_count = models.PositiveSmallIntegerField(null=True, blank=True)
    domain_scores = models.JSONField(default=dict, blank=True)
    band = models.CharField(max_length=15, blank=True)
    passed = models.BooleanField(null=True)
    integrity = models.JSONField(default=dict, blank=True)
    review_status = models.CharField(max_length=12, choices=REVIEW, default="NONE")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    review_notes = models.TextField(blank=True)
    system_check = models.JSONField(default=dict, blank=True)
    feedback = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-started_at"]

    @property
    def duration_seconds(self):
        end = self.submitted_at or timezone.now()
        return int((end - self.started_at).total_seconds())


class AssessmentEvent(models.Model):
    TYPES = [
        ("TAB_SWITCH", "Tab switch"), ("FOCUS_LOST", "Window lost focus"), ("FULLSCREEN_EXIT", "Exited fullscreen"),
        ("ANSWER_CHANGE", "Answer changed"), ("SKIP", "Question skipped"), ("RESUME", "Session resumed"),
        ("OFFLINE", "Connectivity lost"), ("ONLINE", "Connectivity restored"), ("COPY_ATTEMPT", "Copy attempt"),
        ("START", "Started"), ("SUBMIT", "Submitted"),
    ]
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=16, choices=TYPES)
    question_id = models.IntegerField(null=True, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    client_ts = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]
