import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const inr = (v) => (v == null ? "—" : "₹" + Number(v).toLocaleString("en-IN"));
export const pct = (v) => (v == null ? "—" : `${v}%`);
export const title = (s) => (s ? s.toString().replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "");

export function fmtDate(d, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date) ? "—" : date.toLocaleDateString("en-IN", opts);
}

export function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export const ROLE_HOME = {
  TRAINEE: "/trainee",
  PROVIDER: "/provider",
  EMPLOYER: "/employer",
  OFFICER: "/officer",
  ADMIN: "/admin",
};
