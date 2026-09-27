"""Aggregate analytics. Only trainees who consented to GOVT_ANALYTICS are counted, and groups
smaller than SMALL_CELL_THRESHOLD are suppressed to avoid re-identification."""
from collections import Counter, defaultdict
from statistics import mean

from django.conf import settings

from assessments.models import SOFT_DOMAINS, AssessmentSession
from core.constants import DISTRICTS, EMPLOYMENT_STATUS, PLACED_STATUSES
from core.models import TraineeProfile
from credentials.models import CertificateRecord, SkillRecord
from outcomes.models import EmploymentOutcome, FollowUpSchedule, NonPlacementReason, TargetRole
from outcomes.services import INTERVENTIONS
from training.models import SkillingProgramme, SkillingProvider, TrainingEnrollment

K = settings.SKILLTRACE["SMALL_CELL_THRESHOLD"]


def pct(a, b):
    return round(100 * a / b, 1) if b else None


def avg(values):
    values = [v for v in values if v is not None]
    return round(mean(values)) if values else None


def compute(filters=None, provider_id=None):
    filters = filters or {}
    profiles = TraineeProfile.objects.filter(user__anonymised=False).select_related("user")
    profiles = [p for p in profiles if p.consent_state.get("GOVT_ANALYTICS")]
    if filters.get("district"):
        profiles = [p for p in profiles if p.district == filters["district"]]
    if filters.get("gender"):
        profiles = [p for p in profiles if p.gender == filters["gender"]]

    enr_qs = TrainingEnrollment.objects.select_related("programme", "programme__provider")
    if provider_id:
        enr_qs = enr_qs.filter(programme__provider_id=provider_id)
    if filters.get("programme"):
        enr_qs = enr_qs.filter(programme_id=filters["programme"])
    if filters.get("sector"):
        enr_qs = enr_qs.filter(programme__sector=filters["sector"])
    if filters.get("provider"):
        enr_qs = enr_qs.filter(programme__provider_id=filters["provider"])
    if filters.get("cohort"):
        enr_qs = enr_qs.filter(cohort__startswith=str(filters["cohort"]))
    scoped = bool(provider_id or filters.get("programme") or filters.get("sector") or filters.get("provider") or filters.get("cohort"))

    ids = {p.user_id for p in profiles}
    enrollments = [e for e in enr_qs if e.trainee_id in ids]
    if scoped:
        ids = {e.trainee_id for e in enrollments}
        profiles = [p for p in profiles if p.user_id in ids]
    prof_by_user = {p.user_id: p for p in profiles}

    enr_by_user = defaultdict(list)
    for e in enrollments:
        enr_by_user[e.trainee_id].append(e)
    completed_users = {e.trainee_id for e in enrollments if e.status == "COMPLETED"}

    outcomes_all = [o for o in EmploymentOutcome.objects.filter(trainee_id__in=ids)]
    current = {}
    for o in sorted(outcomes_all, key=lambda o: o.recorded_at):
        if o.is_current:
            current[o.trainee_id] = o
    sessions = list(AssessmentSession.objects.filter(trainee_id__in=ids).exclude(status="IN_PROGRESS").exclude(review_status="INVALIDATED").select_related("skill"))
    certs = list(CertificateRecord.objects.filter(trainee_id__in=ids).values("trainee_id", "status"))
    skills = list(SkillRecord.objects.filter(trainee_id__in=ids).select_related("skill"))
    followups = list(FollowUpSchedule.objects.filter(trainee_id__in=ids).values("trainee_id", "milestone", "status", "enrollment_id"))
    reasons = list(NonPlacementReason.objects.filter(trainee_id__in=ids).values("trainee_id", "category"))

    soft_users = {s.trainee_id for s in sessions if s.kind == "SOFT"}
    soft_pass = {s.trainee_id for s in sessions if s.kind == "SOFT" and s.passed}
    tech_users = {s.trainee_id for s in sessions if s.kind == "TECH"}
    placed_users = {u for u, o in current.items() if o.status in PLACED_STATUSES and u in completed_users}
    with_outcome = {u for u in current if u in completed_users}
    fu_due = [f for f in followups if f["status"] in ("SENT", "RESPONDED", "UNREACHABLE")]
    fu_resp = [f for f in fu_due if f["status"] == "RESPONDED"]
    incomes = [o.monthly_income for u, o in current.items() if u in placed_users and o.monthly_income]

    kpis = {
        "registered": len(profiles),
        "enrolled": len(enr_by_user),
        "completed": len(completed_users),
        "completion_rate": pct(len(completed_users), len(enr_by_user)),
        "dropout_rate": pct(len({e.trainee_id for e in enrollments if e.status == "DROPOUT"}), len(enr_by_user)),
        "soft_assessed": len(soft_users),
        "soft_pass_rate": pct(len(soft_pass), len(soft_users)),
        "tech_assessed": len(tech_users),
        "certificates": len(certs),
        "cert_verified_rate": pct(sum(1 for c in certs if c["status"] == "ISSUER_VERIFIED"), len(certs)),
        "placed": len(placed_users),
        "placement_rate": pct(len(placed_users), len(completed_users)),
        "self_employed": sum(1 for u in placed_users if current[u].status == "SELF_EMPLOYED"),
        "apprentices": sum(1 for u in placed_users if current[u].status == "APPRENTICE"),
        "avg_income": avg(incomes),
        "followup_response_rate": pct(len(fu_resp), len(fu_due)),
        "employer_verified_rate": pct(sum(1 for u in placed_users if current[u].verification_status == "CONFIRMED"), len(placed_users)),
        "outcome_known_rate": pct(len(with_outcome), len(completed_users)),
    }
    d180 = [f for f in followups if f["milestone"] == "D180" and f["status"] == "RESPONDED"]
    retained = sum(1 for f in d180 if f["trainee_id"] in placed_users)
    kpis["retention_d180"] = pct(retained, len(d180))

    funnel = [
        {"stage": "Registered", "count": len(profiles)},
        {"stage": "Enrolled", "count": len(enr_by_user)},
        {"stage": "Completed training", "count": len(completed_users)},
        {"stage": "Soft-skill assessed", "count": len(soft_users & completed_users) if completed_users else len(soft_users)},
        {"stage": "Technical assessed", "count": len(tech_users & completed_users) if completed_users else len(tech_users)},
        {"stage": "Placed", "count": len(placed_users)},
    ]

    status_label = dict(EMPLOYMENT_STATUS)
    oc = Counter(current[u].status for u in with_outcome)
    outcome_dist = [{"status": status_label[s], "code": s, "count": c} for s, c in oc.most_common()]

    # District intelligence
    districts = []
    for code, name, division, (row, col) in DISTRICTS:
        users = {p.user_id for p in profiles if p.district == code}
        comp = users & completed_users
        placed = users & placed_users
        inc = [current[u].monthly_income for u in placed if current[u].monthly_income]
        dfu = [f for f in fu_due if f["trainee_id"] in users]
        suppressed = 0 < len(users) < K
        districts.append({
            "code": code, "name": name, "division": division, "row": row, "col": col,
            "trainees": len(users) if not suppressed else None,
            "completed": len(comp) if not suppressed else None,
            "placement_rate": pct(len(placed), len(comp)) if not suppressed and len(comp) >= K else None,
            "avg_income": avg(inc) if not suppressed and len(inc) >= K else None,
            "followup_rate": pct(sum(1 for f in dfu if f["status"] == "RESPONDED"), len(dfu)) if not suppressed else None,
            "soft_pass_rate": pct(len(users & soft_pass), len(users & soft_users)) if not suppressed else None,
            "suppressed": suppressed,
        })

    # Provider & programme scorecards
    def scorecard(key_fn, meta_fn):
        groups = defaultdict(list)
        for e in enrollments:
            groups[key_fn(e)].append(e)
        rows = []
        for key, items in groups.items():
            users = {e.trainee_id for e in items}
            comp = {e.trainee_id for e in items if e.status == "COMPLETED"}
            placed = comp & placed_users
            tech = [s for s in sessions if s.trainee_id in users and s.kind == "TECH"]
            ucerts = [c for c in certs if c["trainee_id"] in users]
            inc = [current[u].monthly_income for u in placed if current[u].monthly_income]
            row = {**meta_fn(items[0]), "enrolled": len(users),
                   "completion_rate": pct(len(comp), len(users)),
                   "assessment_pass_rate": pct(sum(1 for s in tech if s.passed), len(tech)),
                   "cert_verified_rate": pct(sum(1 for c in ucerts if c["status"] == "ISSUER_VERIFIED"), len(ucerts)),
                   "placement_rate": pct(len(placed), len(comp)),
                   "avg_income": avg(inc),
                   "small_sample": len(users) < K * 2}
            parts = [(row["completion_rate"], 0.2), (row["assessment_pass_rate"], 0.25), (row["placement_rate"], 0.4), (row["cert_verified_rate"], 0.15)]
            num = sum((v or 0) * w for v, w in parts if v is not None)
            den = sum(w for v, w in parts if v is not None)
            row["effectiveness_index"] = round(num / den) if den else None
            rows.append(row)
        return sorted(rows, key=lambda r: -(r["effectiveness_index"] or 0))

    providers = scorecard(lambda e: e.programme.provider_id, lambda e: {
        "id": e.programme.provider_id, "name": e.programme.provider.name, "type": e.programme.provider.get_provider_type_display(),
        "district": e.programme.provider.get_district_display()})
    programmes = scorecard(lambda e: e.programme_id, lambda e: {
        "id": e.programme_id, "name": e.programme.name, "code": e.programme.code, "sector": e.programme.sector,
        "scheme": e.programme.funding_scheme, "provider": e.programme.provider.name})

    # Skill intelligence
    demand = Counter()
    for role in TargetRole.objects.all():
        for req in role.required:
            demand[req["skill"]] += role.openings
    supply, assessed, scores, needs = Counter(), Counter(), defaultdict(list), Counter()
    for r in skills:
        if r.assessment_status == "PASSED":
            supply[r.skill.name] += 1
        if r.best_score is not None:
            assessed[r.skill.name] += 1
            scores[r.skill.name].append(r.best_score)
        if r.assessment_status == "NEEDS_IMPROVEMENT":
            needs[r.skill.name] += 1
    skill_rows = []
    for name in set(demand) | set(assessed):
        skill_rows.append({"skill": name, "demand": demand.get(name, 0), "verified_supply": supply.get(name, 0),
                           "assessed": assessed.get(name, 0), "avg_score": avg(scores.get(name, [])),
                           "needs_improvement": needs.get(name, 0)})
    skill_rows.sort(key=lambda r: -r["demand"])

    topic_scores = defaultdict(list)
    for s in sessions:
        if s.kind == "TECH":
            for topic, v in (s.domain_scores or {}).items():
                topic_scores[(s.skill.name if s.skill else "", topic)].append(v)
    weak_topics = sorted(
        [{"skill": k[0], "topic": k[1], "avg": avg(v), "n": len(v)} for k, v in topic_scores.items() if len(v) >= K],
        key=lambda r: r["avg"])[:8]

    dom = defaultdict(list)
    for s in sessions:
        if s.kind == "SOFT":
            for d, v in (s.domain_scores or {}).items():
                dom[d].append(v)
    soft_domains = [{"domain": label, "code": code, "avg": avg(dom.get(code, []))} for code, label in SOFT_DOMAINS]

    npl_label = dict(NonPlacementReason.CATEGORIES)
    npc = Counter(r["category"] for r in reasons)
    non_placement = [{"category": npl_label[c], "code": c, "count": n, "intervention": INTERVENTIONS.get(c)} for c, n in npc.most_common()]

    buckets = [("0-3 m", 0, 3), ("3-6 m", 3, 6), ("6-12 m", 6, 12), ("12-24 m", 12, 24)]
    wage = []
    for label, lo, hi in buckets:
        vals = [o.monthly_income for o in outcomes_all if o.monthly_income and o.months_since_training is not None and lo <= o.months_since_training < hi and o.status in PLACED_STATUSES]
        wage.append({"period": label, "avg_income": avg(vals) if len(vals) >= K else None, "n": len(vals)})

    cert_label = dict(CertificateRecord.STATUS)
    cert_dist = [{"status": cert_label[s], "code": s, "count": n} for s, n in Counter(c["status"] for c in certs).most_common()]
    ver_label = dict(EmploymentOutcome.VERIFICATION)
    emp_ver = [{"status": ver_label[s], "code": s, "count": n} for s, n in Counter(current[u].verification_status for u in placed_users).most_common()]

    fu_rows = []
    for code, label in FollowUpSchedule.MILESTONES:
        items = [f for f in followups if f["milestone"] == code]
        c = Counter(f["status"] for f in items)
        fu_rows.append({"milestone": code, "label": label, "scheduled": c["SCHEDULED"], "sent": c["SENT"], "responded": c["RESPONDED"], "unreachable": c["UNREACHABLE"]})

    gender_rows = []
    for g, label in (("F", "Female"), ("M", "Male"), ("O", "Other")):
        users = {p.user_id for p in profiles if p.gender == g}
        comp = users & completed_users
        if len(users) >= K:
            gender_rows.append({"gender": label, "trainees": len(users), "placement_rate": pct(len(comp & placed_users), len(comp))})

    result = {
        "kpis": kpis, "funnel": funnel, "outcomes": outcome_dist, "districts": districts,
        "providers": providers, "programmes": programmes, "skills": skill_rows, "weak_topics": weak_topics,
        "soft_domains": soft_domains, "non_placement": non_placement, "wage_progression": wage,
        "certificate_verification": cert_dist, "employment_verification": emp_ver, "followups": fu_rows,
        "gender": gender_rows, "small_cell_threshold": K,
    }
    result["recommendations"] = recommendations(result)
    return result


