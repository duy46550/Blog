import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AIAgent } from "@/models/AIAgent";
import type { Types } from "mongoose";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id).select("role").lean<{ role: string; _id: Types.ObjectId }>();
  return user?.role === "ADMIN" ? user : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "topic", "sources", "schedule", "model", "autoPublish", "active", "dailyTokenLimit"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];
  const doc = await AIAgent.findByIdAndUpdate(id, { $set: update }, { new: true });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await AIAgent.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
