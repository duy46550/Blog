import { connectDB } from "@/lib/db";
import { ApiKey } from "@/models/ApiKey";
import { KeysClient } from "./keys-client";
import type { Types } from "mongoose";

export const metadata = { title: "API Keys" };

interface KeyDoc {
  _id: Types.ObjectId;
  provider: string;
  keyPreview: string;
  label: string;
  updatedAt?: Date;
  lastUsedAt?: Date | null;
}

export default async function KeysPage() {
  await connectDB();
  const keys = await ApiKey.find({ active: true })
    .select("provider keyPreview label updatedAt lastUsedAt")
    .sort({ updatedAt: -1 })
    .lean<KeyDoc[]>();

  const serialized = keys.map((k) => ({
    _id: String(k._id),
    provider: k.provider,
    keyPreview: k.keyPreview,
    label: k.label,
    updatedAt: k.updatedAt ? new Date(k.updatedAt).toISOString() : null,
    lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
  }));

  return <KeysClient initialKeys={serialized} />;
}
