// Demo data for the frontend phase. All names, numbers and outcomes are
// illustrative — they are NOT official Maharashtra government statistics.

export const DEMO_NOTICE = "Demo data — illustrative values, not official statistics.";

export const districts = [
  "Mumbai",
  "Pune",
  "Nagpur",
  "Nashik",
  "Thane",
  "Aurangabad",
  "Kolhapur",
  "Solapur",
];

export const programmeCategories = [
  "IT & Software",
  "Industrial Skills",
  "Green Jobs",
  "Healthcare",
  "Automotive",
  "Management",
];

export const trainee = {
  id: "MH2024001234",
  name: "Priya Sharma",
  firstName: "Priya",
  role: "Trainee",
  initials: "PS",
  dob: "15 Jan 2002",
  gender: "Female",
  phone: "+91 98765 43210",
  email: "priya.sharma@example.com",
  location: "Nashik, Maharashtra",
  district: "Nashik",
  verified: true,
  completion: 85,
  completionItems: [
    { label: "Personal Info", done: true },
    { label: "Education", done: true },
    { label: "Skills", done: true },
    { label: "Certificates", done: true },
    { label: "Employment", done: true },
    { label: "Documents", done: false },
  ],
  skills: ["Python", "Web Development", "Data Analysis", "Communication", "Teamwork"],
  languages: ["English", "Hindi", "Marathi"],
  education: [
    {
      degree: "B.Sc. Computer Science",
      institution: "K.T.H.M. College, Nashik",
      year: "2019 – 2022",
      score: "7.8 CGPA",
    },
    {
      degree: "HSC (Science)",
      institution: "Maharashtra State Board",
      year: "2019",
      score: "78%",
    },
  ],
  trainingHistory: [
    {
      programme: "Full Stack Web Development",
      provider: "Skill Maharashtra",
      period: "Aug 2023 – Nov 2023",
      status: "completed",
    },
    {
      programme: "Python Programming",
      provider: "TechSkill Academy",
      period: "Mar 2023 – May 2023",
      status: "completed",
    },
    {
      programme: "Data Analytics Foundations",
      provider: "NPTEL",
      period: "Jun 2023 – Aug 2023",
      status: "completed",
    },
  ],
  documents: [
    { name: "Aadhaar (masked)", status: "verified" },
    { name: "Bank passbook", status: "verified" },
    { name: "Income certificate", status: "pending" },
  ],
  stats: [
    { label: "Completed Courses", value: "5", icon: "training", tone: "blue" },
    { label: "Skills Verified", value: "12", icon: "shield", tone: "green" },
    { label: "Employment Status", value: "Employed", icon: "employment", tone: "green" },
    { label: "Next Follow-up", value: "45 days", icon: "followup", tone: "blue", highlight: true },
  ],
};

export const journeySteps = [
  { label: "Enrolled", date: "Aug 2023", state: "done" },
  { label: "Training", date: "Nov 2023", state: "done" },
  { label: "Assessment", date: "Dec 2023", state: "done" },
  { label: "Certified", date: "Jan 2024", state: "done" },
  { label: "Employed", date: "Jan 2024", state: "current" },
  { label: "Follow-ups", date: "Next: Nov 2024", state: "upcoming" },
];

export const traineeRecommendations = [
  {
    title: "Complete Soft Skills Assessment",
    description: "Required for certification",
    action: "Start",
    href: "/assessments?tab=soft",
    icon: "assessment",
    tone: "blue",
  },
  {
    title: "Update Employment Status",
    description: "Last updated 3 months ago",
    action: "Update",
    href: "/employment",
    icon: "employment",
    tone: "green",
  },
  {
    title: "Explore Skill Gap Report",
    description: "Get personalised recommendations",
    action: "Start",
    href: "/skill-gaps",
    icon: "skills",
    tone: "purple",
  },
];

export const notifications = [
  { title: "Follow-up due in 45 days", time: "Today", tone: "blue" },
  { title: "Web Development certificate is pending verification", time: "2 days ago", tone: "amber" },
  { title: "Employment verified by Tata Consultancy Services", time: "1 week ago", tone: "green" },
];

