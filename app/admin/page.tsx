import { requireAdmin } from "@/lib/auth-helpers";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">Admin</h1>
      <p className="text-muted-foreground">Xin chào {admin.displayName}. Dashboard sẽ xây ở Phase 4.</p>
    </div>
  );
}
