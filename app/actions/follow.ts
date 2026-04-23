"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth-helpers";

export type ToggleFollowResult =
  | { following: boolean; followersCount: number }
  | { error: string };

export async function toggleFollow(targetUserId: string): Promise<ToggleFollowResult> {
  const me = await getCurrentUser();
  if (!me) return { error: "Bạn cần đăng nhập" };
  if (!Types.ObjectId.isValid(targetUserId)) return { error: "Target không hợp lệ" };
  if (String(me._id) === targetUserId) return { error: "Không thể follow chính mình" };

  await connectDB();
  const targetId = new Types.ObjectId(targetUserId);

  const target = await User.findById(targetId).select("_id username followers").lean<{
    _id: Types.ObjectId;
    username?: string | null;
    followers?: Types.ObjectId[];
  } | null>();
  if (!target) return { error: "Người dùng không tồn tại" };

  const isFollowing = (target.followers ?? []).some((id) => String(id) === String(me._id));

  if (isFollowing) {
    await Promise.all([
      User.updateOne(
        { _id: targetId },
        { $pull: { followers: me._id }, $inc: { followersCount: -1 } },
      ),
      User.updateOne(
        { _id: me._id },
        { $pull: { following: targetId }, $inc: { followingCount: -1 } },
      ),
    ]);
  } else {
    await Promise.all([
      User.updateOne(
        { _id: targetId },
        { $addToSet: { followers: me._id }, $inc: { followersCount: 1 } },
      ),
      User.updateOne(
        { _id: me._id },
        { $addToSet: { following: targetId }, $inc: { followingCount: 1 } },
      ),
      Notification.create({ recipient: targetId, actor: me._id, type: "FOLLOW" }),
    ]);
  }

  const updated = await User.findById(targetId).select("followersCount").lean<{
    followersCount?: number;
  } | null>();
  const followersCount = Math.max(0, updated?.followersCount ?? 0);

  if (target.username) revalidatePath(`/@${target.username}`);
  revalidatePath("/activity");

  return { following: !isFollowing, followersCount };
}
