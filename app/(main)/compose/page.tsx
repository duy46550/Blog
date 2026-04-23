import { requireUser } from "@/lib/auth-helpers";
import { ComposeForm } from "@/components/feed/compose-form";

export const metadata = { title: "Tạo bài" };

export default async function ComposePage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Tạo bài</h1>
      <ComposeForm autoFocus />
    </div>
  );
}
