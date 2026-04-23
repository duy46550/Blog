import { ComposeForm } from "@/components/feed/compose-form";

export const metadata = { title: "Tạo bài" };

export default function ComposePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Tạo bài</h1>
      <ComposeForm autoFocus />
    </div>
  );
}
