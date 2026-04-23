import { NextRequest, NextResponse } from "next/server";
import { runAllActiveAgents, runAgent } from "@/lib/ai/pipeline";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = (await req.json().catch(() => ({}))) as { agentId?: string };

  try {
    if (agentId) {
      const result = await runAgent(agentId);
      return NextResponse.json({ ok: true, results: [result] });
    }
    const results = await runAllActiveAgents();
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[cron/run-agents]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
