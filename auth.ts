import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/lib/mongodb";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { usernameFromEmail } from "@/lib/utils";
import { authConfig } from "@/auth.config";

/**
 * Full config — chỉ dùng cho route handlers / server components / server actions.
 * Không import từ middleware (Mongoose không chạy trên Edge).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
