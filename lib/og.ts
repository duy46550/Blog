export type OgData = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
};

const META_RE = /<meta\s+[^>]*?(?:property|name)=["']([^"']+)["'][^>]*?content=["']([^"']*)["'][^>]*>/gi;
const META_RE_REV = /<meta\s+[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']([^"']+)["'][^>]*>/gi;
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;

export async function scrapeOg(rawUrl: string): Promise<OgData | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; BlogOgBot/1.0; +https://example.com/bot)",
        accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("text/html")) return null;
    const html = (await res.text()).slice(0, 500_000);

    const meta: Record<string, string> = {};
    for (const re of [META_RE, META_RE_REV]) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        const [, a, b] = m;
        const key = (re === META_RE ? a : b)?.toLowerCase();
        const val = re === META_RE ? b : a;
        if (key && val && !meta[key]) meta[key] = decodeHtml(val);
      }
    }
    const titleMatch = TITLE_RE.exec(html);

    const title = meta["og:title"] ?? meta["twitter:title"] ?? titleMatch?.[1]?.trim();
    const description =
      meta["og:description"] ?? meta["twitter:description"] ?? meta["description"];
    let image = meta["og:image"] ?? meta["twitter:image"];
    if (image && !/^https?:\/\//i.test(image)) {
      try {
        image = new URL(image, url).toString();
      } catch {
        image = undefined;
      }
    }

    return {
      url: url.toString(),
      title,
      description,
      image,
      domain: url.hostname.replace(/^www\./, ""),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

export function firstUrlIn(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"]+/);
  return m ? m[0] : null;
}
