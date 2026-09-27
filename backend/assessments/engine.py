"""Assessment engine: blueprint selection, randomisation, timing, scoring and integrity review."""
import random
from collections import defaultdict
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from core.constants import band_for
from core.utils import notify

from .models import SOFT_DOMAINS, AssessmentEvent, AssessmentSession, Question

CFG = settings.SKILLTRACE
DOMAIN_LABEL = dict(SOFT_DOMAINS)

DOMAIN_TIPS = {
    "COMMUNICATION": "Practise summarising instructions back to your supervisor and writing short, clear status messages.",
    "PROBLEM_SOLVING": "Work through workplace case scenarios: identify the root cause before choosing an action.",
    "TEAMWORK": "Volunteer for a shared task this week and agree roles and deadlines with the group at the start.",
    "TIME_MANAGEMENT": "Use a daily task list sorted by urgency and importance. Review it at the end of each day.",
    "PROFESSIONALISM": "Review workplace conduct basics: punctuality, informing absences early, and respectful escalation.",
    "ADAPTABILITY": "When a process changes, list what is new, ask one clarifying question, and try the new way first.",
    "DIGITAL_LITERACY": "Practise email etiquette, file naming, safe passwords and spotting phishing messages.",
}


class AssessmentError(Exception):
    pass


def attempts_used(user, kind, skill=None):
    return AssessmentSession.objects.filter(trainee=user, kind=kind, skill=skill).exclude(review_status="INVALIDATED").count()


def pick_questions(kind, skill=None):
    if kind == "SOFT":
        ids = []
        per = CFG["SOFT_QUESTIONS_PER_DOMAIN"]
        for code, _ in SOFT_DOMAINS:
            pool = list(Question.objects.filter(kind="SOFT", domain=code, active=True).values_list("id", flat=True))
            ids += random.sample(pool, min(per, len(pool)))
        return ids
    pool = list(Question.objects.filter(kind="TECH", skill=skill, active=True).values_list("id", "difficulty"))
    if len(pool) < 4:
        raise AssessmentError("The question bank for this skill is not ready yet. Ask an administrator to add questions.")
    # Blueprint: spread across difficulty levels where possible
    by_diff = defaultdict(list)
    for qid, d in pool:
        by_diff[d].append(qid)
    for v in by_diff.values():
        random.shuffle(v)
    target = min(CFG["TECH_QUESTIONS"], len(pool))
    chosen = []
    while len(chosen) < target:
        for d in sorted(by_diff):
            if by_diff[d] and len(chosen) < target:
                chosen.append(by_diff[d].pop())
    return chosen


@transaction.atomic
def start_session(user, kind, skill=None, system_check=None):
    existing = AssessmentSession.objects.filter(trainee=user, kind=kind, skill=skill, status="IN_PROGRESS").first()
    if existing:
        finalize_if_expired(existing)
        if existing.status == "IN_PROGRESS":
            AssessmentEvent.objects.create(session=existing, event_type="RESUME")
            return existing
    used = attempts_used(user, kind, skill)
    if used >= CFG["MAX_ATTEMPTS"]:
        raise AssessmentError(f"You have used all {CFG['MAX_ATTEMPTS']} attempts for this assessment.")
    if kind == "SOFT" and AssessmentSession.objects.filter(trainee=user, kind="SOFT", passed=True).exclude(review_status="INVALIDATED").exists():
        raise AssessmentError("You have already passed the soft-skill assessment.")
    qids = pick_questions(kind, skill)
    random.shuffle(qids)
    orders = {}
    for q in Question.objects.filter(id__in=qids):
        order = list(range(len(q.options)))
        random.shuffle(order)
        orders[str(q.id)] = order
    minutes = CFG["SOFT_DURATION_MIN"] if kind == "SOFT" else CFG["TECH_DURATION_MIN"]
    session = AssessmentSession.objects.create(
        trainee=user, kind=kind, skill=skill, attempt_no=used + 1, question_ids=qids, option_orders=orders,
        expires_at=timezone.now() + timedelta(minutes=minutes), system_check=system_check or {},
    )
    AssessmentEvent.objects.create(session=session, event_type="START", meta={"attempt": session.attempt_no})
    if skill:
        from credentials.models import SkillRecord
        SkillRecord.objects.filter(trainee=user, skill=skill, assessment_status="NOT_ASSESSED").update(assessment_status="PENDING")
    return session


def public_questions(session):
    qs = {q.id: q for q in Question.objects.filter(id__in=session.question_ids)}
    out = []
    for qid in session.question_ids:
        q = qs.get(qid)
        if not q:
            continue
        order = session.option_orders.get(str(qid), list(range(len(q.options))))
        out.append({
            "id": q.id,
            "text": q.text,
            "options": [q.options[i] for i in order],
            "domain": DOMAIN_LABEL.get(q.domain, q.topic),
        })
    return out


def remaining_seconds(session):
    return max(0, int((session.expires_at - timezone.now()).total_seconds()))


def finalize_if_expired(session):
    if session.status == "IN_PROGRESS" and timezone.now() > session.expires_at + timedelta(seconds=CFG["GRACE_SECONDS"]):
        submit(session, auto=True)
    return session


