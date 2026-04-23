import { connectDB } from "@/lib/db";
import { AIAgent } from "@/models/AIAgent";
import { AgentsClient } from "./agents-client";

export const metadata = { title: "AI Agents" };

export default async function AgentsPage() {
  await connectDB();
  const agents = await AIAgent.find().sort({ createdAt: -1 }).lean();
  const serialized = agents.map((a) => ({
    ...a,
    _id: String(a._id),
    owner: a.owner ? String(a.owner) : null,
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
    lastRunAt: a.lastRunAt ? new Date(a.lastRunAt).toISOString() : null,
  }));
  return <AgentsClient initialAgents={serialized} />;
}