export const programmes = [
  {
    id: "fswd",
    title: "Full Stack Web Development",
    category: "IT & Software",
    provider: "Skill Maharashtra",
    duration: "3 Months",
    district: "Mumbai",
    certification: "AICTE Certified",
    mode: "Hybrid",
    seats: 40,
    starts: "15 Oct 2024",
    icon: "code",
    tone: "blue",
    description:
      "HTML, CSS, JavaScript, React and Node.js with a capstone project reviewed by partner employers.",
  },
  {
    id: "elec",
    title: "Electrician Technician",
    category: "Industrial Skills",
    provider: "TechSkill Academy",
    duration: "6 Months",
    district: "Nashik",
    certification: "Government PMKVY",
    mode: "On-site",
    seats: 30,
    starts: "01 Nov 2024",
    icon: "zap",
    tone: "orange",
    description:
      "Domestic and industrial wiring, electrical safety, panel installation and maintenance practice.",
  },
  {
    id: "solar",
    title: "Solar Installation & Maintenance",
    category: "Green Jobs",
    provider: "Future Skills Institute",
    duration: "3 Months",
    district: "Pune",
    certification: "NSDC Certified",
    mode: "On-site",
    seats: 25,
    starts: "20 Oct 2024",
    icon: "sun",
    tone: "green",
    description:
      "Rooftop PV system design, installation, inverter configuration and preventive maintenance.",
  },
  {
    id: "health",
    title: "Healthcare Assistant",
    category: "Healthcare",
    provider: "Skill Healthcare",
    duration: "4 Months",
    district: "Nagpur",
    certification: "HSSC Certified",
    mode: "On-site",
    seats: 35,
    starts: "05 Nov 2024",
    icon: "heart",
    tone: "purple",
    description:
      "Patient care fundamentals, vitals monitoring, hygiene protocols and hospital internship.",
  },
  {
    id: "auto",
    title: "Automotive Service Technician",
    category: "Automotive",
    provider: "Automotive Skills Council",
    duration: "5 Months",
    district: "Aurangabad",
    certification: "ASDC Certified",
    mode: "On-site",
    seats: 30,
    starts: "12 Nov 2024",
    icon: "car",
    tone: "orange",
    description:
      "Two- and four-wheeler diagnostics, engine service, EV basics and workshop safety.",
  },
  {
    id: "retail",
    title: "Retail Management",
    category: "Management",
    provider: "Retailers Skill Council",
    duration: "2 Months",
    district: "Thane",
    certification: "RASCI Certified",
    mode: "Online",
    seats: 60,
    starts: "25 Oct 2024",
    icon: "store",
    tone: "green",
    description:
      "Store operations, inventory, customer service and point-of-sale systems.",
  },
  {
    id: "data",
    title: "Data Analytics with Excel & SQL",
    category: "IT & Software",
    provider: "NPTEL",
    duration: "3 Months",
    district: "Pune",
    certification: "NPTEL Certified",
    mode: "Online",
    seats: 80,
    starts: "01 Nov 2024",
    icon: "chart",
    tone: "blue",
    description:
      "Advanced Excel, SQL queries, dashboards and a data storytelling project.",
  },
  {
    id: "welding",
    title: "Welding & Fabrication",
    category: "Industrial Skills",
    provider: "ITI Kolhapur",
    duration: "6 Months",
    district: "Kolhapur",
    certification: "NCVT Certified",
    mode: "On-site",
    seats: 20,
    starts: "18 Nov 2024",
    icon: "wrench",
    tone: "red",
    description:
      "Arc, MIG and TIG welding, blueprint reading and industrial safety certification.",
  },
];

export const assessments = {
  technical: [
    { id: "py", title: "Python Programming", questions: 30, minutes: 60, status: "not_started", icon: "code", tone: "blue" },
    { id: "web", title: "Web Development", questions: 40, minutes: 75, status: "completed", score: 82, icon: "globe", tone: "green" },
    { id: "ds", title: "Data Structures", questions: 30, minutes: 60, status: "in_progress", progress: 40, icon: "database", tone: "teal" },
    { id: "sql", title: "SQL & Databases", questions: 25, minutes: 45, status: "not_started", icon: "database", tone: "purple" },
  ],
  soft: [
    { id: "comm", title: "Communication Skills", questions: 20, minutes: 40, status: "completed", score: 88, icon: "message", tone: "purple", mandatory: true },
    { id: "prob", title: "Problem Solving", questions: 25, minutes: 45, status: "not_started", icon: "puzzle", tone: "red", mandatory: true },
    { id: "team", title: "Teamwork & Collaboration", questions: 20, minutes: 40, status: "not_started", icon: "users", tone: "amber", mandatory: true },
    { id: "work", title: "Workplace Readiness", questions: 20, minutes: 30, status: "in_progress", progress: 65, icon: "briefcase", tone: "blue", mandatory: true },
  ],
};

