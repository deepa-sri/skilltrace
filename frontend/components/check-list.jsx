"use client";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, CircleDashed, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON = { pass: [CheckCircle2, "text-success"], fail: [XCircle, "text-destructive"], warn: [AlertTriangle, "text-warning"], skip: [MinusCircle, "text-muted-foreground"] };

export function CheckList({ checks }) {
  return (
    <ol className="relative space-y-3 border-l pl-5">
      {checks.map((c, i) => {
        const [I, cls] = ICON[c.result] || [CircleDashed, "text-muted-foreground"];
        return (
          <motion.li key={c.key + i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="relative">
            <I className={cn("absolute -left-[29px] top-0 h-4 w-4 bg-card", cls)} />
            <div className="text-sm font-medium">{c.label}</div>
            <div className="text-xs text-muted-foreground">{c.detail}</div>
          </motion.li>
        );
      })}
    </ol>
  );
}

