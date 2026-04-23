"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth-helpers";

const UsernameRe = /^[a-z0-9_]{3,24}$/;

const UpdateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Tên hiển thị không được trống").max(50),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(UsernameRe, "Username 3–24 ký tự, chỉ a-z 0-9 _"),
  bio: z.string().max(300).optional().default(""),
  image: z.string().url().or(z.literal("")).optional().default(""),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Bạn cần đăng nhập" };

  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { displayName, username, bio, image } = parsed.data;

  await connectDB();

  if (username !== user.username) {
    const taken = await User.findOne({ username, _id: { $ne: user._id } })
      .select("_id")
      .lean();
    if (taken) return { ok: false, error: "Username đã được sử dụng" };
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { displayName, username, bio, image: image || null } },
  );

  revalidatePath("/settings/profile");
  if (user.username) revalidatePath(`/@${user.username}`);
  revalidatePath(`/@${username}`);

  return { ok: true };
}