export const assessmentGuidelines = [
  "Secure browser environment",
  "Randomized questions",
  "Time monitoring",
  "No tab switching allowed",
  "Camera monitoring (if required)",
  "Instant results after completion",
];

export const certificates = [
  {
    id: "c1",
    title: "Full Stack Development Certificate",
    issuer: "Skill Maharashtra",
    issued: "10 Jan 2024",
    credentialId: "SKM-FSD-2024-00871",
    status: "verified",
    verifiedBy: "Skill Maharashtra registry",
    verifiedOn: "12 Jan 2024",
    tone: "green",
  },
  {
    id: "c2",
    title: "Python Programming Certificate",
    issuer: "TechSkill Academy",
    issued: "12 Jan 2024",
    credentialId: "TSA-PY-2024-1192",
    status: "verified",
    verifiedBy: "DigiLocker",
    verifiedOn: "14 Jan 2024",
    tone: "amber",
  },
  {
    id: "c3",
    title: "Web Development Certification",
    issuer: "Future Skills Institute",
    issued: "20 Nov 2023",
    credentialId: "FSI-WD-2023-3310",
    status: "pending",
    note: "Awaiting confirmation from the issuing institute.",
    tone: "red",
  },
  {
    id: "c4",
    title: "Data Analytics Certificate",
    issuer: "NPTEL",
    issued: "08 Sep 2023",
    credentialId: "NPTEL23-DA-45120",
    status: "verified",
    verifiedBy: "NPTEL public records",
    verifiedOn: "10 Sep 2023",
    tone: "purple",
  },
  {
    id: "c5",
    title: "Spoken English Certificate",
    issuer: "City Learning Centre",
    issued: "02 Feb 2023",
    credentialId: "CLC-ENG-0231",
    status: "rejected",
    note: "Credential ID could not be matched with the issuer's records.",
    tone: "blue",
  },
];

export const employment = {
  current: {
    company: "Tata Consultancy Services (TCS)",
    shortName: "tcs",
    role: "Software Developer",
    location: "Pune, Maharashtra",
    type: "Full-time",
    since: "Jan 2024",
    salary: "₹35,000",
    experience: "1.5 years",
    verified: true,
    retention: "9 months",
  },
  timeline: [
    {
      period: "Jan 2024 – Present",
      role: "Software Developer",
      company: "Tata Consultancy Services",
      pay: "₹35,000/month",
      status: "current",
    },
    {
      period: "Jun 2023 – Dec 2023",
      role: "Intern",
      company: "TCS",
      pay: "₹15,000/month",
      status: "previous",
    },
  ],
  proofs: [
    { name: "Offer Letter", status: "verified" },
    { name: "Salary Slip", status: "verified" },
    { name: "Employment Certificate", status: "verified" },
  ],
  wageHistory: [
    { month: "Jun 23", wage: 15000 },
    { month: "Sep 23", wage: 15000 },
    { month: "Dec 23", wage: 15000 },
    { month: "Jan 24", wage: 32000 },
    { month: "Apr 24", wage: 32000 },
    { month: "Jul 24", wage: 35000 },
    { month: "Sep 24", wage: 35000 },
  ],
};

export const employmentTypes = ["Full-time", "Part-time", "Self-employed", "Apprenticeship", "Contract"];

export const followUps = [
  { id: "f1", name: "Priya Sharma", district: "Nashik", lastFollowUp: "15 Jun 2024", nextFollowUp: "15 Sep 2024", status: "due", employment: "Employed", channel: "SMS" },
  { id: "f2", name: "Rahul Patil", district: "Pune", lastFollowUp: "10 Jun 2024", nextFollowUp: "10 Sep 2024", status: "due", employment: "Seeking", channel: "WhatsApp" },
  { id: "f3", name: "Sneha Deshmukh", district: "Nagpur", lastFollowUp: "01 Jul 2024", nextFollowUp: "01 Oct 2024", status: "scheduled", employment: "Self-Employed", channel: "Call" },
  { id: "f4", name: "Amit Kumar", district: "Thane", lastFollowUp: "20 Jun 2024", nextFollowUp: "20 Sep 2024", status: "due", employment: "Not Employed", channel: "Email" },
  { id: "f5", name: "Pooja Salve", district: "Aurangabad", lastFollowUp: "05 Jul 2024", nextFollowUp: "05 Oct 2024", status: "scheduled", employment: "Employed", channel: "WhatsApp" },
  { id: "f6", name: "Vikram Jadhav", district: "Kolhapur", lastFollowUp: "12 May 2024", nextFollowUp: "12 Aug 2024", status: "completed", employment: "Apprenticeship", channel: "Call" },
  { id: "f7", name: "Anjali More", district: "Mumbai", lastFollowUp: "28 May 2024", nextFollowUp: "28 Aug 2024", status: "completed", employment: "Employed", channel: "SMS" },
];

