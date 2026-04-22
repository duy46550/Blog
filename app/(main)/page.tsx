import { connectDB } from "@/lib/db";
import { Post, type PostDoc } from "@/models/Post";
import { User, type UserDoc } from "@/models/User";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import type { Types } from "mongoose";

// Đảm bảo User model được register trước khi populate
void User;

type FeedPost = Omit<PostDoc, "author"> & {
  _id: Types.ObjectId;
  author: Pick<UserDoc, "username" | "displayName" | "image"> & { _id: Types.ObjectId };
};

async function getFeed(): Promise<FeedPost[]> {
  await connectDB();
  const posts = await Post.find({ status: "PUBLISHED", parent: null })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("author", "username displayName image")
    .lean<FeedPost[]>();
  return posts;
}

export default async function HomePage() {
  const posts = await getFeed().catch(() => [] as FeedPost[]);

  return (
    <div className="flex flex-col">
      <h1 className="mb-6 text-center text-sm font-medium text-muted-foreground">Trang chủ</h1>

      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="flex flex-col divide-y divide-border/50">
          {posts.map((post) => (
            <PostCard key={String(post._id)} post={post} />
          ))}
        </ol>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="mb-2 text-lg font-medium">Chưa có bài nào</p>
      <p className="text-sm text-muted-foreground">
        Hãy chạy <code className="rounded bg-muted px-1.5 py-0.5 text-xs">pnpm db:seed</code> để
        tạo dữ liệu mẫu.
      </p>
    </div>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  const author = post.author;
  const initial = (author?.displayName || author?.username || "?").slice(0, 1).toUpperCase();
  const time = formatDistanceToNowStrict(new Date(post.createdAt as unknown as string), {
    locale: vi,
    addSuffix: false,
  });

  return (
    <article className="flex gap-3 py-4">
      <Avatar className="size-10 shrink-0">
        {author?.image ? <AvatarImage src={author.image} alt="" /> : null}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold">{author?.displayName}</span>
          {author?.username ? (
            <span className="truncate text-sm text-muted-foreground">@{author.username}</span>
          ) : null}
          <span className="text-sm text-muted-foreground">· {time}</span>
        </header>

        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {post.content}
        </p>

        <footer className="mt-3 flex items-center gap-4 text-muted-foreground">
          <button type="button" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Heart className="size-5" />
            {post.likesCount > 0 ? <span className="text-sm">{post.likesCount}</span> : null}
          </button>
          <button type="button" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <MessageCircle className="size-5" />
            {post.repliesCount > 0 ? <span className="text-sm">{post.repliesCount}</span> : null}
          </button>
          <button type="button" className="transition-colors hover:text-foreground">
            <Repeat2 className="size-5" />
          </button>
          <button type="button" className="transition-colors hover:text-foreground">
            <Send className="size-5" />
          </button>
        </footer>
      </div>
    </article>
  );
}
