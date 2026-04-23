import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AIRun } from "@/models/AIRun";
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
  const runs = await AIRun.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("agent", "name")
    .lean();
  return NextResponse.json(runs);
}