export const followUpChannels = [
  { name: "SMS", description: "Add automated SMS", icon: "sms", tone: "blue" },
  { name: "WhatsApp", description: "Send WhatsApp messages", icon: "whatsapp", tone: "green" },
  { name: "Email", description: "Send email notifications", icon: "mail", tone: "red" },
  { name: "Call", description: "Assisted calling", icon: "phone", tone: "teal" },
  { name: "Skill Development", description: "Additional hands-on training", icon: "training", tone: "purple" },
];

export const employmentStatuses = ["Employed", "Self-Employed", "Apprenticeship", "Seeking", "Not Employed"];

export const skillGaps = {
  top: [
    { skill: "Advanced Excel", gap: 42, tone: "blue" },
    { skill: "Communication Skills", gap: 38, tone: "amber" },
    { skill: "Industrial Safety", gap: 31, tone: "purple" },
    { skill: "Machine Operation", gap: 29, tone: "red" },
    { skill: "Customer Service", gap: 25, tone: "red" },
    { skill: "Problem Solving", gap: 22, tone: "blue" },
  ],
  categories: [
    { name: "Digital", gap: 36 },
    { name: "Soft Skills", gap: 30 },
    { name: "Technical", gap: 27 },
    { name: "Safety & Compliance", gap: 24 },
  ],
  byDistrict: [
    { district: "Nashik", high: 32, medium: 22, low: 14 },
    { district: "Pune", high: 18, medium: 27, low: 20 },
    { district: "Nagpur", high: 24, medium: 16, low: 21 },
    { district: "Thane", high: 12, medium: 34, low: 16 },
    { district: "Aurangabad", high: 28, medium: 18, low: 25 },
  ],
  byCourse: [
    { course: "Electrician", gap: 41 },
    { course: "Retail Mgmt", gap: 33 },
    { course: "Healthcare Asst.", gap: 27 },
    { course: "Automotive", gap: 24 },
    { course: "Web Dev", gap: 18 },
  ],
  nonPlacementReasons: [
    { reason: "Skill Gaps", value: 42 },
    { reason: "Low Job Demand", value: 18 },
    { reason: "Certification Issues", value: 15 },
    { reason: "Geographic Constraints", value: 13 },
    { reason: "Personal Reasons", value: 12 },
  ],
  recommendations: [
    { title: "Add Advanced Excel module", detail: "Bridges the largest gap across 5 districts.", tone: "blue" },
    { title: "Mandatory communication labs", detail: "Weekly mock interviews for all IT batches.", tone: "amber" },
    { title: "Industrial safety certification", detail: "Partner with MIDC units in Nashik & Aurangabad.", tone: "purple" },
  ],
};

