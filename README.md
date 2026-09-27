# SkillTrace by JobGenie

Skilling outcome intelligence platform for **SIH 2026 · PS 26135** (Government of Maharashtra).
It follows a trainee from registration to verified competency, employment and long-term outcomes, and rolls it all up into government analytics.

```
Register → Consent → UTI → Training → Certificate verification → Skills → Soft-skill test (mandatory)
→ Technical test → Competency profile → Skill-gap plan → Employment → Employer verification → Follow-ups → Analytics
```

| Layer | Stack |
|---|---|
| Frontend | Next.js 14 (App Router, JavaScript), Tailwind CSS, Radix UI primitives, framer-motion, Recharts, lucide icons, sonner, next-themes, canvas-confetti |
| Backend | Django 4.2 LTS, Django REST Framework, SimpleJWT, django-cors-headers, pypdf, Pillow |
| Database | MySQL / MariaDB from XAMPP via PyMySQL (SQLite fallback for quick runs) |
| AI | Gemini REST API (optional). Every AI feature has a rule-based fallback, and the UI labels which one produced the output |

UI languages: English, मराठी, हिंदी (switcher in every header). Light and dark themes. Every screen is responsive down to 360 px.

---

## 1. Run it (Windows + XAMPP)

**Prerequisites:** Python 3.10+, Node.js 18.18+ (20 LTS recommended), XAMPP with MySQL started.

### Database
1. Start **MySQL** in the XAMPP Control Panel.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`) → SQL tab → run `backend/setup_db.sql`.

### Backend (terminal 1)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env            # macOS/Linux: cp .env.example .env
python manage.py migrate
python manage.py seed_demo        # fictional demo data + question banks + sample certificates
python manage.py runserver 8000
```
Default XAMPP credentials (`root`, empty password) are already in `.env.example`. Change `DB_*` if yours differ.
No MySQL handy? Set `DB_ENGINE=sqlite` in `.env`.

Why Django 4.2: XAMPP ships MariaDB 10.4 and Django 5.x refuses to connect to it. 4.2 LTS works out of the box.

### Frontend (terminal 2)
```bash
cd frontend
npm install
copy .env.local.example .env.local   # points to http://127.0.0.1:8000/api
npm run dev
```
Open **http://localhost:3000**.

### Optional: Gemini
Put a key in `backend/.env` → `GEMINI_API_KEY=...` and restart Django. This switches on: Gemini improvement plans, free-text non-placement categorisation, policy insights, and AI-drafted questions (which stay inactive until a human approves them).

### Follow-up engine in production
Schedule `python manage.py run_followups` daily (Windows Task Scheduler / cron). Admins can also press **Run now** under *Follow-ups & audit*.

---

## 2. Demo accounts (password `Demo@1234`)

| Role | Login | Lands on |
|---|---|---|
| Trainee (rich history) | `priya.demo@skilltrace.in` | `/trainee` |
| Training provider | `provider.demo@skilltrace.in` | `/provider` |
| Employer | `hr.demo@skilltrace.in` | `/employer` |
| Verification officer | `officer.demo@skilltrace.in` | `/officer` |
| Government admin (+ Django admin) | `admin.demo@skilltrace.in` | `/admin` |

Other providers: `prv-itipne@skilltrace.in`, `prv-nsdc@…`, `prv-ssf@…`, `prv-mrla@…`, `prv-nith@…`.
Trainees can log in with email, mobile number **or UTI**. Django admin: `http://127.0.0.1:8000/django-admin/`.

All people, organisations and numbers are fictional. The dashboard says so on screen.

---

## 3. Three-minute live demo script

1. **Register** a new trainee at `/register` (3-step wizard). Reuse Priya's name + a new phone to show the duplicate check, then continue → UTI card (e.g. `MH-PNE-2026-000051`).
2. **Training** → enroll in *Junior Data Analyst*.
3. **Certificates** → submit with the files in `backend/demo_assets/`:
   * Valid: issuer `NCVET`, number `NCVET-2025-DL-00417`, course *Digital Literacy Foundation*, holder *Priya Deshmukh*. Logged in as Priya → **Issuer verified**. Logged in as anyone else → **Manual review** (holder mismatch).
   * Negative case: `unverifiable_certificate_priya.png`, issuer *Global Skills Academy International*, number `GSA-99-000123` → **Verification unavailable** (issuer not in the registry).
   * Upload a `.exe`, an empty file or a renamed file → rejected with a clear message.
