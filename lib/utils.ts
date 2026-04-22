import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function usernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const base = slugify(local).slice(0, 24) || "user";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}${suffix}`;
}
