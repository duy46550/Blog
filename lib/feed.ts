import type { FilterQuery, Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Post, type PostDoc } from "@/models/Post";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { serializePost, type SerializedPost, type RawPost } from "@/lib/serialize";

void User;

export const PAGE_SIZE = 20;

export type FetchFeedOptions = {
  cursor?: string | null;
  limit?: number;
  filter?: FilterQuery<PostDoc>;
  currentUserId?: Types.ObjectId | string | null;
};

export async function fetchFeed({
  cursor,
  limit = PAGE_SIZE,
  filter = {},
  currentUserId,
}: FetchFeedOptions): Promise<{ posts: SerializedPost[]; nextCursor: string | null }> {
  await connectDB();

  const query: FilterQuery<PostDoc> = {
    status: "PUBLISHED",
    parent: null,
    ...filter,
  };
  if (cursor) {
    query._id = { $lt: cursor };
  }

  const docs = await Post.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("author", "username displayName image")
    .lean<RawPost[]>();

  let likedSet = new Set<string>();
  if (currentUserId && docs.length > 0) {
    const likes = await Like.find({
      user: currentUserId,
      post: { $in: docs.map((d) => d._id) },
    })
      .select("post")
      .lean<{ post: Types.ObjectId }[]>();
    likedSet = new Set(likes.map((l) => String(l.post)));
  }

  const posts = docs.map((d) => serializePost(d, likedSet.has(String(d._id))));
  const last = docs[docs.length - 1];
  const nextCursor = docs.length === limit && last ? String(last._id) : null;
  return { posts, nextCursor };
}
