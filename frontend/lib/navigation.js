export const navGroups = [
  {
    label: "Trainee",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { title: "My Profile", href: "/trainee", icon: "users" },
      { title: "Training & Courses", href: "/training", icon: "training" },
      { title: "Assessments", href: "/assessments", icon: "assessment" },
      { title: "Certificates", href: "/certificates", icon: "certificate" },
      { title: "Employment", href: "/employment", icon: "employment" },
    ],
  },
  {
    label: "Outcomes & Insights",
    items: [
      { title: "Follow-ups", href: "/follow-ups", icon: "followup" },
      { title: "Skill Gaps", href: "/skill-gaps", icon: "skills" },
      { title: "Analytics", href: "/analytics", icon: "analytics" },
      { title: "AI Insights", href: "/ai-insights", icon: "ai" },
    ],
  },
];

export const bottomNav = [
  { title: "Home", href: "/dashboard", icon: "dashboard" },
  { title: "Assessments", href: "/assessments", icon: "assessment" },
  { title: "Jobs", href: "/employment", icon: "employment" },
  { title: "Analytics", href: "/analytics", icon: "analytics" },
  { title: "Profile", href: "/trainee", icon: "users" },
];

const allItems = navGroups.flatMap((group) => group.items);

export function findNavItem(pathname) {
  return allItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
