"""Seed SkillTrace with clearly labelled FICTIONAL demo data.

    python manage.py seed_demo            # seed (skips if already seeded)
    python manage.py seed_demo --reset    # wipe demo data and reseed

All people, organisations and numbers are synthetic and must not be presented as government statistics.
"""
import random
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from assessments.models import SOFT_DOMAINS, AssessmentEvent, AssessmentSession, Question
from assessments.question_bank import SOFT, TECH
from core.constants import DISTRICTS, PLACED_STATUSES, band_for
from core.models import AuditLog, ConsentRecord, Notification, TraineeProfile, User, UTISequence
from credentials.models import CertificateRecord, IssuedCertificate, Issuer, SkillRecord, SkillTaxonomy
from outcomes.models import EmployerVerification, EmploymentOutcome, FollowUpSchedule, NonPlacementReason, TargetRole
from training.models import SkillingProgramme, SkillingProvider, TrainingEnrollment

PASSWORD = "Demo@1234"
CONSENTS = ["TRAINING_RECORDS", "CERT_VERIFICATION", "SKILL_ASSESSMENT", "EMPLOYMENT_FOLLOWUP", "GOVT_ANALYTICS", "EMPLOYER_VERIFICATION"]

SKILLS = [
    ("Python Programming", "PROGRAMMING"), ("SQL", "DATA"), ("MS Excel", "DATA"), ("Tally & GST Accounting", "ACCOUNTING"),
    ("Electrical Wiring", "ELECTRICAL"), ("Digital Literacy", "DIGITAL"), ("Customer Service", "RETAIL"), ("Web Development", "PROGRAMMING"),
    ("Solar PV Installation", "ELECTRICAL"), ("Welding", "TRADE"), ("Retail Sales", "RETAIL"), ("Patient Care Basics", "HEALTHCARE"),
    ("Data Entry", "DIGITAL"), ("Spoken English", "COMMUNICATION"), ("Two-Wheeler Servicing", "TRADE"), ("Plumbing", "TRADE"),
]

ISSUERS = [
    ("National Council for Vocational Education and Training", "NCVET", "GOVT", ["NCVET", "Skill India"], True),
    ("IT-ITeS Sector Skill Council", "SSCIT", "SSC", ["NASSCOM SSC", "IT ITeS SSC"], True),
    ("Electronics Sector Skills Council of India", "ESSCI", "SSC", ["ESSCI"], True),
    ("Retailers Association's Skill Council of India", "RASCI", "SSC", ["RASCI", "Retail SSC"], True),
    ("Healthcare Sector Skill Council", "HSSC", "SSC", ["HSSC"], True),
    ("Management & Entrepreneurship and Professional Skills Council", "MEPSC", "SSC", ["MEPSC"], True),
    ("OpenLearn Online (demo platform)", "OLO", "PRIVATE", ["OpenLearn"], False),
]

PROVIDERS = [
    ("Govt ITI Pune (demo)", "PRV-ITIPNE", "ITI", "PNE", "NCVET", "NCVET affiliated"),
    ("Nagpur Skill Development Centre (demo)", "PRV-NSDC", "GOVT", "NGP", "ESSCI", "State accredited"),
    ("Sahyadri Skills Foundation (demo)", "PRV-SSF", "NGO", "KLP", "MEPSC", "PMKVY partner"),
    ("Konkan TechSkills Pvt Ltd (demo)", "PRV-KTS", "PRIVATE", "THN", "SSCIT", "PMKVY partner"),
    ("Marathwada Rural Livelihood Academy (demo)", "PRV-MRLA", "NGO", "AUR", "ESSCI", "DDU-GKY partner"),
    ("Nashik Industrial Training Hub (demo)", "PRV-NITH", "PRIVATE", "NSK", "RASCI", "State accredited"),
]

