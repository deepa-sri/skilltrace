"use client";
import * as DM from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;
export function DropdownMenuContent({ className, align = "end", ...p }) {
  return (
    <DM.Portal>
      <DM.Content align={align} sideOffset={6} className={cn("z-50 min-w-[12rem] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", className)} {...p} />
    </DM.Portal>
  );
}
export function DropdownMenuItem({ className, ...p }) {
  return <DM.Item className={cn("relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:size-4", className)} {...p} />;
}
export const DropdownMenuLabel = ({ className, ...p }) => <DM.Label className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...p} />;
export const DropdownMenuSeparator = ({ className, ...p }) => <DM.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...p} />;
