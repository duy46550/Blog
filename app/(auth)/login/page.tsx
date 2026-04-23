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
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const hasResend = Boolean(process.env.AUTH_RESEND_KEY);
  const hasDev =
    process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "true";

  return (
    <div className="flex flex-col items-center">
      <Logo className="mb-6 size-12" />
      <h1 className="mb-1 text-2xl font-bold">Đăng nhập</h1>
      <p className="mb-8 text-sm text-muted-foreground">Tiếp tục vào Blog</p>

      <ErrorMessage searchParamsPromise={searchParams} />

      {hasDev ? (
        <form
          className="mb-4 flex w-full flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"
          action={async (formData: FormData) => {
            "use server";
            const email = String(formData.get("email") ?? "");
            if (!email) return;
            await signIn("dev", { email, redirectTo: "/" });
          }}
        >
          <p className="text-xs font-medium text-amber-600">
            DEV LOGIN — chỉ dùng khi phát triển
          </p>
          <Input type="email" name="email" placeholder="you@example.com" required />
          <Button type="submit" size="lg">
            Đăng nhập nhanh
          </Button>
        </form>
      ) : null}

      {hasGoogle ? (
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
      ) : null}

      {hasResend ? (
        <>
          {hasGoogle || hasDev ? (
            <div className="my-4 flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">hoặc</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          ) : null}
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
        </>
      ) : null}

      {!hasGoogle && !hasResend && !hasDev ? (
        <div className="w-full rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Chưa có provider nào được cấu hình. Thêm <code>AUTH_DEV_LOGIN=true</code> vào{" "}
          <code>.env.local</code> để bật Dev Login khi phát triển.
        </div>
      ) : null}

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
