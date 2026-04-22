import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User, type UserDoc } from "@/models/User";
import type { Types } from "mongoose";

type LeanUser = Omit<UserDoc, "_id"> & { _id: Types.ObjectId };

export async function getCurrentUser(): Promise<LeanUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id).lean<LeanUser>();
  return user;
}

export async function requireUser(): Promise<LeanUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<LeanUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
