"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Plus, Search, User } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: typeof Home;
  label: string;
  emphasize?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/search", icon: Search, label: "Tìm kiếm" },
  { href: "/compose", icon: Plus, label: "Tạo bài", emphasize: true },
  { href: "/activity", icon: Bell, label: "Hoạt động" },
  { href: "/profile", icon: User, label: "Hồ sơ" },
];

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col items-center justify-between border-r border-border/50 py-5 md:flex">
      <Logo />

      <nav className="flex flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.icon === Bell && unreadCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "group relative flex size-12 items-center justify-center rounded-xl transition-colors",
                "hover:bg-accent",
                active && "bg-accent",
              )}
            >
              <Icon
                className={cn(
                  "size-6 transition-colors",
                  active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  item.emphasize && !active && "text-foreground",
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              {showBadge ? (
                <span className="absolute right-1.5 top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-[18px] text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <ThemeToggle />
    </aside>
  );
}

export function MobileBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-border/50 bg-background/80 backdrop-blur md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        const showBadge = item.icon === Bell && unreadCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              "relative flex size-12 items-center justify-center rounded-xl transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
            {showBadge ? (
              <span className="absolute right-1.5 top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-[18px] text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
