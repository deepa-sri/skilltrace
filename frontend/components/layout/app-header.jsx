"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, LogOut, Menu, Repeat, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Icon } from "@/components/shared/icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { findNavItem } from "@/lib/navigation";
import { notifications, trainee } from "@/lib/mock-data";
import { toneSolid } from "@/lib/tones";
import { cn } from "@/lib/utils";

function Notifications() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative size-10 rounded-xl border-slate-200" aria-label={`Notifications, ${notifications.length} new`}>
          <Icon name="bell" className="size-[18px] text-slate-600" />
          <span className="absolute top-2 right-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <p className="border-b px-4 py-3 text-sm font-bold">Notifications</p>
        <ul className="divide-y">
          {notifications.map((n) => (
            <li key={n.title} className="flex gap-3 px-4 py-3">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneSolid[n.tone])} aria-hidden="true" />
              <div>
                <p className="text-sm text-slate-800">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2.5 rounded-xl px-2">
          <UserAvatar name={trainee.name} className="size-9 text-sm" />
          <span className="text-left leading-tight max-lg:hidden">
            <span className="block text-sm font-semibold text-slate-900">{trainee.name}</span>
            <span className="block text-xs text-muted-foreground">{trainee.role}</span>
          </span>
          <ChevronDown className="text-slate-400 max-lg:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl">
        <DropdownMenuLabel>{trainee.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/trainee">
            <UserRound /> My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/login">
            <Repeat /> Switch role
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <LogOut /> Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const current = findNavItem(pathname);
  const isHome = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      {/* Mobile: back · title · actions */}
      <div className="grid h-14 grid-cols-[2.75rem_1fr_auto] items-center gap-2 px-3 md:hidden">
        {isHome ? (
          <span />
        ) : (
          <Button asChild variant="ghost" size="icon" className="size-11">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ChevronLeft className="size-6" />
            </Link>
          </Button>
        )}
        <p className="truncate text-center text-base font-bold text-slate-900">{current?.title ?? "SkillTrace"}</p>
        <div className="flex items-center gap-1">
          <Notifications />
          <Button variant="ghost" size="icon" className="size-11" onClick={toggleSidebar} aria-label="Open navigation menu">
            <Menu className="size-6 text-blue-600" />
          </Button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden h-16 items-center justify-between gap-4 px-6 md:flex">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="size-9 text-slate-500" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">SkillTrace</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{current?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-3">
          <Notifications />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
