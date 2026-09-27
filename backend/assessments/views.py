from django.conf import settings
from django.db import transaction
from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.ai import ai_enabled, gemini
from core.permissions import IsAdminOrProvider, IsOfficer, IsTrainee
from core.utils import audit
from credentials.models import SkillRecord, SkillTaxonomy

from . import engine
from .models import AssessmentEvent, AssessmentSession, Question

CFG = settings.SKILLTRACE


def session_payload(s, include_questions=True):
    data = {
        "id": str(s.id), "kind": s.kind, "skill": s.skill.name if s.skill else None, "skill_id": s.skill_id,
        "attempt_no": s.attempt_no, "max_attempts": CFG["MAX_ATTEMPTS"], "status": s.status,
        "started_at": s.started_at, "expires_at": s.expires_at, "submitted_at": s.submitted_at,
        "server_now": timezone.now(), "remaining_seconds": engine.remaining_seconds(s),
        "total_questions": len(s.question_ids), "review_status": s.review_status,
    }
    if s.status == "IN_PROGRESS" and include_questions:
        data["questions"] = engine.public_questions(s)
        data["answers"] = s.answers
    if s.status != "IN_PROGRESS":
        data.update({"score": s.score, "correct_count": s.correct_count, "band": s.band, "passed": s.passed,
                     "domain_scores": s.domain_scores, "integrity": s.integrity, "feedback": s.feedback,
                     "review_notes": s.review_notes, "duration_seconds": s.duration_seconds, "pass_mark": CFG["PASS_MARK"]})
    return data


@api_view(["GET"])
@permission_classes([IsTrainee])
def overview(request):
    u = request.user
    sessions = AssessmentSession.objects.filter(trainee=u).select_related("skill")
    for s in sessions.filter(status="IN_PROGRESS"):
        engine.finalize_if_expired(s)
    soft = [session_payload(s, False) for s in sessions.filter(kind="SOFT")]
    soft_passed = any(s["passed"] and s["review_status"] != "INVALIDATED" for s in soft)
    tech = []
    for rec in SkillRecord.objects.filter(trainee=u).select_related("skill"):
        rows = [session_payload(s, False) for s in sessions.filter(kind="TECH", skill=rec.skill)]
        tech.append({"skill_id": rec.skill_id, "skill": rec.skill.name, "status": rec.assessment_status, "level": rec.competency_level,
                     "best_score": rec.best_score, "attempts_used": engine.attempts_used(u, "TECH", rec.skill),
                     "has_bank": Question.objects.filter(skill=rec.skill, active=True).count() >= 4, "history": rows})
    return Response({
        "policy": {"max_attempts": CFG["MAX_ATTEMPTS"], "pass_mark": CFG["PASS_MARK"], "soft_minutes": CFG["SOFT_DURATION_MIN"],
                   "tech_minutes": CFG["TECH_DURATION_MIN"], "soft_questions": CFG["SOFT_QUESTIONS_PER_DOMAIN"] * 7, "tech_questions": CFG["TECH_QUESTIONS"]},
        "soft": {"mandatory": True, "passed": soft_passed, "attempts_used": engine.attempts_used(u, "SOFT"), "history": soft},
        "technical": tech,
        "consent": u.profile.has_consent("SKILL_ASSESSMENT"),
    })


@api_view(["POST"])
@permission_classes([IsTrainee])
def start(request):
    u = request.user
    d = request.data
    if not u.profile.has_consent("SKILL_ASSESSMENT"):
        return Response({"detail": "Grant 'skill assessment' consent to take assessments", "code": "consent_required"}, status=403)
    if not d.get("identity_confirmed") or not d.get("rules_accepted"):
        return Response({"detail": "Confirm your identity and accept the examination rules to begin"}, status=400)
    kind = d.get("kind")
    skill = None
    if kind == "TECH":
        skill = SkillTaxonomy.objects.filter(pk=d.get("skill_id")).first()
        if not skill or not SkillRecord.objects.filter(trainee=u, skill=skill).exists():
            return Response({"detail": "Add this skill to your profile before taking its assessment"}, status=400)
    elif kind != "SOFT":
        return Response({"detail": "Unknown assessment type"}, status=400)
    try:
        s = engine.start_session(u, kind, skill, d.get("system_check") or {})
    except engine.AssessmentError as e:
        return Response({"detail": str(e)}, status=400)
    audit(request, "assessment.started", "AssessmentSession", s.id, kind=kind, skill=skill.name if skill else None, attempt=s.attempt_no)
    return Response(session_payload(s), status=201)


