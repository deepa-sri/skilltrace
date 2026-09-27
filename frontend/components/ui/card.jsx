import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef(({ className, ...p }, ref) => (
  <div ref={ref} className={cn("rounded-2xl border bg-card text-card-foreground shadow-sm", className)} {...p} />
));
Card.displayName = "Card";
export const CardHeader = ({ className, ...p }) => <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h3 className={cn("text-base font-semibold leading-tight tracking-tight", className)} {...p} />;
export const CardDescription = ({ className, ...p }) => <p className={cn("text-sm text-muted-foreground", className)} {...p} />;
export const CardContent = ({ className, ...p }) => <div className={cn("p-5 pt-0", className)} {...p} />;
export const CardFooter = ({ className, ...p }) => <div className={cn("flex items-center p-5 pt-0", className)} {...p} />;
