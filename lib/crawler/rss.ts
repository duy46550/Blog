import Parser from "rss-parser";

export interface RssItem {
  url: string;
  title: string;
  summary: string;
  publishedAt: Date;
}

const parser = new Parser({ timeout: 10_000 });

export async function fetchRssItems(feedUrl: string, limit = 5): Promise<RssItem[]> {
  const feed = await parser.parseURL(feedUrl);
  return (feed.items ?? []).slice(0, limit).map((item) => ({
    url: item.link ?? item.guid ?? "",
    title: item.title ?? "",
    summary: item.contentSnippet ?? item.content ?? "",
    publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
  }));
}
