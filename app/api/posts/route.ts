import { NextResponse } from "next/server";
import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import { fetchFeed } from "@/lib/feed";
import type { PostDoc } from "@/models/Post";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const filter: FilterQuery<PostDoc> = {};

  const { posts, nextCursor } = await fetchFeed({
    cursor,
    filter,
  });

  return NextResponse.json({ posts, nextCursor });
}
