import { Sidebar, MobileBottomNav } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl gap-6 px-0 md:px-6" suppressHydrationWarning>
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0" suppressHydrationWarning>
        <MobileHeader />
        <div className="mx-auto w-full max-w-[640px] px-4 py-4 md:py-6" suppressHydrationWarning>{children}</div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
