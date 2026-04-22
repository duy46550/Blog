import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import type { UserRole } from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      role: UserRole;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

/**
 * Edge-safe config: providers + callbacks không đụng Mongoose/MongoDB driver.
 * Dùng cho middleware (Edge runtime). Không bao gồm adapter + events.
 */
const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_RESEND_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? "noreply@example.com",
    }),
  );
}

export const authConfig = {
  providers,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username = (token.username as string | null) ?? null;
        session.user.role = (token.role as UserRole) ?? "USER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname.startsWith("/admin")) {
        return auth?.user?.role === "ADMIN";
      }
      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
