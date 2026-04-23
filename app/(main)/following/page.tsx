import Link from "next/link";
import { connectDB } from "@/lib/db";
import { User, type UserDoc } from "@/models/User";
import { fetchFeed } from "@/lib/feed";
import { Feed } from "@/components/feed/feed";
import { requireUser } from "@/lib/auth-helpers";

export const metadata = { title: "Đang theo dõi" };

export default async function FollowingPage() {
  const me = await requireUser();

  await connectDB();
  const meDoc = await User.findById(me._id)
    .select("following")
    .lean<Pick<UserDoc, "following"> | null>();
  const followingIds = meDoc?.following ?? [];

  const { posts, nextCursor } =
    followingIds.length === 0
      ? { posts: [], nextCursor: null }
      : await fetchFeed({
          filter: { author: { $in: followingIds } },
          currentUserId: me._id,
        });

  return (
    <div className="flex flex-col">
      <nav className="mb-6 flex justify-center gap-4 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Trang chủ
        </Link>
        <span className="font-medium">Đang theo dõi</span>
      </nav>

      {followingIds.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="mb-2 text-lg font-medium">Bạn chưa theo dõi ai</p>
          <p className="text-sm text-muted-foreground">
            Tìm người thú vị và bấm Theo dõi để thấy bài của họ ở đây.
          </p>
        </div>
      ) : (
        <Feed
          initialPosts={posts}
          initialCursor={nextCursor}
          canInteract
          scope="following"
        />
      )}
    </div>
  );
}