# code, name, provider code, sector, scheme, hours, skills, quality (drives synthetic outcomes)
PROGRAMMES = [
    ("PMKVY-IT-JDA", "Junior Data Analyst", "PRV-KTS", "IT-ITeS", "PMKVY 4.0", 390, ["SQL", "MS Excel", "Python Programming"], 0.72),
    ("PMKVY-IT-JWD", "Junior Web Developer", "PRV-KTS", "IT-ITeS", "PMKVY 4.0", 420, ["Web Development", "Python Programming"], 0.66),
    ("NSDC-HLP", "Domestic IT Helpdesk Attendant", "PRV-NSDC", "IT-ITeS", "State scheme (MSSDS)", 300, ["Digital Literacy", "Customer Service"], 0.58),
    ("ITI-ELEC", "Electrician Domestic", "PRV-ITIPNE", "Electronics", "State scheme (MSSDS)", 480, ["Electrical Wiring"], 0.78),
    ("DDU-SOLAR", "Solar PV Installer", "PRV-MRLA", "Green Jobs", "DDU-GKY", 360, ["Solar PV Installation", "Electrical Wiring"], 0.61),
    ("PMKVY-ACC", "Accounts Assistant using Tally", "PRV-SSF", "BFSI", "PMKVY 4.0", 400, ["Tally & GST Accounting", "MS Excel"], 0.64),
    ("RASCI-RSA", "Retail Sales Associate", "PRV-NITH", "Retail", "CSR programme", 280, ["Customer Service", "Retail Sales"], 0.55),
    ("DDU-DEO", "Digital Literacy and Data Entry", "PRV-MRLA", "IT-ITeS", "DDU-GKY", 240, ["Digital Literacy", "Data Entry", "MS Excel"], 0.47),
    ("NSDC-GDA", "General Duty Assistant", "PRV-NSDC", "Healthcare", "PMKVY 4.0", 420, ["Patient Care Basics", "Spoken English"], 0.69),
]

ROLES = [
    ("Junior Data Analyst", "IT-ITeS", [("SQL", "INTERMEDIATE"), ("MS Excel", "INTERMEDIATE"), ("Python Programming", "BASIC")], 120),
    ("IT Helpdesk Executive", "IT-ITeS", [("Digital Literacy", "INTERMEDIATE"), ("Customer Service", "INTERMEDIATE")], 90),
    ("Domestic Electrician", "Electronics", [("Electrical Wiring", "INTERMEDIATE")], 150),
    ("Accounts Assistant", "BFSI", [("Tally & GST Accounting", "INTERMEDIATE"), ("MS Excel", "BASIC")], 110),
    ("Retail Sales Associate", "Retail", [("Customer Service", "INTERMEDIATE")], 200),
    ("Junior Web Developer", "IT-ITeS", [("Web Development", "INTERMEDIATE"), ("Python Programming", "BASIC")], 70),
    ("Data Entry Operator", "IT-ITeS", [("Digital Literacy", "BASIC"), ("MS Excel", "BASIC")], 130),
]

EMPLOYERS = {
    "IT-ITeS": ["Sahyadri Analytics Pvt Ltd (demo)", "Deccan Data Services (demo)", "Pune InfoServe (demo)"],
    "Electronics": ["Shivneri Electricals (demo)", "Vidarbha Power Works (demo)"],
    "Green Jobs": ["SunRise Solar Installers (demo)", "Godavari Green Energy (demo)"],
    "BFSI": ["Kolhapur Traders Co-op (demo)", "Warana Accounts Bureau (demo)"],
    "Retail": ["Nashik Mega Mart (demo)", "Konkan Retail Chain (demo)"],
    "Healthcare": ["Sanjeevani Hospital (demo)", "Aarogya Care Centre (demo)"],
}
BASE_WAGE = {"IT-ITeS": 14000, "Electronics": 13000, "Green Jobs": 12500, "BFSI": 12000, "Retail": 11000, "Healthcare": 12000}

