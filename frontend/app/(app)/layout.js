import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <AppHeader />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-4 pb-24 md:px-6 md:pt-6 md:pb-10 lg:px-8">{children}</div>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  );
}
