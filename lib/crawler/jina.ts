const JINA_BASE = "https://r.jina.ai/";
const MAX_CHARS = 12_000;

export async function extractContent(url: string): Promise<string> {
  const res = await fetch(`${JINA_BASE}${encodeURIComponent(url)}`, {
    headers: { Accept: "text/plain" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Jina fetch failed: ${res.status} for ${url}`);
  const text = await res.text();
  return text.slice(0, MAX_CHARS);
}
