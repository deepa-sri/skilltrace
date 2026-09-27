"""Competency profile, skill-gap intelligence, follow-up engine and non-placement analysis."""
import re
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from core.ai import gemini
from core.constants import LEVEL_RANK, PLACED_STATUSES
from core.utils import notify

from .models import FollowUpSchedule, NonPlacementReason, TargetRole

CFG = settings.SKILLTRACE


# ---------------- Competency profile ----------------

def soft_skill_result(user):
    from assessments.models import AssessmentSession
    sessions = AssessmentSession.objects.filter(trainee=user, kind="SOFT").exclude(status="IN_PROGRESS").exclude(review_status="INVALIDATED")
    best = sessions.order_by("-score").first()
    return best


def competency_profile(user):
    from assessments.models import AssessmentSession
    from credentials.models import CertificateRecord, SkillRecord

    soft = soft_skill_result(user)
    skills = []
    for rec in SkillRecord.objects.filter(trainee=user).select_related("skill", "certificate"):
        last = AssessmentSession.objects.filter(trainee=user, skill=rec.skill).exclude(status="IN_PROGRESS").order_by("-submitted_at").first()
        cert_status = rec.certificate.status if rec.certificate else None
        if not cert_status:
            linked = CertificateRecord.objects.filter(trainee=user, course_name__icontains=rec.skill.name).first()
            cert_status = linked.status if linked else None
        verified = rec.assessment_status == "PASSED" and (last is None or last.review_status in ("NONE", "CLEARED"))
        if rec.assessment_status == "UNDER_REVIEW":
            state = "Under review"
        elif verified:
            state = "Verified competency"
        elif rec.assessment_status == "NEEDS_IMPROVEMENT":
            state = "Retake available" if (last and last.attempt_no < CFG["MAX_ATTEMPTS"]) else "Needs improvement"
        elif rec.assessment_status == "PENDING":
            state = "Assessment pending"
        else:
            state = "Not assessed"
        skills.append({
            "skill": rec.skill.name, "skill_id": rec.skill_id, "source": rec.get_source_display(),
            "certificate_status": cert_status, "assessment_status": rec.assessment_status,
            "score": rec.best_score, "level": rec.competency_level, "state": state,
            "last_assessed": rec.last_assessed, "review_status": last.review_status if last else None,
        })
    certs = CertificateRecord.objects.filter(trainee=user)
    return {
        "soft_skill": {
            "completed": bool(soft), "passed": bool(soft and soft.passed), "score": soft.score if soft else None,
            "band": soft.band if soft else None, "domains": soft.domain_scores if soft else {},
            "review_status": soft.review_status if soft else None,
        },
        "skills": skills,
        "certificates": {
            "total": certs.count(),
            "verified": certs.filter(status="ISSUER_VERIFIED").count(),
            "in_review": certs.filter(status="MANUAL_REVIEW").count(),
        },
        "note": "Certificate verification and skill assessment are recorded separately.",
    }


# ---------------- Skill gap ----------------

LEARNING_STEPS = {
    "SQL": ["Practise SELECT with WHERE and ORDER BY", "Learn JOINs and GROUP BY aggregations", "Solve 10 practice queries on a sample sales table"],
    "Python Programming": ["Revise loops, lists and dictionaries", "Write small scripts that read and summarise a CSV file", "Practise code-tracing questions"],
    "MS Excel": ["Practise VLOOKUP/XLOOKUP and SUMIF", "Build a pivot table from sample data", "Format a clean monthly report"],
    "Tally & GST Accounting": ["Revise journal and ledger entries", "Practise GST invoice entries in Tally", "Reconcile a sample bank statement"],
    "Electrical Wiring": ["Revise series and parallel circuits", "Study IS standards for domestic wiring and earthing", "Practise fault-finding with a multimeter"],
    "Digital Literacy": ["Practise email, file management and cloud storage", "Learn to spot phishing and set strong passwords", "Fill an online government form end to end"],
    "Customer Service": ["Practise greeting and needs-probing scripts", "Role-play handling a complaint calmly", "Learn basic POS and billing flow"],
    "Web Development": ["Revise semantic HTML and responsive CSS", "Build one small interactive page with JavaScript", "Learn how forms send data to an API"],
}


