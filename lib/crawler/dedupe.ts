import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return raw.trim();
  }
}

export async function filterNewUrls(urls: string[]): Promise<string[]> {
  if (!urls.length) return [];
  await connectDB();
  const normalized = urls.map(normalizeUrl);
  const existing = await Post.find(
    { aiSourceUrls: { $in: normalized } },
    { aiSourceUrls: 1 },
  ).lean<{ aiSourceUrls?: string[] }[]>();
  const seen = new Set(existing.flatMap((d) => d.aiSourceUrls ?? []));
  return normalized.filter((u) => u && !seen.has(u));
}

export { normalizeUrl };
