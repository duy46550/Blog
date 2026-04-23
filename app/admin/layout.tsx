import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { Types } from "mongoose";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/agents", label: "AI Agents" },
  { href: "/admin/runs", label: "AI Runs" },
  { href: "/admin/keys", label: "API Keys" },
  { href: "/admin/posts", label: "Posts" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("role displayName")
    .lean<{ role: string; displayName: string; _id: Types.ObjectId }>();

  if (!user || user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r bg-muted/30 px-3 py-6">
        <p className="mb-6 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <Link href="/" className="px-3 text-xs text-muted-foreground hover:underline">
            ← Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