FIRST_F = ["Priya", "Sneha", "Pooja", "Aarti", "Kavita", "Snehal", "Rutuja", "Pallavi", "Shruti", "Neha", "Komal", "Ashwini", "Mayuri", "Sayali", "Ayesha", "Farzana", "Rekha", "Jyoti"]
FIRST_M = ["Rahul", "Amit", "Sagar", "Rohan", "Akshay", "Vikas", "Omkar", "Sachin", "Nikhil", "Tushar", "Ganesh", "Mahesh", "Imran", "Sameer", "Pratik", "Yogesh", "Aniket", "Suraj"]
LAST = ["Patil", "Deshmukh", "Jadhav", "Pawar", "Shinde", "Kulkarni", "More", "Gaikwad", "Chavan", "Kale", "Bhosale", "Joshi", "Sawant", "Wagh", "Shaikh", "Khan", "Rathod", "Kamble", "Salunkhe", "Thakur"]
DISTRICT_WEIGHTS = {"PNE": 9, "MSU": 6, "THN": 7, "MUM": 4, "NGP": 7, "NSK": 6, "AUR": 5, "KLP": 4, "SLP": 3, "AHM": 3}
REASONS = ["SKILL_MISMATCH", "LACK_EXPERIENCE", "LOCATION", "WAGE_EXPECTATION", "NO_OPPORTUNITIES", "INCOMPLETE_CERT", "COMMUNICATION", "PERSONAL", "FURTHER_EDUCATION"]
REASON_WEIGHTS = [18, 16, 14, 8, 12, 6, 12, 8, 6]
REASON_NOTES = {
    "SKILL_MISMATCH": "Companies asked for skills that were not covered well in the course",
    "LACK_EXPERIENCE": "Most openings want 1 year experience",
    "LOCATION": "Jobs are in Pune or Mumbai, too far from my village",
    "WAGE_EXPECTATION": "Offered salary was too low to cover travel",
    "NO_OPPORTUNITIES": "No openings nearby in my trade",
    "INCOMPLETE_CERT": "Certificate result is still pending",
    "COMMUNICATION": "Could not clear interviews conducted in English",
    "PERSONAL": "Family responsibilities at home",
    "FURTHER_EDUCATION": "Took admission for diploma",
}


def completion_ts(d, offset_days):
    from datetime import datetime, time
    return timezone.make_aware(datetime.combine(d + timedelta(days=offset_days), time(11, 0)))