def _own(request, pk):
    return AssessmentSession.objects.filter(pk=pk, trainee=request.user).select_related("skill").first()


@api_view(["GET"])
@permission_classes([IsTrainee])
def detail(request, pk):
    s = _own(request, pk)
    if not s:
        return Response({"detail": "Session not found"}, status=404)
    engine.finalize_if_expired(s)
    return Response(session_payload(s))


@api_view(["POST"])
@permission_classes([IsTrainee])
def answer(request, pk):
    with transaction.atomic():
        s = AssessmentSession.objects.select_for_update().filter(pk=pk, trainee=request.user).first()
        if not s:
            return Response({"detail": "Session not found"}, status=404)
        if s.status != "IN_PROGRESS" or timezone.now() > s.expires_at + timedelta(seconds=CFG["GRACE_SECONDS"]):
            return Response({"detail": "This session is closed", "code": "session_closed"}, status=409)
        qid = str(request.data.get("question_id"))
        if int(qid) not in s.question_ids:
            return Response({"detail": "Question is not part of this session"}, status=400)
        opt = request.data.get("option_index")
        prev = s.answers.get(qid)
        s.answers[qid] = None if opt is None else int(opt)
        s.save(update_fields=["answers"])
        if prev is not None and prev != s.answers[qid]:
            AssessmentEvent.objects.create(session=s, event_type="ANSWER_CHANGE", question_id=int(qid), meta={"from": prev, "to": s.answers[qid]})
    return Response({"saved": True, "answered": sum(1 for v in s.answers.values() if v is not None)})


@api_view(["POST"])
@permission_classes([IsTrainee])
def events(request, pk):
    s = _own(request, pk)
    if not s or s.status != "IN_PROGRESS":
        return Response({"recorded": 0})
    valid = {c for c, _ in AssessmentEvent.TYPES} - {"START", "SUBMIT", "ANSWER_CHANGE"}
    rows = []
    for e in (request.data.get("events") or [])[:100]:
        if e.get("type") in valid:
            rows.append(AssessmentEvent(session=s, event_type=e["type"], question_id=e.get("question_id"), meta=e.get("meta") or {},
                                        client_ts=parse_datetime(e.get("ts") or "") if e.get("ts") else None))
    AssessmentEvent.objects.bulk_create(rows)
    counts = {t: s.events.filter(event_type=t).count() for t in ("TAB_SWITCH", "FOCUS_LOST", "FULLSCREEN_EXIT")}
    return Response({"recorded": len(rows), "counts": counts})


@api_view(["POST"])
@permission_classes([IsTrainee])
def submit(request, pk):
    s = _own(request, pk)
    if not s:
        return Response({"detail": "Session not found"}, status=404)
    if s.status == "IN_PROGRESS":
        auto = timezone.now() > s.expires_at
        engine.submit(s, auto=auto)
        audit(request, "assessment.submitted", "AssessmentSession", s.id, score=s.score, flags=len(s.integrity.get("flags", [])))
    s.refresh_from_db()
    return Response(session_payload(s))


# ---------- Officer review ----------

@api_view(["GET"])
@permission_classes([IsOfficer])
def flagged(request):
    status = request.query_params.get("review", "FLAGGED")
    qs = AssessmentSession.objects.exclude(status="IN_PROGRESS").select_related("trainee__profile", "skill")
    qs = qs.filter(review_status=status) if status != "ALL" else qs.exclude(review_status="NONE")
    out = []
    for s in qs[:100]:
        p = session_payload(s, False)
        p["trainee"] = s.trainee.full_name
        p["uti"] = getattr(getattr(s.trainee, "profile", None), "uti", "")
        p["events"] = [{"type": e.event_type, "at": e.created_at, "question_id": e.question_id} for e in s.events.all()[:200]]
        out.append(p)
    return Response(out)


