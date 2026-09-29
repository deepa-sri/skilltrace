"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IconTile } from "@/components/shared/icon";
import { FieldError, ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { roles } from "@/lib/mock-data";

function validate({ identifier, password }) {
  const errors = {};
  const isPhone = /^(\+91[\s-]?)?[6-9]\d{4}\s?\d{5}$/.test(identifier.trim());
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  if (!identifier.trim()) errors.identifier = "Enter your mobile number or email.";
  else if (!isPhone && !isEmail) errors.identifier = "Enter a valid 10-digit mobile number or email address.";
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  return errors;
}

export function RoleSelector({ defaultRole }) {
  const router = useRouter();
  const [role, setRole] = useState(roles.some((r) => r.id === defaultRole) ? defaultRole : "trainee");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const selected = roles.find((r) => r.id === role);

  function submit(event) {
    event.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    setOpen(false);
    toast.success(`Signed in as ${selected.title}`, { description: "Demo session — no data leaves your browser." });
    router.push(selected.href);
  }

  return (
    <div className="w-full max-w-xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Choose Your Role</h1>
        <p className="mt-1 text-sm text-muted-foreground">Select your role to continue</p>
      </div>

      <RadioGroup value={role} onValueChange={setRole} aria-label="Role" className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {roles.map((r) => (
          <Label
            key={r.id}
            htmlFor={`role-${r.id}`}
            className="relative flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 font-normal transition hover:border-blue-200 has-[[data-state=checked]]:border-blue-500 has-[[data-state=checked]]:bg-blue-50/60 has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-blue-500/15 sm:flex-col sm:p-6 sm:text-center"
          >
            <RadioGroupItem id={`role-${r.id}`} value={r.id} className="absolute top-3 right-3" />
            <IconTile name={r.icon} tone={r.tone} size="lg" />
            <span className="min-w-0">
              <span className="block font-bold text-slate-900">{r.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{r.description}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      <Button size="lg" className="mt-6 h-12 w-full rounded-[10px]" onClick={() => router.push(selected.href)}>
        Continue as {selected.title} <ArrowRight />
      </Button>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <ResponsiveDialog
          open={open}
          onOpenChange={setOpen}
          title={`Login as ${selected.title}`}
          description="Use your registered mobile number or email."
          trigger={
            <Button variant="link" className="h-auto p-0 font-semibold">
              Login
            </Button>
          }
        >
          <form noValidate onSubmit={submit} className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="identifier">Mobile number or email</Label>
              <Input
                id="identifier"
                autoComplete="username"
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                aria-invalid={!!errors.identifier}
                aria-describedby="identifier-error"
                placeholder="98765 43210"
                className="h-11"
              />
              <FieldError id="identifier-error" message={errors.identifier} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                aria-invalid={!!errors.password}
                aria-describedby="password-error"
                className="h-11"
              />
              <FieldError id="password-error" message={errors.password} />
            </div>
            <Button type="submit" className="h-11 rounded-[10px]">
              Login
            </Button>
          </form>
        </ResponsiveDialog>
      </p>
    </div>
  );
}
