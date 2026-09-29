import {
  BookOpen,
  BriefcaseBusiness,
  Car,
  ChartColumn,
  CodeXml,
  Database,
  Globe,
  Handshake,
  HeartPulse,
  Landmark,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Phone,
  Puzzle,
  Store,
  Sun,
  UserRound,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toneSoft } from "@/lib/tones";

// Icons shipped in SkillTrace_UI_Assets/icons — preferred over Lucide.
const ASSET_ICONS = new Set([
  "ai",
  "analytics",
  "assessment",
  "bell",
  "certificate",
  "check",
  "dashboard",
  "employment",
  "followup",
  "lock",
  "map",
  "search",
  "shield",
  "skills",
  "training",
  "users",
]);

// Lucide fallbacks for icons the asset pack does not contain.
const LUCIDE_ICONS = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  car: Car,
  chart: ChartColumn,
  code: CodeXml,
  database: Database,
  globe: Globe,
  handshake: Handshake,
  heart: HeartPulse,
  landmark: Landmark,
  mail: Mail,
  message: MessageSquare,
  phone: Phone,
  puzzle: Puzzle,
  sms: MessageSquareText,
  store: Store,
  sun: Sun,
  user: UserRound,
  whatsapp: MessageCircle,
  wrench: Wrench,
  zap: Zap,
};

export function Icon({ name, className }) {
  if (ASSET_ICONS.has(name)) {
    return (
      <span
        aria-hidden="true"
        className={cn("asset-icon size-5", className)}
        style={{ "--icon": `url(/assets/icons/${name}.svg)` }}
      />
    );
  }
  const LucideIcon = LUCIDE_ICONS[name] ?? CodeXml;
  return <LucideIcon aria-hidden="true" className={cn("size-5", className)} />;
}

export function IconTile({ name, tone = "blue", size = "md", className }) {
  const sizes = {
    sm: "size-8 rounded-lg [&>*]:size-4",
    md: "size-10 rounded-xl [&>*]:size-5",
    lg: "size-12 rounded-2xl [&>*]:size-6",
  };
  return (
    <span className={cn("grid shrink-0 place-items-center", sizes[size], toneSoft[tone], className)}>
      <Icon name={name} />
    </span>
  );
}
