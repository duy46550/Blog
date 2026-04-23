import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { getCurrentUser } from "@/lib/auth-helpers";
import { serializePost, type RawPost } from "@/lib/serialize";
import { PostCard } from "@/components/feed/post-card";
import { ComposeForm } from "@/components/feed/compose-form";

void User;

type Params = { id: string };

export default async function PostDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const [post, replies, currentUser] = await Promise.all([
    Post.findById(id).populate("author", "username displayName image").lean<RawPost | null>(),
    Post.find({ parent: id, status: "PUBLISHED" })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("author", "username displayName image")
      .lean<RawPost[]>(),
    getCurrentUser(),
  ]);

  if (!post) notFound();

  let likedSet = new Set<string>();
  if (currentUser) {
    const ids = [post._id, ...replies.map((r) => r._id)];
    const likes = await Like.find({ user: currentUser._id, post: { $in: ids } })
      .select("post")
      .lean<{ post: Types.ObjectId }[]>();
    likedSet = new Set(likes.map((l) => String(l.post)));
  }

  const rootPost = serializePost(post, likedSet.has(String(post._id)));
  const replyPosts = replies.map((r) => serializePost(r, likedSet.has(String(r._id))));

  return (
    <div className="flex flex-col">
      <PostCard post={rootPost} canInteract={Boolean(currentUser)} />

      <div className="border-t border-border/50 py-4">
        {currentUser ? (
          <ComposeForm
            parent={rootPost._id}
            placeholder={`Trả lời ${rootPost.author.displayName}`}
            submitLabel="Trả lời"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="underline hover:text-foreground">
              Đăng nhập
            </a>{" "}
            để trả lời.
          </p>
        )}
      </div>

      {replyPosts.length > 0 ? (
        <ol className="flex flex-col divide-y divide-border/50 border-t border-border/50">
          {replyPosts.map((reply) => (
            <li key={reply._id}>
              <PostCard
                post={reply}
                canInteract={Boolean(currentUser)}
                replyingTo={rootPost.author.username ?? undefined}
              />
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