export const analytics = {
  periods: ["Last 3 Months", "Last 6 Months", "Last 12 Months"],
  kpis: [
    { label: "Total Trainees", value: "1,24,680", change: "+8.2%", up: true, tone: "blue" },
    { label: "Employment Rate", value: "68.5%", change: "+4.1%", up: true, tone: "green" },
    { label: "Self Employment", value: "12.3%", change: "+1.3%", up: true, tone: "orange" },
    { label: "Apprenticeships", value: "8.7%", change: "+0.9%", up: true, tone: "purple" },
    { label: "Job Retention (6M)", value: "82.1%", change: "-0.6%", up: false, tone: "red" },
  ],
  outcomes: [
    { name: "Employed", value: 68.5 },
    { name: "Self-Employed", value: 12.3 },
    { name: "Apprenticeship", value: 8.7 },
    { name: "Seeking Employment", value: 7.1 },
    { name: "Not Placed", value: 3.4 },
  ],
  trends: [
    { month: "Jan", employment: 60.2, self: 10.1, apprentice: 6.9 },
    { month: "Feb", employment: 62.8, self: 10.6, apprentice: 7.0 },
    { month: "Mar", employment: 62.1, self: 10.4, apprentice: 7.2 },
    { month: "Apr", employment: 63.4, self: 11.0, apprentice: 7.4 },
    { month: "May", employment: 64.9, self: 11.2, apprentice: 7.6 },
    { month: "Jun", employment: 64.6, self: 11.1, apprentice: 7.5 },
    { month: "Jul", employment: 66.2, self: 11.6, apprentice: 7.9 },
    { month: "Aug", employment: 65.8, self: 11.9, apprentice: 8.0 },
    { month: "Sep", employment: 67.1, self: 12.4, apprentice: 8.2 },
    { month: "Oct", employment: 66.7, self: 12.1, apprentice: 8.3 },
    { month: "Nov", employment: 67.9, self: 12.5, apprentice: 8.6 },
    { month: "Dec", employment: 68.5, self: 12.3, apprentice: 8.7 },
  ],
  wageProgression: [
    { stage: "At placement", wage: 14200 },
    { stage: "6 months", wage: 16800 },
    { stage: "12 months", wage: 19100 },
    { stage: "24 months", wage: 23400 },
  ],
  retention: [
    { stage: "3M", rate: 91.4 },
    { stage: "6M", rate: 82.1 },
    { stage: "12M", rate: 71.6 },
  ],
  providers: [
    { name: "Skill Maharashtra", trainees: 18420, placement: 76.2, retention: 85.4 },
    { name: "TechSkill Academy", trainees: 9340, placement: 71.8, retention: 83.1 },
    { name: "Future Skills Institute", trainees: 7610, placement: 69.4, retention: 80.2 },
    { name: "Skill Healthcare", trainees: 5280, placement: 66.9, retention: 78.8 },
    { name: "ITI Kolhapur", trainees: 4120, placement: 61.3, retention: 74.5 },
  ],
  districts: [
    { name: "Pune", trainees: 21840, placement: 74.1 },
    { name: "Mumbai", trainees: 19620, placement: 72.6 },
    { name: "Thane", trainees: 14300, placement: 69.8 },
    { name: "Nagpur", trainees: 12910, placement: 66.2 },
    { name: "Nashik", trainees: 11480, placement: 63.5 },
    { name: "Aurangabad", trainees: 9760, placement: 60.9 },
  ],
};

export const aiSuggestions = [
  "Why is the employment rate lower for the Electrical Technician course in Nashik district?",
  "Which providers have the best 6-month retention?",
  "What skills should Pune batches add next quarter?",
];

export const aiAnswers = {
  [aiSuggestions[0]]: {
    intro: "Based on the data from SkillTrace, here are the key reasons:",
    points: [
      { title: "Skill Gaps (42%)", text: "Industrial safety and advanced electrical systems skills are frequently missing in assessment results." },
      { title: "Low Job Demand in Nashik (18%)", text: "Fewer electrical openings were posted this year compared with Pune." },
      { title: "Certification Issues (15%)", text: "Some certificates are still pending verification with the issuer." },
      { title: "Geographic Constraints (13%)", text: "Many trained candidates relocate to other districts." },
    ],
    sources: ["District Analysis Report", "Course Outcome Data", "Trainee Feedback"],
    metrics: [
      { label: "Nashik placement", value: "54.2%" },
      { label: "State average", value: "68.5%" },
      { label: "Batch size", value: "312" },
    ],
  },
  [aiSuggestions[1]]: {
    intro: "Ranking providers by 6-month job retention for the selected period:",
    points: [
      { title: "Skill Maharashtra (85.4%)", text: "Strong employer tie-ups and structured post-placement mentoring." },
      { title: "TechSkill Academy (83.1%)", text: "High retention in IT roles; weaker in industrial trades." },
      { title: "Future Skills Institute (80.2%)", text: "Green-jobs cohorts retain well; healthcare cohorts drop after month 4." },
    ],
    sources: ["Provider Outcome Data", "Follow-up Records"],
    metrics: [
      { label: "Top provider", value: "85.4%" },
      { label: "State average", value: "82.1%" },
      { label: "Providers compared", value: "5" },
    ],
  },
  [aiSuggestions[2]]: {
    intro: "For Pune batches, the largest measurable gaps are:",
    points: [
      { title: "Advanced Excel (27% medium gap)", text: "Frequently requested in retail and back-office openings." },
      { title: "Communication Skills", text: "Mock-interview scores trail the state average by 6 points." },
      { title: "Cloud fundamentals", text: "Rising in IT job postings across the district." },
    ],
    sources: ["Skill Gap Analysis", "Employer Demand Signals"],
    metrics: [
      { label: "Pune high gaps", value: "18%" },
      { label: "Pune placement", value: "74.1%" },
      { label: "Open roles", value: "1,240" },
    ],
  },
};