def recommendations(r):
    recs = []
    overall = r["kpis"]["placement_rate"] or 0
    for p in r["programmes"]:
        if p["placement_rate"] is not None and not p["small_sample"] and p["placement_rate"] < overall - 8:
            recs.append({"level": "Programme", "target": p["name"], "severity": "high",
                         "finding": f"Placement {p['placement_rate']}% vs state average {overall}%",
                         "action": "Review curriculum-to-job alignment and strengthen employer tie-ups for this programme."})
    for s in r["skills"]:
        if s["avg_score"] is not None and s["assessed"] >= 5 and s["avg_score"] < 55:
            recs.append({"level": "Curriculum", "target": s["skill"], "severity": "medium",
                         "finding": f"Average assessed score {s['avg_score']}/100 across {s['assessed']} trainees",
                         "action": f"Add practical lab hours and reassessment for {s['skill']} in programmes that teach it."})
    capacity = sorted([s for s in r["skills"] if s["demand"] >= 20 and s["verified_supply"] * 4 < s["demand"]],
                      key=lambda s: -(s["demand"] / max(1, s["verified_supply"])))[:2]
    for s in capacity:
        recs.append({"level": "Capacity", "target": s["skill"], "severity": "medium",
                     "finding": f"{s['demand']} demo openings vs {s['verified_supply']} verified trainees",
                     "action": f"Expand seats or bridge courses for {s['skill']}."})
    if r["non_placement"]:
        top = r["non_placement"][0]
        recs.append({"level": "Intervention", "target": top["category"], "severity": "high",
                     "finding": f"Most common non-placement reason ({top['count']} trainees)", "action": top["intervention"]})
    low_fu = [d for d in r["districts"] if d["followup_rate"] is not None and d["followup_rate"] < 45 and (d["trainees"] or 0) >= 5]
    if low_fu:
        names = ", ".join(d["name"] for d in low_fu[:4])
        recs.append({"level": "Follow-up", "target": names, "severity": "low",
                     "finding": "Follow-up response below 45%", "action": "Pilot an additional channel (SMS or IVR) and provider-assisted calls in these districts."})
    weak = [d for d in r["soft_domains"] if d["avg"] is not None and d["avg"] < 60]
    if weak:
        recs.append({"level": "Soft skills", "target": ", ".join(d["domain"] for d in weak), "severity": "medium",
                     "finding": "Average domain score below 60", "action": "Embed short workplace-readiness modules in all programmes."})
    order = {"high": 0, "medium": 1, "low": 2}
    return sorted(recs, key=lambda x: order[x["severity"]])[:10]
