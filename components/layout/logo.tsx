import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Trang chủ"
      className={cn("inline-flex size-9 items-center justify-center", className)}
    >
      <svg viewBox="0 0 64 64" className="size-8 fill-foreground" aria-hidden>
        <path d="M32 4 L58 18 V46 L32 60 L6 46 V18 Z" />
      </svg>
    </Link>
  );
}