def _required_level(level):
    return LEVEL_RANK.get(level, 3)


def skill_gap(user, role: TargetRole):
    from credentials.models import SkillRecord
    records = {r.skill.name.lower(): r for r in SkillRecord.objects.filter(trainee=user).select_related("skill")}
    soft = soft_skill_result(user)
    gaps, met = [], []
    for req in role.required:
        name, level = req["skill"], req.get("level", "INTERMEDIATE")
        rec = records.get(name.lower())
        have = rec.competency_level if (rec and rec.assessment_status in ("PASSED", "NEEDS_IMPROVEMENT")) else "NOT_ASSESSED"
        entry = {"skill": name, "required": level, "current": have, "score": rec.best_score if rec else None}
        if LEVEL_RANK.get(have, 0) >= _required_level(level):
            entry["evidence"] = f"Assessed {rec.best_score}/100 on {rec.last_assessed:%d %b %Y}"
            met.append(entry)
        else:
            if not rec:
                entry["evidence"] = "Skill not declared in your profile"
                entry["action"] = "declare_and_assess"
            elif have == "NOT_ASSESSED":
                entry["evidence"] = "Declared but not yet assessed, so competency is unverified"
                entry["action"] = "assess"
            else:
                entry["evidence"] = f"Assessed {rec.best_score}/100 ({have.title()}); role needs {level.title()}"
                entry["action"] = "improve_and_retake"
            entry["steps"] = LEARNING_STEPS.get(name, [f"Complete a short course on {name}", f"Practise {name} tasks", "Retake the assessment"])
            gaps.append(entry)
    soft_gap = None
    if not soft:
        soft_gap = {"area": "Soft skills", "evidence": "Mandatory soft-skill assessment not completed yet"}
    elif (soft.score or 0) < role.soft_skill_min:
        weak = [k for k, v in soft.domain_scores.items() if v < 60]
        soft_gap = {"area": "Soft skills", "evidence": f"Scored {soft.score}/100, role expects {role.soft_skill_min}", "weak_domains": weak}
    readiness = round(100 * len(met) / max(1, len(role.required)))
    if soft_gap:
        readiness = max(0, readiness - 10)
    plan, plan_source = build_plan(user, role, gaps, soft_gap)
    return {
        "role": {"id": role.id, "name": role.name, "sector": role.sector},
        "readiness": readiness, "met": met, "gaps": gaps, "soft_gap": soft_gap,
        "plan": plan, "plan_source": plan_source,
    }


def build_plan(user, role, gaps, soft_gap):
    rules = []
    for g in gaps:
        rules.append({"title": f"Build {g['skill']} to {g['required'].title()}", "why": g["evidence"], "steps": g["steps"]})
    if soft_gap:
        rules.append({"title": "Strengthen workplace soft skills", "why": soft_gap["evidence"],
                      "steps": ["Complete the soft-skill practice module", "Practise mock interviews with a peer", "Take or retake the soft-skill assessment"]})
    rules.append({"title": "Reassess and apply", "why": "Verified competency improves placement chances", "steps": [f"Retake assessments for {role.name} skills", "Update your employment status after applying"]})
    if not gaps and not soft_gap:
        return rules[-1:], "rules"
    prompt = (
        "You are a career counsellor for government skilling programmes in Maharashtra, India. "
        f"A trainee targets the role '{role.name}'. Evidence-linked gaps: {[{k: g[k] for k in ('skill', 'required', 'current', 'evidence')} for g in gaps]}. "
        f"Soft-skill gap: {soft_gap}. Write a 4-week improvement plan as JSON: a list of objects with keys "
        "'title' (short), 'why' (quote the evidence), 'steps' (3 concrete, low-cost actions using free resources such as Skill India Digital Hub). "
        "Keep language simple. Do not invent scores."
    )
    ai = gemini(prompt, json_mode=True)
    if isinstance(ai, list) and ai and all(isinstance(x, dict) and "title" in x for x in ai):
        return ai[:6], "gemini"
    return rules, "rules"


# ---------------- Non-placement categorisation ----------------

