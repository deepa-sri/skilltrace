import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/600.css";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata = {
  title: "SkillTrace by JobGenie",
  description: "Skilling outcome intelligence: verify certificates, assess competency, track employment and measure programme impact.",
  icons: { icon: "/icon.svg" },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0f766e" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
