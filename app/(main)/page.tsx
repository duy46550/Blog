import Link from "next/link";
import { fetchFeed } from "@/lib/feed";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Feed } from "@/components/feed/feed";

export default async function HomePage() {
  const user = await getCurrentUser();
  const { posts, nextCursor } = await fetchFeed({
    currentUserId: user?._id ?? null,
  }).catch(() => ({ posts: [], nextCursor: null }));

  return (
    <div className="flex flex-col">
      <nav className="mb-6 flex justify-center gap-4 text-sm">
        <span className="font-medium">Trang chủ</span>
        {user ? (
          <Link href="/following" className="text-muted-foreground hover:text-foreground">
            Đang theo dõi
          </Link>
        ) : null}
      </nav>
      <Feed initialPosts={posts} initialCursor={nextCursor} canInteract={Boolean(user)} />
    </div>
  );
}
