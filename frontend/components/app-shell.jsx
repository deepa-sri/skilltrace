"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity, Award, Bell, BookOpenCheck, Briefcase, Building2, CalendarClock, ClipboardCheck, FileCheck2, GaugeCircle,
  GraduationCap, History, LayoutDashboard, ListChecks, Loader2, LogOut, Menu, Settings2, ShieldCheck, Sparkles, Target, UserRound, Users,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { LanguageSwitcher, ThemeToggle } from "@/components/controls";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn, ROLE_HOME, timeAgo } from "@/lib/utils";

const NAV = {
  TRAINEE: [
    { href: "/trainee", icon: LayoutDashboard, k: "nav.dashboard" },
    { href: "/trainee/profile", icon: UserRound, k: "nav.profile" },
    { href: "/trainee/consent", icon: ShieldCheck, k: "nav.consent" },
    { href: "/trainee/training", icon: GraduationCap, k: "nav.training" },
    { href: "/trainee/certificates", icon: FileCheck2, k: "nav.certificates" },
    { href: "/trainee/skills", icon: Sparkles, k: "nav.skills" },
    { href: "/trainee/assessments", icon: ClipboardCheck, k: "nav.assessments" },
    { href: "/trainee/competency", icon: Target, k: "nav.competency" },
    { href: "/trainee/employment", icon: Briefcase, k: "nav.employment" },
    { href: "/trainee/followups", icon: CalendarClock, k: "nav.followups" },
    { href: "/trainee/timeline", icon: History, k: "nav.timeline" },
  ],
  PROVIDER: [
    { href: "/provider", icon: LayoutDashboard, label: "Overview" },
    { href: "/provider/programmes", icon: BookOpenCheck, label: "Programmes" },
    { href: "/provider/enrollments", icon: Users, label: "Enrollments" },
    { href: "/provider/questions", icon: ListChecks, label: "Question bank" },
  ],
  EMPLOYER: [{ href: "/employer", icon: Building2, label: "Verification requests" }],
  OFFICER: [
    { href: "/officer", icon: LayoutDashboard, label: "Overview" },
    { href: "/officer/certificates", icon: FileCheck2, label: "Certificate reviews" },
    { href: "/officer/assessments", icon: Activity, label: "Assessment reviews" },
  ],
  ADMIN: [
    { href: "/admin", icon: GaugeCircle, label: "Impact analytics" },
    { href: "/admin/operations", icon: Settings2, label: "Follow-ups & audit" },
    { href: "/admin/questions", icon: ListChecks, label: "Question bank" },
    { href: "/officer/certificates", icon: FileCheck2, label: "Certificate reviews" },
    { href: "/officer/assessments", icon: Activity, label: "Assessment reviews" },
  ],
};
const ROLE_LABEL = { TRAINEE: "Trainee", PROVIDER: "Training provider", EMPLOYER: "Employer", OFFICER: "Verification officer", ADMIN: "Government administrator" };
const PREFIX = { TRAINEE: ["/trainee"], PROVIDER: ["/provider"], EMPLOYER: ["/employer"], OFFICER: ["/officer"], ADMIN: ["/admin", "/officer"] };

function NavList({ role, onNavigate }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = NAV[role] || [];
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== ROLE_HOME[role] && pathname.startsWith(it.href + "/"));
        const Icon = it.icon;
        return (
          <Link key={it.href} href={it.href} onClick={onNavigate}
            className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", active && "text-primary hover:text-primary")}>
            {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <Icon className="relative h-4 w-4" />
            <span className="relative truncate">{it.k ? t(it.k) : it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Notifications() {
  const [data, setData] = useState({ unread: 0, items: [] });
  const router = useRouter();
  const { t } = useI18n();
  const load = () => api("/me/notifications/").then(setData).catch(() => {});
  useEffect(() => {
    load();
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, []);
  return (
    <DropdownMenu onOpenChange={(o) => o && data.unread && api("/me/notifications/", { method: "POST", body: {} }).then(setData)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("nav.notifications")} className="relative">
          <Bell />
          {data.unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-bold text-white">{data.unread}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">{t("nav.notifications")}</div>
        <div className="max-h-96 overflow-y-auto">
          {data.items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">{t("common.none")}</div>}
          {data.items.map((n) => (
            <DropdownMenuItem key={n.id} onSelect={() => n.link && router.push(n.link)} className="flex-col items-start gap-0.5 rounded-none border-b px-4 py-3 last:border-0">
              <div className="flex w-full items-center gap-2">
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-saffron" />}
                <span className="flex-1 font-medium">{n.title}</span>
                <span className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
              </div>
              {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppShell({ children }) {
  const { user, ready, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!PREFIX[user.role].some((p) => pathname.startsWith(p))) router.replace(ROLE_HOME[user.role]);
  }, [ready, user, pathname, router]);

  if (!ready || !user || !PREFIX[user.role].some((p) => pathname.startsWith(p))) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const sidebar = (onNavigate) => (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5"><Logo href={ROLE_HOME[user.role]} /></div>
      <div className="mx-3 mb-3 rounded-xl border bg-gradient-to-br from-primary/10 via-transparent to-saffron/10 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{ROLE_LABEL[user.role]}</div>
        <div className="truncate text-sm font-semibold">{user.provider_name || user.organisation || user.full_name}</div>
        {user.profile?.uti && <div className="mt-0.5 font-mono text-xs text-primary">{user.profile.uti}</div>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4"><NavList role={user.role} onNavigate={onNavigate} /></div>
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}><LogOut />{t("nav.logout")}</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/60 backdrop-blur lg:block">{sidebar()}</aside>
      <Dialog open={open} onOpenChange={setOpen}><SheetContent>{sidebar(() => setOpen(false))}</SheetContent></Dialog>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></Button>
          <div className="lg:hidden"><Logo href={ROLE_HOME[user.role]} sub={false} /></div>
          <div className="flex-1" />
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Notifications />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Avatar name={user.full_name} /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel className="text-foreground">
                <div className="text-sm">{user.full_name}</div>
                <div className="font-normal text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === "TRAINEE" && <DropdownMenuItem onSelect={() => router.push("/trainee/profile")}><UserRound />{t("nav.profile")}</DropdownMenuItem>}
              {user.role === "TRAINEE" && <DropdownMenuItem onSelect={() => router.push("/trainee/consent")}><ShieldCheck />{t("nav.consent")}</DropdownMenuItem>}
              <DropdownMenuItem onSelect={logout}><LogOut />{t("nav.logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
