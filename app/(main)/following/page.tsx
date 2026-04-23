import { fetchFeed } from "@/lib/feed";
import { Feed } from "@/components/feed/feed";

export const metadata = { title: "Đang theo dõi" };

export default async function FollowingPage() {
  // Without login, following feed shows all posts
  const { posts, nextCursor } = await fetchFeed({}).catch(() => ({
    posts: [],
    nextCursor: null,
  }));

  return (
    <div className="flex flex-col">
      <nav className="mb-6 flex justify-center gap-4 text-sm">
        <span className="font-medium">Tất cả bài viết</span>
      </nav>
      <Feed
        initialPosts={posts}
        initialCursor={nextCursor}
        scope="following"
      />
    </div>
  );
}
