import { Sidebar, MobileBottomNav } from "@/components/layout/sidebar";
import { RightPanel } from "@/components/layout/right-panel";
import { MobileHeader } from "@/components/layout/mobile-header";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth-helpers";

async function getUnreadCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  await connectDB();
  return Notification.countDocuments({ recipient: user._id, read: false });
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const unreadCount = await getUnreadCount().catch(() => 0);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl gap-6 px-0 md:px-6">
      <Sidebar unreadCount={unreadCount} />
      <main className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0">
        <MobileHeader />
        <div className="mx-auto w-full max-w-[640px] px-4 py-4 md:py-6">{children}</div>
      </main>
      <RightPanel />
      <MobileBottomNav unreadCount={unreadCount} />
    </div>
  );
}
