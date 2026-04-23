import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User, type UserDoc } from "@/models/User";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchFeed } from "@/lib/feed";
import { Feed } from "@/components/feed/feed";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import type { Types } from "mongoose";

type LeanUser = Omit<UserDoc, "_id"> & { _id: Types.ObjectId };

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: raw } = await params;
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("@")) notFound();
  const username = decoded.slice(1);
  if (!username) notFound();

  await connectDB();
  const profile = await User.findOne({ username }).lean<LeanUser | null>();
  if (!profile) notFound();

  const { posts, nextCursor } = await fetchFeed({
    filter: { author: profile._id },
  });

  const initial = (profile.displayName || profile.username || "?").slice(0, 1).toUpperCase();
  const joined = formatDistanceToNowStrict(new Date(profile.createdAt as unknown as string), {
    locale: vi,
    addSuffix: true,
  });

  return (
    <div className="flex flex-col">
      <header className="flex items-start gap-4 pb-4">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-xl font-semibold">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio ? (
            <p className="mt-2 whitespace-pre-wrap text-[15px]">{profile.bio}</p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {profile.followersCount ?? 0} người theo dõi · {profile.postsCount ?? posts.length} bài · tham gia {joined}
          </p>
        </div>
        <Avatar className="size-20 shrink-0">
          {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
          <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
        </Avatar>
      </header>

      <div className="mt-4 border-t border-border/50 pt-4">
        <Feed
          initialPosts={posts}
          initialCursor={nextCursor}
        />
      </div>
    </div>
  );
}
