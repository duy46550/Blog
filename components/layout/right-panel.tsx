import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export async function RightPanel() {
  const session = await auth();

  if (!session?.user) {
    return (
      <aside className="sticky top-4 hidden h-fit w-80 shrink-0 lg:block">
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="mb-2 text-xl font-bold leading-tight">Đăng nhập hoặc đăng ký Blog</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Xem mọi người đang nói về điều gì và tham gia cuộc trò chuyện.
          </p>
          <Button asChild className="mb-2 w-full" size="lg">
            <Link href="/login">
              <Image
                src="/google.svg"
                alt=""
                width={18}
                height={18}
                className="invert dark:invert-0"
              />
              Tiếp tục bằng Google
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/login">Đăng nhập bằng email</Link>
          </Button>
        </div>

        <footer className="mt-4 px-2 text-xs text-muted-foreground">
          <div className="mb-1">© {new Date().getFullYear()} Blog</div>
          <div className="flex gap-3">
            <Link href="/privacy" className="hover:underline">Quyền riêng tư</Link>
            <Link href="/terms" className="hover:underline">Điều khoản</Link>
          </div>
        </footer>
      </aside>
    );
  }

  return (
    <aside className="sticky top-4 hidden h-fit w-80 shrink-0 lg:block">
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <h2 className="mb-3 text-base font-semibold">Gợi ý cho bạn</h2>
        <p className="text-sm text-muted-foreground">Chưa có gợi ý. Quay lại sau nhé.</p>
      </div>
    </aside>
  );
}
