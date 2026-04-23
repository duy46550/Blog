"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { Like } from "@/models/Like";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth-helpers";

const LinkPreviewSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  domain: z.string().optional(),
});

const CreatePostSchema = z.object({
  content: z.string().trim().min(1, "Nội dung không được trống").max(2000),
  parent: z.string().optional().nullable(),
  mediaUrls: z.array(z.string()).max(4).optional(),
  linkPreview: LinkPreviewSchema.nullish(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export type CreatePostResult =
  | { ok: true; postId: string }
  | { ok: false; error: string };

export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Bạn cần đăng nhập" };

  const parsed = CreatePostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { content, parent, mediaUrls, linkPreview } = parsed.data;

  await connectDB();

  let parentId: Types.ObjectId | null = null;
  let parentAuthorId: Types.ObjectId | null = null;
  if (parent) {
    if (!Types.ObjectId.isValid(parent)) return { ok: false, error: "Parent không hợp lệ" };
    parentId = new Types.ObjectId(parent);
    const parentDoc = await Post.findById(parentId)
      .select("_id author")
      .lean<{ _id: Types.ObjectId; author: Types.ObjectId } | null>();
    if (!parentDoc) return { ok: false, error: "Bài gốc không tồn tại" };
    parentAuthorId = parentDoc.author;
  }

  const post = await Post.create({
    author: user._id,
    content,
    parent: parentId,
    mediaUrls: mediaUrls ?? [],
    linkPreview: linkPreview ?? null,
    status: "PUBLISHED",
  });

  if (parentId) {
    await Post.updateOne({ _id: parentId }, { $inc: { repliesCount: 1 } });
    if (parentAuthorId && String(parentAuthorId) !== String(user._id)) {
      await Notification.create({
        recipient: parentAuthorId,
        actor: user._id,
        type: "REPLY",
        post: post._id,
      });
    }
  }
  await User.updateOne({ _id: user._id }, { $inc: { postsCount: 1 } });

  revalidatePath("/");
  if (parentId) revalidatePath(`/post/${String(parentId)}`);

  return { ok: true, postId: String(post._id) };
}

export async function createPostAndRedirect(formData: FormData): Promise<void> {
  const content = String(formData.get("content") ?? "");
  const parent = formData.get("parent") ? String(formData.get("parent")) : null;
  const res = await createPost({ content, parent });
  if (!res.ok) {
    throw new Error(res.error);
  }
  redirect(parent ? `/post/${parent}` : "/");
}

export type ToggleLikeResult = { liked: boolean; likesCount: number } | { error: string };

export async function toggleLike(postId: string): Promise<ToggleLikeResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập" };
  if (!Types.ObjectId.isValid(postId)) return { error: "Post không hợp lệ" };

  await connectDB();
  const postObjectId = new Types.ObjectId(postId);

  try {
    const existing = await Like.findOne({ user: user._id, post: postObjectId });
    let liked: boolean;
    let likesCount: number;

    if (existing) {
      await Like.deleteOne({ _id: existing._id });
      const updated = await Post.findByIdAndUpdate(
        postObjectId,
        { $inc: { likesCount: -1 } },
        { new: true },
      ).select("likesCount");
      liked = false;
      likesCount = Math.max(0, updated?.likesCount ?? 0);
    } else {
      try {
        await Like.create({ user: user._id, post: postObjectId });
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) throw err;
      }
      const updated = await Post.findByIdAndUpdate(
        postObjectId,
        { $inc: { likesCount: 1 } },
        { new: true },
      ).select("likesCount author");
      liked = true;
      likesCount = updated?.likesCount ?? 1;
      const authorId = (updated as unknown as { author?: Types.ObjectId } | null)?.author;
      if (authorId && String(authorId) !== String(user._id)) {
        await Notification.create({
          recipient: authorId,
          actor: user._id,
          type: "LIKE",
          post: postObjectId,
        });
      }
    }

    revalidatePath("/");
    revalidatePath(`/post/${postId}`);
    return { liked, likesCount };
  } catch (err) {
    console.error("toggleLike failed:", err);
    return { error: "Có lỗi xảy ra" };
  }
}
