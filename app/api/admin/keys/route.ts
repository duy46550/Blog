import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ApiKey, type ApiKeyProvider } from "@/models/ApiKey";
import { saveKey } from "@/lib/apikey";
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
  const keys = await ApiKey.find({ active: true })
    .select("provider keyPreview label updatedAt lastUsedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { provider, key, label } = await req.json() as {
    provider: ApiKeyProvider;
    key: string;
    label?: string;
  };
  if (!provider || !key?.trim()) {
    return NextResponse.json({ error: "provider and key required" }, { status: 400 });
  }
  await saveKey(provider, key, label ?? "");
  return NextResponse.json({ ok: true });
}