@api_view(["POST"])
@permission_classes([IsOfficer])
def review(request, pk):
    s = AssessmentSession.objects.filter(pk=pk).select_related("skill", "trainee").first()
    decision = request.data.get("decision")
    if not s or decision not in ("CLEAR", "INVALIDATE"):
        return Response({"detail": "Invalid decision"}, status=400)
    engine.review_session(s, decision, request.user, request.data.get("notes", ""))
    audit(request, "assessment.reviewed", "AssessmentSession", s.id, decision=decision)
    return Response(session_payload(s, False))


# ---------- AI question generation ----------

@api_view(["POST"])
@permission_classes([IsAdminOrProvider])
def generate_questions(request):
    skill = SkillTaxonomy.objects.filter(pk=request.data.get("skill_id")).first()
    count = max(3, min(10, int(request.data.get("count", 5))))
    if not skill:
        return Response({"detail": "Skill not found"}, status=404)
    if not ai_enabled():
        return Response({"detail": "Set GEMINI_API_KEY in backend .env to generate questions. The seeded question bank is used otherwise."}, status=400)
    prompt = (
        f"Write {count} multiple-choice questions to assess '{skill.name}' for vocational trainees in India (NSQF level 3-5). "
        "Mix easy, medium and hard. Test practical understanding, not trivia. Return JSON list of objects with keys: "
        "'text', 'options' (exactly 4 strings), 'correct_index' (0-3), 'topic' (short), 'difficulty' (1-3), 'explanation'."
    )
    data = gemini(prompt, json_mode=True, temperature=0.7)
    created = 0
    if isinstance(data, list):
        for q in data:
            try:
                if len(q["options"]) == 4 and 0 <= int(q["correct_index"]) <= 3:
                    Question.objects.create(kind="TECH", skill=skill, topic=q.get("topic", "")[:80], difficulty=int(q.get("difficulty", 2)),
                                            text=q["text"], options=q["options"], correct_index=int(q["correct_index"]),
                                            explanation=q.get("explanation", ""), source="GEMINI", active=False)
                    created += 1
            except (KeyError, TypeError, ValueError):
                continue
    if not created:
        return Response({"detail": "Gemini did not return usable questions. Try again."}, status=502)
    audit(request, "questions.generated", "SkillTaxonomy", skill.id, count=created)
    pending = Question.objects.filter(skill=skill, source="GEMINI", active=False)
    return Response({"created": created, "pending_review": [{"id": q.id, "text": q.text, "options": q.options, "correct_index": q.correct_index, "topic": q.topic} for q in pending]})


@api_view(["GET", "POST"])
@permission_classes([IsAdminOrProvider])
def question_bank(request):
    if request.method == "POST":
        ids = request.data.get("approve") or []
        Question.objects.filter(id__in=ids, source="GEMINI").update(active=True)
        Question.objects.filter(id__in=request.data.get("reject") or [], source="GEMINI", active=False).delete()
        audit(request, "questions.reviewed", "Question", "", approved=len(ids))
    from django.db.models import Count, Q
    rows = SkillTaxonomy.objects.annotate(active=Count("questions", filter=Q(questions__active=True)),
                                          pending=Count("questions", filter=Q(questions__active=False)))
    pending = Question.objects.filter(source="GEMINI", active=False).select_related("skill")[:50]
    return Response({
        "skills": [{"id": s.id, "name": s.name, "active": s.active, "pending": s.pending} for s in rows],
        "soft_questions": Question.objects.filter(kind="SOFT", active=True).count(),
        "pending": [{"id": q.id, "skill": q.skill.name, "text": q.text, "options": q.options, "correct_index": q.correct_index} for q in pending],
        "ai_enabled": ai_enabled(),
    })
