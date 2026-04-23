import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { User } from "@/models/User";
import { serializePost, type RawPost } from "@/lib/serialize";
import { PostCard } from "@/components/feed/post-card";
import { ComposeForm } from "@/components/feed/compose-form";

void User;

type Params = { id: string };

export default async function PostDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const [post, replies] = await Promise.all([
    Post.findById(id).populate("author", "username displayName image").lean<RawPost | null>(),
    Post.find({ parent: id, status: "PUBLISHED" })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("author", "username displayName image")
      .lean<RawPost[]>(),
  ]);

  if (!post) notFound();

  const rootPost = serializePost(post, false);
  const replyPosts = replies.map((r) => serializePost(r, false));

  return (
    <div className="flex flex-col">
      <PostCard post={rootPost} />

      <div className="border-t border-border/50 py-4">
        <ComposeForm
          parent={rootPost._id}
          placeholder={`Trả lời ${rootPost.author.displayName}`}
          submitLabel="Trả lời"
        />
      </div>

      {replyPosts.length > 0 ? (
        <ol className="flex flex-col divide-y divide-border/50 border-t border-border/50">
          {replyPosts.map((reply) => (
            <li key={reply._id}>
              <PostCard
                post={reply}
                replyingTo={rootPost.author.username ?? undefined}
              />
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
