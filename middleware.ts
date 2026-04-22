import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: chỉ dùng authConfig không adapter.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
