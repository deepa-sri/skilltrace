"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand";
import { Aurora } from "@/components/common";
import { LanguageSwitcher, ThemeToggle } from "@/components/controls";

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden border-r bg-card lg:block">
        <Aurora />
        <div className="relative flex h-full flex-col p-10">
          <Logo />
          <div className="my-auto max-w-md">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">Every trainee. Every outcome. <span className="text-gradient">Traced with consent.</span></h2>
            <ul className="mt-8 space-y-4 text-sm">
              {["One Unique Trainee ID across programmes", "Certificates checked against issuer registries", "Secure, fair and explainable assessments", "Follow-ups at 30, 90, 180 and 365 days", "Your data used only for the purposes you allow"].map((x, i) => (
                <motion.li key={x} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />{x}
                </motion.li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">SIH 2026 prototype · demo data is fictional</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1 p-4">
          <div className="lg:hidden"><Logo /></div>
          <div className="flex-1" />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center">{children}</div>
      </div>
    </div>
  );
}
