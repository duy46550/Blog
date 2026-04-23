import { connectDB } from "@/lib/db";
import { AIRun } from "@/models/AIRun";
import { Badge } from "@/components/ui/badge";
import type { Types } from "mongoose";

export const metadata = { title: "AI Runs" };

interface RunDoc {
  _id: Types.ObjectId;
  status: string;
  tokensUsed: number;
  cacheReadTokens: number;
  cost: number;
  error: string | null;
  inputUrls: string[];
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt?: Date;
  agent: { _id: Types.ObjectId; name: string } | null;
}

const STATUS_COLOR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SUCCESS: "default",
  RUNNING: "secondary",
  FAILED: "destructive",
  PENDING: "outline",
};

export default async function RunsPage() {
  await connectDB();
  const runs = await AIRun.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("agent", "name")
    .lean<RunDoc[]>();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">AI Runs</h1>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Thời gian</th>
              <th className="px-4 py-3 text-left font-medium">Agent</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Tokens</th>
              <th className="px-4 py-3 text-right font-medium">Cache</th>
              <th className="px-4 py-3 text-right font-medium">Cost</th>
              <th className="px-4 py-3 text-left font-medium">Lỗi</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={String(r._id)} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3">
                  {r.agent ? r.agent.name : <span className="text-muted-foreground">deleted</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_COLOR[r.status] ?? "outline"}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono">{r.tokensUsed.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono">{r.cacheReadTokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono">${r.cost.toFixed(5)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-destructive text-xs">
                  {r.error ?? "—"}
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có run nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