export const aiFallbackAnswer = {
  intro: "Here is what the SkillTrace demo data shows for your question:",
  points: [
    { title: "Placement is improving", text: "The employment rate rose from 60.2% to 68.5% over the last 12 months." },
    { title: "Skill gaps remain the top barrier", text: "42% of non-placed trainees cite missing skills." },
  ],
  sources: ["Outcome Trends", "Skill Gap Analysis"],
  metrics: [
    { label: "Employment rate", value: "68.5%" },
    { label: "Retention (6M)", value: "82.1%" },
  ],
};

export const aiRecommendations = [
  { title: "Update Curriculum", detail: "Add more industrial safety training", icon: "book", tone: "orange" },
  { title: "Industry Partnerships", detail: "Partner with local employers", icon: "handshake", tone: "red" },
  { title: "Placement Support", detail: "Organize job fairs in Nashik", icon: "briefcase", tone: "teal" },
  { title: "Follow-up Tracking", detail: "Regular follow-ups for non-placed", icon: "followup", tone: "blue" },
  { title: "Skill Development", detail: "Additional hands-on training", icon: "training", tone: "red" },
];

export const aiInsights = [
  { title: "Retention dips after month 4 in healthcare", detail: "Healthcare Assistant cohorts lose 11% of placements between months 4 and 6.", tag: "Retention", tone: "red" },
  { title: "Green jobs outperform in Pune", detail: "Solar installation trainees show 78% placement, 9.5 points above average.", tag: "Opportunity", tone: "green" },
  { title: "Wage growth is strongest in IT", detail: "IT placements grow wages 64% within 24 months of placement.", tag: "Wages", tone: "blue" },
  { title: "Pending certificates delay placement", detail: "Trainees with pending verification wait 23 days longer on average.", tag: "Verification", tone: "amber" },
];

export const landingFeatures = [
  { title: "Verified Certificates", description: "Tamper-proof certificate verification with issuer records.", icon: "certificate", tone: "green" },
  { title: "Skill Assessments", description: "Secure technical and mandatory soft-skill assessments.", icon: "assessment", tone: "amber" },
  { title: "Employment Tracking", description: "Track placements, wages and retention over time.", icon: "employment", tone: "blue" },
  { title: "Government Analytics", description: "District and provider outcome intelligence for policy.", icon: "analytics", tone: "orange" },
];

export const lifecycle = [
  { title: "Enrol", description: "Trainee profile created with consent and verified identity.", icon: "users" },
  { title: "Train", description: "Attendance and progress captured from partner providers.", icon: "training" },
  { title: "Assess", description: "Secure technical and mandatory soft-skill assessments.", icon: "assessment" },
  { title: "Certify", description: "Certificates verified against issuer records.", icon: "certificate" },
  { title: "Place", description: "Employment, self-employment or apprenticeship recorded and verified.", icon: "employment" },
  { title: "Follow up", description: "3, 6 and 12-month follow-ups track retention and wages.", icon: "followup" },
];

export const landingStats = [
  { value: "1.2M+", label: "Trainees" },
  { value: "500+", label: "Training Providers" },
  { value: "68.5%", label: "Employment Rate" },
  { value: "15+", label: "Districts" },
];

export const roles = [
  { id: "trainee", title: "Trainee", description: "Manage profile, assessments and track your career", icon: "user", tone: "blue", href: "/dashboard" },
  { id: "provider", title: "Training Provider", description: "Manage programs and track trainee outcomes", icon: "briefcase", tone: "green", href: "/training" },
  { id: "employer", title: "Employer", description: "Verify candidates and provide employment details", icon: "briefcase", tone: "orange", href: "/employment" },
  { id: "government", title: "Government", description: "Monitor impact and make data-driven decisions", icon: "landmark", tone: "green", href: "/analytics" },
];
