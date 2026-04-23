import { NextResponse } from "next/server";
import { scrapeOg } from "@/lib/og";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const url = body.url?.trim();
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const og = await scrapeOg(url);
  if (!og) return NextResponse.json({ error: "Failed to scrape" }, { status: 422 });
  return NextResponse.json(og);
}
