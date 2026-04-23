import { NextResponse } from "next/server";
import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import { fetchFeed } from "@/lib/feed";
import { getCurrentUser } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import { User, type UserDoc } from "@/models/User";
import type { PostDoc } from "@/models/Post";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const scope = url.searchParams.get("scope");
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const user = await getCurrentUser();

  let filter: FilterQuery<PostDoc> = {};
  if (scope === "following") {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const me = await User.findById(user._id)
      .select("following")
      .lean<Pick<UserDoc, "following"> | null>();
    const ids = me?.following ?? [];
    if (ids.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null });
    }
    filter = { author: { $in: ids } };
  }

  const { posts, nextCursor } = await fetchFeed({
    cursor,
    filter,
    currentUserId: user?._id ?? null,
  });

  return NextResponse.json({ posts, nextCursor });
}