4. **Assessments** → mandatory soft-skill test: system check → rules → identity confirmation → timed, shuffled exam. Switch tabs once to show the warning and the integrity record. Submit → score ring, radar, feedback.
5. **Skills** → add SQL → take the technical test.
6. **Competency & gaps** → choose *Junior Data Analyst* → readiness gauge, evidence-linked gaps, improvement plan (Gemini or rule-based badge).
7. Log in as **Priya** → Follow-ups → answer the **Day 180** check-in with a raise to ₹18,000 → Employment shows income progression.
8. Log in as **hr.demo** → confirm Priya's employment → her record turns *Employer confirmed*.
9. Log in as **admin.demo** → KPIs, funnel, district tile map, provider effectiveness, demand vs verified supply, non-placement causes, recommendations, *Generate policy insights*.
10. **officer.demo** → clear or invalidate a flagged exam, decide a certificate in manual review.

---

## 4. What is implemented vs simulated

| Feature | Status |
|---|---|
| Role-based access (5 roles, enforced in the API) | Implemented |
| Registration, UTI generation, fuzzy duplicate detection | Implemented |
| Purpose-based consent ledger, withdrawal, anonymisation | Implemented (prototype of DPDP-aligned flows, not a legal compliance guarantee) |
| Training programmes, enrollment, attendance, completion | Implemented |
| Certificate engine: file validation, magic-byte check, PDF text check, issuer match, registry lookup, duplicates, tampering indicators, officer review | Implemented against a **simulated issuer registry** seeded in the database |
| Soft-skill + technical assessments: server timer, randomised questions and options, autosave, resume, offline queue, event logging, integrity review | Implemented. Browser signals are review indicators only |
| Competency profile, skill gap with evidence, improvement plan | Implemented (Gemini optional) |
| Employment outcomes, wage progression, non-placement reasons with correction | Implemented |
| Employer verification (portal + secure token link) | Implemented; the link is shown on screen instead of emailed |
| Follow-up engine (30/90/180/365 days, retries, unreachable) | Implemented for the in-app channel. SMS / WhatsApp / IVR are **planned** |
| Government analytics with small-cell suppression, filters, recommendations | Implemented on demo data |
| Audit log of sensitive actions | Implemented |
| Aadhaar / DigiLocker / MCA21 / EPFO integrations | Planned, not built |
| Soft-skill question content in Marathi and Hindi | Planned (UI is translated, questions are English) |

---

## 5. Project layout

```
backend/
  skilltrace/        settings, urls
  core/              users, roles, UTI, consent, audit, notifications, Gemini client, seed & follow-up commands
  training/          providers, programmes, enrollments, completion service
  credentials/       issuer registry, certificates + verification engine, skill taxonomy & records
  assessments/       question bank, sessions, events, scoring and integrity engine
  outcomes/          target roles, employment, employer verification, follow-ups, non-placement, skill gap
  analytics/         aggregation with consent filter and small-cell suppression
  demo_assets/       sample certificate images (generated by seed_demo)
frontend/
  app/(auth)         login, register
  app/(app)/trainee  dashboard, profile, consent, training, certificates, skills, assessments, exam, competency, employment, follow-ups, timeline
  app/(app)/provider overview, programmes, enrollments, question bank
  app/(app)/employer verification requests
  app/(app)/officer  certificate + assessment review queues
  app/(app)/admin    impact analytics, follow-ups & audit, question bank
  app/verify/…       public employer verification link
  components/        Radix-based UI kit, charts, district map, app shell
  lib/               API client (JWT refresh), auth, i18n (en/mr/hi)
```

## 6. Key API endpoints

`POST /api/auth/register/` · `POST /api/auth/login/` · `GET /api/me/journey/` · `GET /api/me/timeline/` · `GET|POST /api/me/consents/`
`GET|POST /api/me/certificates/` · `GET|POST /api/me/skills/` · `POST /api/me/assessments/start/` · `POST /api/me/assessments/<id>/answer|events|submit/`
`GET /api/me/competency/` · `GET /api/me/skill-gap/?role=` · `GET|POST /api/me/employment/` · `POST /api/me/followups/<id>/respond/`
`GET /api/admin/analytics/?district=&programme=&sector=&cohort=&gender=` · `POST /api/admin/insights/` · `POST /api/admin/followups/run/`
`GET /api/provider/analytics/` · `PATCH /api/provider/enrollments/<id>/` · `GET /api/employer/verifications/` · `GET|POST /api/verify/employment/<token>/`
