import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/lib/mongodb";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { usernameFromEmail } from "@/lib/utils";
import { authConfig } from "@/auth.config";

const extraProviders: NextAuthConfig["providers"] = [];

if (process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "true") {
  extraProviders.push(
    Credentials({
      id: "dev",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "")
          .toLowerCase()
          .trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

        await connectDB();
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            displayName: email.split("@")[0] || "User",
            username: usernameFromEmail(email),
            role: "USER",
            emailVerified: new Date(),
          });
        }
        return {
          id: String(user._id),
          email: user.email,
          name: user.displayName,
          image: user.image ?? null,
        };
      },
    }),
  );
}

/**
 * Full config — chỉ dùng cho route handlers / server components / server actions.
 * Không import từ middleware (Mongoose không chạy trên Edge).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...authConfig.providers, ...extraProviders],
  adapter: MongoDBAdapter(client, { databaseName: process.env.MONGODB_DB || "blog" }),
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      await connectDB();
      await User.updateOne(
        { email: user.email.toLowerCase() },
        {
          $setOnInsert: {
            username: usernameFromEmail(user.email),
            role: "USER",
            bio: "",
          },
          $set: {
            displayName: user.name || user.email.split("@")[0] || "User",
          },
        },
      );
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user?.email) {
        await connectDB();
        const doc = await User.findOne({ email: user.email.toLowerCase() })
          .select("_id username role")
          .lean();
        if (doc) {
          token.sub = String(doc._id);
          token.username = doc.username ?? null;
          token.role = doc.role;
        }
      }
      if (trigger === "update" && token.sub) {
        await connectDB();
        const doc = await User.findById(token.sub).select("username role").lean();
        if (doc) {
          token.username = doc.username ?? null;
          token.role = doc.role;
        }
      }
      return token;
    },
  },
});
