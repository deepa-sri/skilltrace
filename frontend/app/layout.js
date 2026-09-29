import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata = {
  title: {
    default: "SkillTrace by JobGenie",
    template: "%s · SkillTrace",
  },
  description:
    "Longitudinal skilling-outcome intelligence: verified skills, certificates, employment, follow-ups and outcome analytics.",
  icons: { icon: "/assets/brand/skilltrace-icon.svg" },
};

export const viewport = {
  themeColor: "#2563EB",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
