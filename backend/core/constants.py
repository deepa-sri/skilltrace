"""Static reference data for Maharashtra. Grid positions drive the tile-map heatmap."""

# code, name, division, (row, col) tile position
DISTRICTS = [
    ("NDB", "Nandurbar", "Nashik", (0, 1)),
    ("DHL", "Dhule", "Nashik", (0, 2)),
    ("JLG", "Jalgaon", "Nashik", (0, 3)),
    ("BLD", "Buldhana", "Amravati", (0, 4)),
    ("AKL", "Akola", "Amravati", (0, 5)),
    ("AMR", "Amravati", "Amravati", (0, 6)),
    ("NGP", "Nagpur", "Nagpur", (0, 7)),
    ("BHN", "Bhandara", "Nagpur", (0, 8)),
    ("GND", "Gondia", "Nagpur", (0, 9)),
    ("PLG", "Palghar", "Konkan", (1, 0)),
    ("NSK", "Nashik", "Nashik", (1, 1)),
    ("AUR", "Chh. Sambhajinagar", "Chh. Sambhajinagar", (1, 2)),
    ("JLN", "Jalna", "Chh. Sambhajinagar", (1, 3)),
    ("WSM", "Washim", "Amravati", (1, 4)),
    ("YTL", "Yavatmal", "Amravati", (1, 5)),
    ("WRD", "Wardha", "Nagpur", (1, 6)),
    ("CHD", "Chandrapur", "Nagpur", (1, 7)),
    ("GDC", "Gadchiroli", "Nagpur", (1, 8)),
    ("MSU", "Mumbai Suburban", "Konkan", (2, 0)),
    ("THN", "Thane", "Konkan", (2, 1)),
    ("AHM", "Ahilyanagar", "Nashik", (2, 2)),
    ("BED", "Beed", "Chh. Sambhajinagar", (2, 3)),
    ("PBN", "Parbhani", "Chh. Sambhajinagar", (2, 4)),
    ("HNG", "Hingoli", "Chh. Sambhajinagar", (2, 5)),
    ("NDD", "Nanded", "Chh. Sambhajinagar", (2, 6)),
    ("MUM", "Mumbai City", "Konkan", (3, 0)),
    ("RGD", "Raigad", "Konkan", (3, 1)),
    ("PNE", "Pune", "Pune", (3, 2)),
    ("DRS", "Dharashiv", "Chh. Sambhajinagar", (3, 3)),
    ("LTR", "Latur", "Chh. Sambhajinagar", (3, 4)),
    ("RTN", "Ratnagiri", "Konkan", (4, 1)),
    ("STR", "Satara", "Pune", (4, 2)),
    ("SLP", "Solapur", "Pune", (4, 3)),
    ("SDG", "Sindhudurg", "Konkan", (5, 1)),
    ("KLP", "Kolhapur", "Pune", (5, 2)),
    ("SNG", "Sangli", "Pune", (5, 3)),
]
DISTRICT_CHOICES = [(c, n) for c, n, _, _ in DISTRICTS]
DISTRICT_NAME = {c: n for c, n, _, _ in DISTRICTS}

GENDER_CHOICES = [("F", "Female"), ("M", "Male"), ("O", "Other"), ("N", "Prefer not to say")]
EDUCATION_CHOICES = [
    ("BELOW_10", "Below 10th"),
    ("SSC", "10th (SSC)"),
    ("HSC", "12th (HSC)"),
    ("ITI", "ITI"),
    ("DIPLOMA", "Diploma"),
    ("GRADUATE", "Graduate"),
    ("POSTGRADUATE", "Postgraduate"),
]

EMPLOYMENT_STATUS = [
    ("EMPLOYED", "Employed"),
    ("SELF_EMPLOYED", "Self-employed"),
    ("APPRENTICE", "Apprentice"),
    ("SEEKING", "Seeking employment"),
    ("HIGHER_EDUCATION", "Higher education"),
    ("CONTINUING_TRAINING", "Continuing training"),
    ("OTHER", "Other"),
]
PLACED_STATUSES = {"EMPLOYED", "SELF_EMPLOYED", "APPRENTICE"}

CONSENT_PURPOSES = [
    ("TRAINING_RECORDS", "Store my training records"),
    ("CERT_VERIFICATION", "Verify my certificates with issuers"),
    ("SKILL_ASSESSMENT", "Assess my skills and record results"),
    ("EMPLOYMENT_FOLLOWUP", "Contact me for employment follow-ups"),
    ("GOVT_ANALYTICS", "Include my de-identified data in government analytics"),
    ("EMPLOYER_VERIFICATION", "Let employers verify my employment details"),
]
REQUIRED_CONSENTS = {"TRAINING_RECORDS"}

COMPETENCY_LEVELS = [
    ("NOT_ASSESSED", "Not assessed"),
    ("BEGINNER", "Beginner"),
    ("BASIC", "Basic"),
    ("INTERMEDIATE", "Intermediate"),
    ("ADVANCED", "Advanced"),
]
LEVEL_RANK = {"NOT_ASSESSED": 0, "BEGINNER": 1, "BASIC": 2, "INTERMEDIATE": 3, "ADVANCED": 4}


def band_for(score):
    if score is None:
        return "NOT_ASSESSED"
    if score >= 80:
        return "ADVANCED"
    if score >= 60:
        return "INTERMEDIATE"
    if score >= 40:
        return "BASIC"
    return "BEGINNER"