KEYWORDS = [
    ("LOCATION", r"\b(far|distance|travel|location|relocat|village|transport|commute)\b"),
    ("WAGE_EXPECTATION", r"\b(salary|pay|wage|low pay|stipend|money)\b"),
    ("LACK_EXPERIENCE", r"\b(experience|fresher|no exp)\b"),
    ("COMMUNICATION", r"\b(english|interview|speak|communicat|language)\b"),
    ("INCOMPLETE_CERT", r"\b(certificate|not certified|result pending|exam pending)\b"),
    ("SKILL_MISMATCH", r"\b(skill|mismatch|not relevant|different skills|outdated)\b"),
    ("NO_OPPORTUNITIES", r"\b(no jobs?|no vacanc|no opening|no company|no opportunit)\b"),
    ("FURTHER_EDUCATION", r"\b(study|college|degree|admission|higher education)\b"),
    ("PERSONAL", r"\b(family|health|marriage|child|care|personal|sick)\b"),
]


def categorise_reason(text):
    text = (text or "").strip()
    if not text:
        return "OTHER", "RULES"
    ai = gemini(
        "Classify this reason an Indian skilling trainee gives for not getting a job into exactly one category "
        f"from {[c for c, _ in NonPlacementReason.CATEGORIES]}. Reply as JSON {{\"category\": \"...\"}}. Reason: " + text[:500],
        json_mode=True, temperature=0,
    )
    valid = {c for c, _ in NonPlacementReason.CATEGORIES}
    if isinstance(ai, dict) and ai.get("category") in valid:
        return ai["category"], "GEMINI"
    low = text.lower()
    for cat, pattern in KEYWORDS:
        if re.search(pattern, low):
            return cat, "RULES"
    return "OTHER", "RULES"


INTERVENTIONS = {
    "SKILL_MISMATCH": "Take a technical reassessment and a short bridge course aligned to local job demand",
    "LACK_EXPERIENCE": "Explore apprenticeship pathways (NAPS) to build work experience",
    "LOCATION": "View local opportunities in your district and consider self-employment support",
    "WAGE_EXPECTATION": "Compare typical entry wages for your role and district before applying",
    "NO_OPPORTUNITIES": "Register on the state employment portal and review apprenticeships in nearby districts",
    "INCOMPLETE_CERT": "Contact your provider to complete certification, then upload it for verification",
    "COMMUNICATION": "Practise interview communication and retake the soft-skill module",
    "PERSONAL": "Talk to a career counsellor about flexible or part-time options",
    "FURTHER_EDUCATION": "Record your education plans so follow-ups adjust accordingly",
    "OTHER": "Book a career counselling session",
}


# ---------------- Follow-up engine ----------------

def run_followups(today=None):
    """Send due follow-ups (in-app channel), retry, and mark unreachable after max attempts."""
    today = today or timezone.localdate()
    sent = unreachable = 0
    due = FollowUpSchedule.objects.filter(due_date__lte=today, status__in=["SCHEDULED", "SENT"]).select_related("enrollment__programme", "trainee")
    for f in due:
        profile = getattr(f.trainee, "profile", None)
        if profile and not profile.has_consent("EMPLOYMENT_FOLLOWUP"):
            continue
        if f.status == "SENT" and f.last_sent_at and f.last_sent_at.date() > today - timedelta(days=7):
            continue  # wait a week between reminders
        if f.attempts >= CFG["FOLLOWUP_MAX_ATTEMPTS"]:
            f.status = "UNREACHABLE"
            f.save(update_fields=["status"])
            unreachable += 1
            continue
        f.attempts += 1
        f.status = "SENT"
        f.last_sent_at = timezone.now()
        f.save(update_fields=["attempts", "status", "last_sent_at"])
        notify(f.trainee, f"Follow-up: {f.get_milestone_display()}",
               f"How are things after {f.enrollment.programme.name}? It takes one minute to update.",
               "/trainee/followups", "ACTION")
        sent += 1
    return {"sent": sent, "unreachable": unreachable, "run_on": str(today)}


def months_since_completion(user):
    from training.models import TrainingEnrollment
    e = TrainingEnrollment.objects.filter(trainee=user, status="COMPLETED", completion_date__isnull=False).order_by("-completion_date").first()
    if not e:
        return None, None
    days = (timezone.localdate() - e.completion_date).days
    return e, max(0, days // 30)


def is_placed(status):
    return status in PLACED_STATUSES
