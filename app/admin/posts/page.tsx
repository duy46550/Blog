import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { PostsClient } from "./posts-client";
import type { Types } from "mongoose";

export const metadata = { title: "Posts · Admin" };

interface AuthorLean {
  _id: Types.ObjectId;
  displayName: string;
  username?: string;
}

interface PostLean {
  _id: Types.ObjectId;
  title?: string | null;
  content: string;
  status: string;
  aiGenerated: boolean;
  tags: string[];
  createdAt?: Date;
  author: AuthorLean | null;
}

export default async function AdminPostsPage() {
  await connectDB();
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(80)
    .populate("author", "displayName username")
    .select("title content status aiGenerated tags createdAt author")
    .lean<PostLean[]>();

  const serialized = posts.map((p) => ({
    _id: String(p._id),
    title: p.title ?? null,
    content: p.content.slice(0, 120),
    status: p.status,
    aiGenerated: p.aiGenerated,
    tags: p.tags,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    author: p.author
      ? { displayName: p.author.displayName, username: p.author.username ?? null }
      : null,
  }));

  return <PostsClient initialPosts={serialized} />;
}
