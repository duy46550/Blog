import { connectDB } from "@/lib/db";
import { ApiKey, type ApiKeyProvider } from "@/models/ApiKey";
import { encrypt, decrypt } from "@/lib/crypto";

export async function saveKey(
  provider: ApiKeyProvider,
  rawKey: string,
  label = "",
): Promise<void> {
  if (!rawKey.trim()) throw new Error("Key không được rỗng");
  await connectDB();
  const keyEncrypted = encrypt(rawKey.trim());
  const keyPreview = rawKey.slice(-4);
  await ApiKey.updateOne(
    { provider, active: true },
    { $set: { keyEncrypted, keyPreview, label, active: true } },
    { upsert: true },
  );
}

export async function getActiveKey(provider: ApiKeyProvider): Promise<string | null> {
  await connectDB();
  const doc = await ApiKey.findOne({ provider, active: true })
    .sort({ updatedAt: -1 })
    .select("keyEncrypted lastUsedAt")
    .lean<{ _id: unknown; keyEncrypted: string }>();
  if (!doc) return null;
  const key = decrypt(doc.keyEncrypted);
  await ApiKey.updateOne({ _id: doc._id }, { $set: { lastUsedAt: new Date() } });
  return key;
}

export async function seedKeyFromEnv(provider: ApiKeyProvider, envVar: string): Promise<void> {
  const raw = process.env[envVar];
  if (!raw) return;
  await connectDB();
  const existing = await ApiKey.findOne({ provider, active: true }).select("_id").lean();
  if (existing) return;
  await saveKey(provider, raw, `From env ${envVar}`);
  console.log(`[apikey] seeded ${provider} key from ${envVar}`);
}
