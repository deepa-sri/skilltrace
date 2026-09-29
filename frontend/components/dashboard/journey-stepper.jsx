import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const dot = {
  done: "bg-blue-600 text-white ring-4 ring-blue-100",
  current: "bg-emerald-500 text-white ring-4 ring-emerald-100",
  upcoming: "border-2 border-slate-300 bg-white text-slate-400",
};

// Horizontal progress journey; scrolls sideways on narrow screens.
export function JourneyStepper({ steps }) {
  return (
    <div className="scrollbar-none -mx-5 overflow-x-auto px-5">
      <ol className="flex min-w-[560px]">
        {steps.map((step, i) => (
          <li key={step.label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-3.5 right-1/2 h-0.5 w-full",
                  step.state === "upcoming" ? "bg-slate-200" : step.state === "current" ? "bg-emerald-400" : "bg-blue-500"
                )}
              />
            )}
            <span className={cn("relative z-10 grid size-7 place-items-center rounded-full", dot[step.state])}>
              {step.state === "upcoming" ? <span className="size-2 rounded-full bg-slate-300" /> : <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "mt-3 text-xs font-semibold",
                step.state === "current" ? "text-emerald-600" : step.state === "done" ? "text-slate-800" : "text-slate-400"
              )}
            >
              {step.label}
            </span>
            <span className="text-[11px] text-slate-400">{step.date}</span>
            <span className="sr-only">
              {step.state === "done" ? "completed" : step.state === "current" ? "current stage" : "upcoming"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