@transaction.atomic
def submit(session, auto=False):
    if session.status != "IN_PROGRESS":
        return session
    qs = {q.id: q for q in Question.objects.filter(id__in=session.question_ids)}
    domain_tot, domain_ok = defaultdict(int), defaultdict(int)
    correct = 0
    for qid in session.question_ids:
        q = qs.get(qid)
        if not q:
            continue
        key = q.domain or q.topic or "General"
        domain_tot[key] += 1
        displayed = session.answers.get(str(qid))
        order = session.option_orders.get(str(qid), list(range(len(q.options))))
        if displayed is not None and 0 <= int(displayed) < len(order) and order[int(displayed)] == q.correct_index:
            correct += 1
            domain_ok[key] += 1
    total = len(session.question_ids) or 1
    session.correct_count = correct
    session.score = round(100 * correct / total)
    session.domain_scores = {k: round(100 * domain_ok[k] / v) for k, v in domain_tot.items()}
    session.band = band_for(session.score)
    session.passed = session.score >= CFG["PASS_MARK"]
    session.submitted_at = timezone.now()
    session.status = "AUTO_SUBMITTED" if auto else "SUBMITTED"
    session.integrity = integrity_summary(session)
    if session.integrity["flags"]:
        session.review_status = "FLAGGED"
    session.feedback = build_feedback(session)
    session.save()
    AssessmentEvent.objects.create(session=session, event_type="SUBMIT", meta={"auto": auto})
    apply_result(session)
    return session


def integrity_summary(session):
    counts = defaultdict(int)
    for e in session.events.all():
        counts[e.event_type] += 1
    total = len(session.question_ids) or 1
    allotted = (session.expires_at - session.started_at).total_seconds()
    used = (session.submitted_at - session.started_at).total_seconds()
    unanswered = total - len([k for k in session.answers if session.answers[k] is not None])
    flags = []
    if counts["TAB_SWITCH"] >= 3:
        flags.append(f"Left the exam tab {counts['TAB_SWITCH']} times")
    if counts["FOCUS_LOST"] >= 6:
        flags.append(f"Window lost focus {counts['FOCUS_LOST']} times")
    if counts["FULLSCREEN_EXIT"] >= 3:
        flags.append(f"Exited fullscreen {counts['FULLSCREEN_EXIT']} times")
    if used < allotted * 0.15 and (session.score or 0) >= 80:
        flags.append("Unusually fast completion with a high score")
    if counts["ANSWER_CHANGE"] > total * 2:
        flags.append("Very frequent answer switching")
    if counts["COPY_ATTEMPT"] >= 2:
        flags.append("Repeated copy attempts")
    return {
        "tab_switches": counts["TAB_SWITCH"], "focus_lost": counts["FOCUS_LOST"], "fullscreen_exits": counts["FULLSCREEN_EXIT"],
        "answer_changes": counts["ANSWER_CHANGE"], "skips": counts["SKIP"], "resumes": counts["RESUME"],
        "offline": counts["OFFLINE"], "copy_attempts": counts["COPY_ATTEMPT"], "unanswered": unanswered,
        "seconds_used": int(used), "seconds_allotted": int(allotted), "flags": flags,
        "note": "Signals are review indicators, not proof of misconduct.",
    }


def build_feedback(session):
    tips = []
    if session.kind == "SOFT":
        for domain, score in sorted(session.domain_scores.items(), key=lambda kv: kv[1]):
            if score < 60:
                tips.append({"area": DOMAIN_LABEL.get(domain, domain), "score": score, "tip": DOMAIN_TIPS.get(domain, "")})
    else:
        for topic, score in sorted(session.domain_scores.items(), key=lambda kv: kv[1]):
            if score < 60:
                tips.append({"area": topic, "score": score, "tip": f"Revise {topic} and practise two or three problems before retaking."})
    return tips


def apply_result(session):
    """Propagate result to skill record / profile. Flagged sessions keep competency under review."""
    from credentials.models import SkillRecord
    trainee = session.trainee
    if session.kind == "TECH" and session.skill_id:
        rec, _ = SkillRecord.objects.get_or_create(trainee=trainee, skill=session.skill)
        best = SkillRecord.objects.filter(pk=rec.pk).values_list("best_score", flat=True).first()
        valid = session.review_status in ("NONE", "CLEARED")
        if session.review_status == "FLAGGED":
            rec.assessment_status = "UNDER_REVIEW"
        elif valid and (best is None or session.score >= best):
            rec.best_score = session.score
            rec.competency_level = session.band
            rec.assessment_status = "PASSED" if session.passed else "NEEDS_IMPROVEMENT"
        elif session.review_status == "INVALIDATED" and rec.assessment_status == "UNDER_REVIEW":
            rec.assessment_status = "NOT_ASSESSED" if rec.best_score is None else (
                "PASSED" if rec.best_score >= CFG["PASS_MARK"] else "NEEDS_IMPROVEMENT")
        rec.last_assessed = session.submitted_at
        rec.save()
    title = "Assessment submitted" if session.review_status != "FLAGGED" else "Assessment under review"
    body = f"Score {session.score}/100 ({session.band.title()})."
    if session.review_status == "FLAGGED":
        body += " Some session signals need a quick review by a verification officer before the result is final."
    notify(trainee, title, body, f"/trainee/assessments/{session.id}", "SUCCESS" if session.passed else "INFO")


def review_session(session, decision, reviewer, notes=""):
    session.review_status = "CLEARED" if decision == "CLEAR" else "INVALIDATED"
    session.reviewer = reviewer
    session.review_notes = notes
    session.save()
    apply_result(session)
    notify(session.trainee, "Assessment review complete",
           "Your result is confirmed." if decision == "CLEAR" else "Your attempt was invalidated after review. You may retake it.",
           f"/trainee/assessments/{session.id}")
