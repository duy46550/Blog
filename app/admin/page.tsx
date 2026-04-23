import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { AIRun } from "@/models/AIRun";
import { AIAgent } from "@/models/AIAgent";
import { User } from "@/models/User";

export const metadata = { title: "Admin Dashboard" };

async function getStats() {
  await connectDB();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalPosts, aiPosts, totalUsers, activeAgents, runsThisMonth] = await Promise.all([
    Post.countDocuments({ status: "PUBLISHED" }),
    Post.countDocuments({ aiGenerated: true }),
    User.countDocuments(),
    AIAgent.countDocuments({ active: true }),
    AIRun.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$tokensUsed" },
          totalCost: { $sum: "$cost" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const monthly = runsThisMonth[0] ?? { totalTokens: 0, totalCost: 0, count: 0 };
  return { totalPosts, aiPosts, totalUsers, activeAgents, ...monthly };
}

export default async function AdminDashboard() {
  const s = await getStats();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Bài đăng" value={s.totalPosts} />
        <StatCard label="Bài AI" value={s.aiPosts} />
        <StatCard label="Người dùng" value={s.totalUsers} />
        <StatCard label="Agents active" value={s.activeAgents} />
      </div>

      <h2 className="mb-4 mt-8 text-lg font-semibold">Tháng này</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="AI Runs thành công" value={s.count} />
        <StatCard label="Tokens dùng" value={s.totalTokens.toLocaleString()} />
        <StatCard label="Chi phí ($)" value={`$${(s.totalCost as number).toFixed(4)}`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
