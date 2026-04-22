import Link from "next/link";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";

export const metadata = { title: "Đăng nhập" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  return (
    <div className="flex flex-col items-center">
      <Logo className="mb-6 size-12" />
      <h1 className="mb-1 text-2xl font-bold">Đăng nhập</h1>
      <p className="mb-8 text-sm text-muted-foreground">Tiếp tục vào Blog</p>

      <ErrorMessage searchParamsPromise={searchParams} />

      <form
        className="mb-4 w-full"
        action={async () => {
          "use server";
          const sp = await searchParams;
          await signIn("google", { redirectTo: sp.callbackUrl ?? "/" });
        }}
      >
        <Button type="submit" className="w-full" size="lg">
          Tiếp tục bằng Google
        </Button>
      </form>

      <div className="my-4 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">hoặc</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form
        className="flex w-full flex-col gap-3"
        action={async (formData: FormData) => {
          "use server";
          const email = String(formData.get("email") ?? "");
          if (!email) return;
          await signIn("resend", { email, redirectTo: "/" });
        }}
      >
        <Input type="email" name="email" placeholder="email@example.com" required />
        <Button type="submit" variant="outline" size="lg">
          Gửi magic link qua email
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Chưa có tài khoản? Đăng nhập sẽ tự tạo tài khoản mới.{" "}
        <Link href="/" className="underline">
          Về trang chủ
        </Link>
      </p>
    </div>
  );
}

async function ErrorMessage({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ error?: string }>;
}) {
  const sp = await searchParamsPromise;
  if (!sp.error) return null;
  return (
    <div className="mb-4 w-full rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.
    </div>
  );
}
