import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Post } from "@/models/Post";
import { AIRun } from "@/models/AIRun";
import { AIAgent } from "@/models/AIAgent";
import type { Types } from "mongoose";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select("role").lean<{ role: string; _id: Types.ObjectId }>();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalPosts, aiPosts, totalUsers, activeAgents, runsThisMonth] = await Promise.all([
    Post.countDocuments({ status: "PUBLISHED" }),
    Post.countDocuments({ aiGenerated: true, status: "PUBLISHED" }),
    User.countDocuments(),
    AIAgent.countDocuments({ active: true }),
    AIRun.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$tokensUsed" },
          cacheTokens: { $sum: "$cacheReadTokens" },
          totalCost: { $sum: "$cost" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const monthly = runsThisMonth[0] ?? { totalTokens: 0, cacheTokens: 0, totalCost: 0, count: 0 };

  return NextResponse.json({
    totalPosts,
    aiPosts,
    totalUsers,
    activeAgents,
    monthlyRuns: monthly.count,
    monthlyTokens: monthly.totalTokens,
    monthlyCacheTokens: monthly.cacheTokens,
    monthlyCost: monthly.totalCost,
  });
}
