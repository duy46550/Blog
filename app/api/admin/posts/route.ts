import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Post } from "@/models/Post";
import type { Types } from "mongoose";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id).select("role").lean<{ role: string; _id: Types.ObjectId }>();
  return user?.role === "ADMIN" ? user : null;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 100);
  const page = Math.max(Number(req.nextUrl.searchParams.get("page") ?? 1), 1);
  const filter = req.nextUrl.searchParams.get("filter"); // "ai" | "draft"

  const query: Record<string, unknown> = {};
  if (filter === "ai") query.aiGenerated = true;
  if (filter === "draft") query.status = "DRAFT";

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "displayName username")
      .select("title content status aiGenerated tags createdAt author")
      .lean(),
    Post.countDocuments(query),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status } = await req.json() as { id: string; status: string };
  const doc = await Post.findByIdAndUpdate(id, { $set: { status } }, { new: true }).select("status");
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, status: doc.status });
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json() as { id: string };
  await Post.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
