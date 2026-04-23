"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";

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
  const parsed = CreatePostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { content, parent, mediaUrls, linkPreview } = parsed.data;

  await connectDB();

  let parentId: Types.ObjectId | null = null;
  if (parent) {
    if (!Types.ObjectId.isValid(parent)) return { ok: false, error: "Parent không hợp lệ" };
    parentId = new Types.ObjectId(parent);
    const parentDoc = await Post.findById(parentId).select("_id").lean();
    if (!parentDoc) return { ok: false, error: "Bài gốc không tồn tại" };
  }

  const post = await Post.create({
    content,
    parent: parentId,
    mediaUrls: mediaUrls ?? [],
    linkPreview: linkPreview ?? null,
    status: "PUBLISHED",
    aiGenerated: false,
  });

  if (parentId) {
    await Post.updateOne({ _id: parentId }, { $inc: { repliesCount: 1 } });
  }

  revalidatePath("/");
  if (parentId) revalidatePath(`/post/${String(parentId)}`);

  return { ok: true, postId: String(post._id) };
}

export async function createPostAndRedirect(formData: FormData): Promise<void> {
  const { redirect } = await import("next/navigation");
  const content = String(formData.get("content") ?? "");
  const parent = formData.get("parent") ? String(formData.get("parent")) : null;
  const res = await createPost({ content, parent });
  if (!res.ok) {
    throw new Error(res.error);
  }
  redirect(parent ? `/post/${parent}` : "/");
}

export type ToggleLikeResult = { likesCount: number } | { error: string };

export async function toggleLikeAnon(postId: string, liked: boolean): Promise<ToggleLikeResult> {
  if (!Types.ObjectId.isValid(postId)) return { error: "Post không hợp lệ" };

  await connectDB();
  const postObjectId = new Types.ObjectId(postId);

  try {
    const updated = await Post.findByIdAndUpdate(
      postObjectId,
      { $inc: { likesCount: liked ? 1 : -1 } },
      { new: true },
    ).select("likesCount");

    const likesCount = Math.max(0, updated?.likesCount ?? 0);

    // Ensure count doesn't go below 0 in DB
    if (likesCount === 0 && !liked) {
      await Post.updateOne({ _id: postObjectId, likesCount: { $lt: 0 } }, { $set: { likesCount: 0 } });
    }

    revalidatePath("/");
    revalidatePath(`/post/${postId}`);
    return { likesCount };
  } catch (err) {
    console.error("toggleLikeAnon failed:", err);
    return { error: "Có lỗi xảy ra" };
  }
}
