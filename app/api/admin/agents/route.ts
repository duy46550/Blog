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

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const agents = await AIAgent.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json() as {
    name: string;
    topic?: string;
    sources?: string[];
    schedule?: string;
    model?: string;
    autoPublish?: boolean;
    active?: boolean;
    dailyTokenLimit?: number;
  };
  if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const agent = await AIAgent.create({
    name: body.name.trim(),
    topic: body.topic ?? "general",
    sources: body.sources ?? [],
    schedule: body.schedule ?? "0 8 * * *",
    model: body.model ?? "claude-sonnet-4-6",
    autoPublish: body.autoPublish ?? false,
    active: body.active ?? true,
    dailyTokenLimit: body.dailyTokenLimit ?? 200_000,
  });
  return NextResponse.json(agent, { status: 201 });
}