class Command(BaseCommand):
    help = "Seed fictional demo data for SkillTrace"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true")
        parser.add_argument("--trainees", type=int, default=260)

    def handle(self, *args, **opts):
        random.seed(2026)
        if opts["reset"]:
            self.reset()
        elif User.objects.filter(is_demo=True).exists():
            self.stdout.write(self.style.WARNING("Demo data already present. Use --reset to reseed."))
            return
        with transaction.atomic():
            self.today = timezone.localdate()
            self.reference()
            self.accounts()
            self.synthetic(opts["trainees"])
            self.priya()
        self.make_sample_certificates()
        self.stdout.write(self.style.SUCCESS("Demo data ready. All demo passwords: " + PASSWORD))

    # ------------------------------------------------------------------
    def reset(self):
        self.stdout.write("Removing demo data...")
        User.objects.filter(is_demo=True).delete()
        for m in (AuditLog, Question, TargetRole, IssuedCertificate, SkillingProgramme, SkillingProvider, Issuer, SkillTaxonomy, UTISequence):
            m.objects.all().delete()

    def reference(self):
        self.skills = {n: SkillTaxonomy.objects.get_or_create(name=n, defaults={"category": c})[0] for n, c in SKILLS}
        for domain, items in SOFT.items():
            for text, opts, correct, expl in items:
                Question.objects.get_or_create(kind="SOFT", domain=domain, text=text, defaults={"options": opts, "correct_index": correct, "explanation": expl, "topic": dict(SOFT_DOMAINS)[domain]})
        for skill, items in TECH.items():
            for topic, diff, text, opts, correct, expl in items:
                Question.objects.get_or_create(kind="TECH", skill=self.skills[skill], text=text, defaults={"options": opts, "correct_index": correct, "explanation": expl, "topic": topic, "difficulty": diff})
        self.issuers = {}
        for name, code, typ, aliases, lookup in ISSUERS:
            self.issuers[code] = Issuer.objects.get_or_create(code=code, defaults={"name": name, "issuer_type": typ, "aliases": aliases, "supports_lookup": lookup})[0]
        self.providers = {}
        for name, code, typ, dist, issuer, accr in PROVIDERS:
            self.providers[code] = SkillingProvider.objects.get_or_create(code=code, defaults={
                "name": name, "provider_type": typ, "district": dist, "issuer": self.issuers[issuer], "accreditation": accr, "is_demo": True})[0]
        self.programmes, self.quality = {}, {}
        for code, name, prov, sector, scheme, hours, skills, q in PROGRAMMES:
            p = self.providers[prov]
            self.programmes[code] = SkillingProgramme.objects.get_or_create(code=code, defaults={
                "provider": p, "name": name, "sector": sector, "funding_scheme": scheme, "duration_hours": hours,
                "target_skills": skills, "district": p.district, "nsqf_level": random.choice([3, 4, 4, 5]),
                "qp_code": f"QP/{code[-3:]}/{random.randint(100, 999)}", "cohort_size": 30,
                "start_date": self.today - timedelta(days=120), "end_date": self.today + timedelta(days=60),
                "description": f"Fictional demo programme: {name} under {scheme}."})[0]
            self.quality[code] = q
        for name, sector, req, openings in ROLES:
            TargetRole.objects.get_or_create(name=name, defaults={"sector": sector, "required": [{"skill": s, "level": l} for s, l in req], "openings": openings,
                                                                  "description": "Demo market demand figure, not live labour-market data"})

    def user(self, email, name, role, **extra):
        if not hasattr(self, "_pw"):
            from django.contrib.auth.hashers import make_password
            self._pw = make_password(PASSWORD)
        return User.objects.create(username=email, email=email, password=self._pw, full_name=name, first_name=name.split()[0], role=role, is_demo=True, **extra)

    def accounts(self):
        self.admin = self.user("admin.demo@skilltrace.in", "State Skills Admin (demo)", "ADMIN", is_staff=True, is_superuser=True, district="MUM")
        self.officer = self.user("officer.demo@skilltrace.in", "Verification Officer (demo)", "OFFICER", district="PNE")
        self.provider_user = self.user("provider.demo@skilltrace.in", "Konkan TechSkills Coordinator (demo)", "PROVIDER", provider=self.providers["PRV-KTS"], district="THN")
        for code, prov in self.providers.items():
            if code != "PRV-KTS":
                self.user(f"{code.lower()}@skilltrace.in", f"{prov.name} Coordinator", "PROVIDER", provider=prov, district=prov.district)
        self.employer = self.user("hr.demo@skilltrace.in", "HR Desk, Sahyadri Analytics (demo)", "EMPLOYER", organisation="Sahyadri Analytics Pvt Ltd (demo)", district="PNE")

    def trainee(self, email, name, gender, district, dob, analytics=True):
        u = self.user(email, name, "TRAINEE", district=district, phone=f"9{random.randint(100000000, 999999999)}")
        p = TraineeProfile.objects.create(user=u, uti=UTISequence.next_uti(district), dob=dob, gender=gender, district=district,
                                          education_level=random.choice(["SSC", "HSC", "ITI", "DIPLOMA", "GRADUATE"]))
        p.created_at = timezone.now() - timedelta(days=random.randint(200, 700))
        TraineeProfile.objects.filter(pk=p.pk).update(created_at=p.created_at)
        state = {}
        for c in CONSENTS:
            granted = analytics if c == "GOVT_ANALYTICS" else (random.random() > 0.05 or c == "TRAINING_RECORDS")
            ConsentRecord.objects.create(user=u, purpose=c, granted=granted, version=settings.SKILLTRACE["CONSENT_VERSION"])
            state[c] = granted
        p.consent_state = state
        p.save(update_fields=["consent_state"])
        return u, p

    def session(self, user, kind, skill, score, when, flagged=False, attempt=1, domains=None):
        qids = list(Question.objects.filter(kind=kind, skill=skill).values_list("id", flat=True))[:14]
        minutes = 15 if kind == "SOFT" else 10
        s = AssessmentSession.objects.create(
            trainee=user, kind=kind, skill=skill, attempt_no=attempt, question_ids=qids, option_orders={}, answers={},
            started_at=when - timedelta(minutes=minutes - 2), expires_at=when + timedelta(minutes=2), submitted_at=when,
            status="SUBMITTED", score=score, correct_count=round(score * len(qids) / 100), band=band_for(score),
            passed=score >= 60, domain_scores=domains or {},
            integrity={"tab_switches": 4 if flagged else random.choice([0, 0, 0, 1]), "focus_lost": random.randint(0, 2),
                       "answer_changes": random.randint(0, 6), "flags": ["Left the exam tab 4 times"] if flagged else [],
                       "seconds_used": (minutes - 2) * 60, "seconds_allotted": minutes * 60, "note": "Synthetic demo session"},
            review_status="FLAGGED" if flagged else "NONE",
        )
        if flagged:
            for i in range(4):
                AssessmentEvent.objects.create(session=s, event_type="TAB_SWITCH", created_at=when - timedelta(minutes=6 - i))
        return s

    def outcome(self, user, enr, status, months, sector, income=None, employer="", verified="SELF_REPORTED", current=False, when=None):
        return EmploymentOutcome.objects.create(
            trainee=user, enrollment=enr, status=status, employer_name=employer, job_role=enr.programme.name if status in ("EMPLOYED", "APPRENTICE") else "",
            business_type="Own service business" if status == "SELF_EMPLOYED" else "", sector=sector, district=user.district,
            employment_type="FULL_TIME" if status == "EMPLOYED" else ("GIG" if status == "SELF_EMPLOYED" else ""),
            monthly_income=income, months_since_training=months, verification_status=verified, is_current=current,
            source="FOLLOWUP" if months else "SELF", recorded_at=when or timezone.now(),
            start_date=(enr.completion_date + timedelta(days=30 * months)) if status in PLACED_STATUSES and enr.completion_date else None,
        )

    def synthetic(self, n):
        codes = [c for c, *_ in DISTRICTS]
        weights = [DISTRICT_WEIGHTS.get(c, 1) for c in codes]
        prog_codes = list(self.programmes)
        self.flag_budget, self.review_budget, self.pending_employer = 6, 8, 4
        for i in range(n):
            gender = random.choices(["F", "M", "O"], [46, 53, 1])[0]
            first = random.choice(FIRST_F if gender == "F" else FIRST_M)
            name = f"{first} {random.choice(LAST)}"
            district = random.choices(codes, weights)[0]
            dob = self.today - timedelta(days=random.randint(18 * 365, 32 * 365))
            u, p = self.trainee(f"trainee{i:03d}@demo.skilltrace.in", name, gender, district, dob, analytics=random.random() > 0.04)
            code = random.choice(prog_codes)
            prog, q = self.programmes[code], self.quality[code]
            year = random.choice([2024, 2025, 2025, 2026])
            roll = random.random()
            status = "COMPLETED" if roll < 0.76 else ("IN_PROGRESS" if roll < 0.88 else "DROPOUT")
            days_ago = random.randint(40, 640) if status == "COMPLETED" else random.randint(0, 30)
            completion = self.today - timedelta(days=days_ago) if status == "COMPLETED" else None
            enr = TrainingEnrollment.objects.create(
                trainee=u, programme=prog, cohort=f"{year}-B{random.randint(1, 3)}", status=status, provider_confirmed=True,
                enrolled_on=(completion or self.today) - timedelta(days=prog.duration_hours // 3 + 20),
                completion_date=completion, attendance_pct=random.randint(72, 99) if status == "COMPLETED" else random.randint(30, 80))
            TrainingEnrollment.objects.filter(pk=enr.pk).update(created_at=completion_ts(enr.enrolled_on, 0))
            skill_objs = [self.skills[s] for s in prog.target_skills]
            for s in skill_objs:
                SkillRecord.objects.create(trainee=u, skill=s, source="TRAINING")
            if status != "COMPLETED":
                continue
            # issuer registry + certificate
            issuer = prog.provider.issuer
            number = f"{issuer.code}-{completion.year}-{IssuedCertificate.objects.filter(issuer=issuer).count() + 1:05d}"
            IssuedCertificate.objects.create(issuer=issuer, cert_number=number, holder_name=name, course_name=prog.name, issue_date=completion, holder_uti=p.uti)
            enr.certificate_number = number
            enr.save(update_fields=["certificate_number"])
            if random.random() < 0.62:
                st = random.choices(["ISSUER_VERIFIED", "PARTIALLY_VERIFIED", "MANUAL_REVIEW", "REJECTED"], [78, 10, 8, 4])[0]
                if st == "MANUAL_REVIEW":
                    if self.review_budget <= 0:
                        st = "ISSUER_VERIFIED"
                    self.review_budget -= 1
                CertificateRecord.objects.create(
                    trainee=u, enrollment=enr, holder_name=name, issuer_name=issuer.name, issuer=issuer, cert_number=number,
                    course_name=prog.name, issue_date=completion, status=st,
                    checks=[{"key": "note", "label": "Synthetic record", "result": "pass" if st == "ISSUER_VERIFIED" else "warn",
                             "detail": "Seeded demo certificate" + ("; holder name spelling differs from issuer record" if st == "MANUAL_REVIEW" else "")}],
                    created_at=timezone.now() - timedelta(days=max(1, days_ago - 10)))
            # assessments
            ability = min(0.95, max(0.1, random.gauss(q, 0.14)))
            when = timezone.now() - timedelta(days=max(1, days_ago - 5))
            if random.random() < 0.88:
                doms = {c: max(0, min(100, round(random.gauss(ability * 100 + 5, 18) / 50) * 50)) for c, _ in SOFT_DOMAINS}
                soft_score = round(sum(doms.values()) / len(doms))
                flag = self.flag_budget > 0 and random.random() < 0.05
                self.flag_budget -= int(flag)
                self.session(u, "SOFT", None, soft_score, when, flagged=flag, domains=doms)
            for s in skill_objs:
                if s.name in TECH and random.random() < 0.8:
                    score = max(12, min(100, round(random.gauss(ability * 100, 15) / 12.5) * 12.5))
                    score = int(score)
                    topics = sorted({t[0] for t in TECH[s.name]})
                    tdom = {t: max(0, min(100, int(random.gauss(score, 20) // 50 * 50))) for t in topics[:4]}
                    flag = self.flag_budget > 0 and random.random() < 0.04
                    self.flag_budget -= int(flag)
                    self.session(u, "TECH", s, score, when + timedelta(hours=2), flagged=flag, domains=tdom)
                    SkillRecord.objects.filter(trainee=u, skill=s).update(
                        best_score=score, competency_level=band_for(score), last_assessed=when,
                        assessment_status="UNDER_REVIEW" if flag else ("PASSED" if score >= 60 else "NEEDS_IMPROVEMENT"))
            # follow-ups + outcomes
            placed_p = min(0.92, 0.25 + ability * 0.75 + (0.05 if gender == "M" else 0))
            placed = random.random() < placed_p
            placed_status = random.choices(["EMPLOYED", "SELF_EMPLOYED", "APPRENTICE"], [70, 18, 12])[0]
            wage = BASE_WAGE[prog.sector] * random.uniform(0.8, 1.25) * (0.85 if placed_status == "SELF_EMPLOYED" else 1) * (0.7 if placed_status == "APPRENTICE" else 1)
            employer = random.choice(EMPLOYERS[prog.sector]) if placed_status != "SELF_EMPLOYED" else ""
            months_done = days_ago // 30
            last = None
            for mcode, days in settings.SKILLTRACE["FOLLOWUP_MILESTONES"]:
                due = completion + timedelta(days=days)
                if due > self.today:
                    FollowUpSchedule.objects.create(trainee=u, enrollment=enr, milestone=mcode, due_date=due, status="SCHEDULED")
                    continue
                r = random.random()
                fstat = "RESPONDED" if r < 0.64 else ("SENT" if r < 0.86 else "UNREACHABLE")
                resp_at = timezone.now() - timedelta(days=(self.today - due).days - 3) if fstat == "RESPONDED" else None
                FollowUpSchedule.objects.create(trainee=u, enrollment=enr, milestone=mcode, due_date=due, status=fstat,
                                                attempts=1 if fstat == "RESPONDED" else (2 if fstat == "SENT" else 3),
                                                last_sent_at=timezone.now() - timedelta(days=(self.today - due).days), responded_at=resp_at,
                                                response={"status": "EMPLOYED" if placed else "SEEKING"} if fstat == "RESPONDED" else {})
                if fstat != "RESPONDED":
                    continue
                months = days // 30
                got_job_now = placed and (days >= 90 or random.random() < 0.55)
                if got_job_now:
                    inc = int(round(wage * (1 + 0.045 * months) / 100) * 100)
                    ver = random.choices(["CONFIRMED", "SELF_REPORTED", "REQUESTED"], [45, 45, 10])[0] if placed_status == "EMPLOYED" else "SELF_REPORTED"
                    last = self.outcome(u, enr, placed_status, months, prog.sector, inc, employer, ver, when=resp_at)
                else:
                    st = random.choices(["SEEKING", "HIGHER_EDUCATION", "CONTINUING_TRAINING"], [80, 12, 8])[0]
                    last = self.outcome(u, enr, st, months, prog.sector, when=resp_at)
                    if st == "SEEKING" and not NonPlacementReason.objects.filter(trainee=u).exists():
                        cat = random.choices(REASONS, REASON_WEIGHTS)[0]
                        if q < 0.6 and random.random() < 0.4:
                            cat = "SKILL_MISMATCH"
                        NonPlacementReason.objects.create(trainee=u, outcome=last, category=cat, notes=REASON_NOTES[cat],
                                                          categorised_by=random.choice(["TRAINEE", "RULES"]), created_at=resp_at)
            if last:
                EmploymentOutcome.objects.filter(pk=last.pk).update(is_current=True)
                p.employment_status = last.status
                p.save(update_fields=["employment_status"])
                if last.verification_status in ("CONFIRMED", "REQUESTED"):
                    to_hr = last.verification_status == "REQUESTED" and self.pending_employer > 0
                    self.pending_employer -= int(to_hr)
                    EmployerVerification.objects.create(
                        outcome=last, employer_name=last.employer_name,
                        employer_email="hr.demo@skilltrace.in" if to_hr else "hr@employer.demo",
                        status="CONFIRMED" if last.verification_status == "CONFIRMED" else "REQUESTED",
                        responded_at=timezone.now() - timedelta(days=5) if last.verification_status == "CONFIRMED" else None,
                        confirmed_income=last.monthly_income if last.verification_status == "CONFIRMED" else None)
                    if to_hr:
                        EmploymentOutcome.objects.filter(pk=last.pk).update(employer_name="Sahyadri Analytics Pvt Ltd (demo)")

    def priya(self):
        """A rich, scripted demo trainee for the live walkthrough."""
        u, p = self.trainee("priya.demo@skilltrace.in", "Priya Deshmukh", "F", "PNE", self.today - timedelta(days=23 * 365))
        p.qualification = "B.Com, Savitribai Phule Pune University"
        p.education_level = "GRADUATE"
        p.career_goals = "Work as a data analyst in a Pune IT services company"
        p.preferred_roles = ["Junior Data Analyst", "Data Entry Operator"]
        p.target_role = TargetRole.objects.get(name="Junior Data Analyst")
        p.save()
        prog = self.programmes["PMKVY-IT-JDA"]
        completion = self.today - timedelta(days=186)
        enr = TrainingEnrollment.objects.create(trainee=u, programme=prog, cohort="2026-B1", status="COMPLETED", provider_confirmed=True,
                                                enrolled_on=completion - timedelta(days=150), attendance_pct=91, completion_date=completion)
        number = f"SSCIT-{completion.year}-DEMO1"
        IssuedCertificate.objects.create(issuer=self.issuers["SSCIT"], cert_number=number, holder_name="Priya Deshmukh", course_name=prog.name, issue_date=completion, holder_uti=p.uti)
        enr.certificate_number = number
        enr.save()
        cert = CertificateRecord.objects.create(
            trainee=u, enrollment=enr, holder_name="Priya Deshmukh", issuer_name="IT-ITeS Sector Skill Council", issuer=self.issuers["SSCIT"],
            cert_number=number, course_name=prog.name, issue_date=completion, status="ISSUER_VERIFIED",
            checks=[{"key": "document", "label": "Document validation", "result": "pass", "detail": "Required fields present"},
                    {"key": "issuer", "label": "Issuer validation", "result": "pass", "detail": "Matched authorised issuer: IT-ITeS Sector Skill Council"},
                    {"key": "reference", "label": "Certificate reference check", "result": "pass", "detail": "Issuer record found"},
                    {"key": "duplicate", "label": "Duplicate detection", "result": "pass", "detail": "No duplicate found"},
                    {"key": "tampering", "label": "Tampering indicators", "result": "pass", "detail": "No inconsistencies detected"}])
        # A second valid registry entry for the live upload demo
        IssuedCertificate.objects.create(issuer=self.issuers["NCVET"], cert_number="NCVET-2025-DL-00417", holder_name="Priya Deshmukh",
                                         course_name="Digital Literacy Foundation", issue_date=self.today - timedelta(days=400), holder_uti=p.uti)
        when = timezone.now() - timedelta(days=180)
        self.session(u, "SOFT", None, 71, when, domains={"COMMUNICATION": 50, "PROBLEM_SOLVING": 100, "TEAMWORK": 100, "TIME_MANAGEMENT": 50,
                                                          "PROFESSIONALISM": 100, "ADAPTABILITY": 50, "DIGITAL_LITERACY": 50})
        for name, score in (("SQL", 44), ("MS Excel", 75), ("Python Programming", 62)):
            s = self.skills[name]
            self.session(u, "TECH", s, score, when + timedelta(hours=1), domains={"Joins": 0, "Aggregation": 50, "Basics": 100} if name == "SQL" else {})
            SkillRecord.objects.update_or_create(trainee=u, skill=s, defaults={
                "source": "TRAINING", "certificate": cert, "best_score": score, "competency_level": band_for(score), "last_assessed": when,
                "assessment_status": "PASSED" if score >= 60 else "NEEDS_IMPROVEMENT"})
        d30 = timezone.now() - timedelta(days=154)
        o1 = self.outcome(u, enr, "SEEKING", 1, "IT-ITeS", when=d30)
        NonPlacementReason.objects.create(trainee=u, outcome=o1, category="SKILL_MISMATCH", categorised_by="RULES",
                                          notes="Interviews had SQL join questions I could not answer", created_at=d30)
        d90 = timezone.now() - timedelta(days=95)
        o2 = self.outcome(u, enr, "EMPLOYED", 3, "IT-ITeS", 14500, "Sahyadri Analytics Pvt Ltd (demo)", "REQUESTED", current=True, when=d90)
        o2.employer_email = "hr.demo@skilltrace.in"
        o2.job_role = "Junior Data Analyst (trainee)"
        o2.consent_for_verification = True
        o2.save()
        EmployerVerification.objects.create(outcome=o2, employer_email="hr.demo@skilltrace.in", employer_name=o2.employer_name)
        p.employment_status = "EMPLOYED"
        p.save()
        for mcode, days in settings.SKILLTRACE["FOLLOWUP_MILESTONES"]:
            due = completion + timedelta(days=days)
            responded = days in (30, 90)
            FollowUpSchedule.objects.create(
                trainee=u, enrollment=enr, milestone=mcode, due_date=due,
                status="RESPONDED" if responded else ("SENT" if due <= self.today else "SCHEDULED"),
                attempts=1 if due <= self.today else 0, last_sent_at=timezone.now() - timedelta(days=4) if due <= self.today else None,
                responded_at=(d30 if days == 30 else d90) if responded else None)
        TraineeProfile.objects.filter(pk=p.pk).update(created_at=completion_ts(completion, -165))
        TrainingEnrollment.objects.filter(pk=enr.pk).update(created_at=completion_ts(completion, -150))
        CertificateRecord.objects.filter(pk=cert.pk).update(created_at=completion_ts(completion, 6))
        Notification.objects.create(user=u, title="Follow-up: Day 180 · retention and income", body="How are things after Junior Data Analyst? It takes one minute to update.", link="/trainee/followups", kind="ACTION")
        Notification.objects.create(user=self.employer, title="Employment verification request", body="Please verify Priya Deshmukh's employment", link="/employer", kind="ACTION")

    def make_sample_certificates(self):
        """Generate two sample certificate images for the live demo: one valid, one not in any registry."""
        try:
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            return
        out = Path(settings.BASE_DIR) / "demo_assets"
        out.mkdir(exist_ok=True)

        def font(size):
            for f in ("DejaVuSans-Bold.ttf", "arial.ttf", "Arial.ttf"):
                try:
                    return ImageFont.truetype(f, size)
                except OSError:
                    continue
            return ImageFont.load_default()

        for fname, issuer, number, course in (
            ("valid_certificate_priya.png", "National Council for Vocational Education and Training", "NCVET-2025-DL-00417", "Digital Literacy Foundation"),
            ("unverifiable_certificate_priya.png", "Global Skills Academy International", "GSA-99-000123", "Advanced Data Science Masterclass"),
        ):
            img = Image.new("RGB", (1400, 990), "#fbfaf5")
            d = ImageDraw.Draw(img)
            d.rectangle([30, 30, 1370, 960], outline="#0f766e", width=8)
            d.rectangle([50, 50, 1350, 940], outline="#d97706", width=2)
            d.text((700, 150), "CERTIFICATE OF COMPLETION", font=font(56), fill="#0f3d3a", anchor="mm")
            d.text((700, 230), issuer, font=font(30), fill="#334155", anchor="mm")
            d.text((700, 350), "This is to certify that", font=font(28), fill="#475569", anchor="mm")
            d.text((700, 430), "Priya Deshmukh", font=font(64), fill="#0f172a", anchor="mm")
            d.text((700, 520), "has successfully completed", font=font(28), fill="#475569", anchor="mm")
            d.text((700, 590), course, font=font(40), fill="#0f766e", anchor="mm")
            d.text((140, 820), f"Certificate No: {number}", font=font(26), fill="#0f172a")
            d.text((140, 865), "SAMPLE DEMO DOCUMENT - NOT A REAL CERTIFICATE", font=font(22), fill="#b91c1c")
            img.save(out / fname)
