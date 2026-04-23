import { fetchFeed } from "@/lib/feed";
import { Feed } from "@/components/feed/feed";

export default async function HomePage() {
  const { posts, nextCursor } = await fetchFeed({}).catch(() => ({
    posts: [],
    nextCursor: null,
  }));

  return (
    <div className="flex flex-col">
      <nav className="mb-6 flex justify-center gap-4 text-sm">
        <span className="font-medium">Trang chủ</span>
      </nav>
      <Feed initialPosts={posts} initialCursor={nextCursor} />
    </div>
  );
}
