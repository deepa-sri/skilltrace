import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className, variant = "full" }) {
  const isIcon = variant === "icon";
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center rounded-md", className)} aria-label="SkillTrace by JobGenie — home">
      <Image
        src={isIcon ? "/assets/brand/skilltrace-icon.svg" : "/assets/brand/skilltrace-logo.svg"}
        alt=""
        width={isIcon ? 36 : 172}
        height={isIcon ? 36 : 46}
        priority
        className={isIcon ? "size-9" : "h-[46px] w-auto"}
      />
    </Link>
  );
}

// White wordmark for dark surfaces (login panel). Uses the brand icon asset.
export function LogoOnDark({ className }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/assets/brand/skilltrace-icon.svg" alt="" width={40} height={40} className="size-10" />
      <span className="leading-tight">
        <span className="block text-xl font-extrabold text-white">SkillTrace</span>
        <span className="block text-[11px] font-semibold text-blue-100">by JobGenie</span>
      </span>
    </Link>
  );
}
