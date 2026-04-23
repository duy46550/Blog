import { connectDB } from "@/lib/db";
import { AIAgent, type AIAgentDoc } from "@/models/AIAgent";
import { AIRun } from "@/models/AIRun";
import { Post } from "@/models/Post";
import { User } from "@/models/User";
import { fetchRssItems } from "@/lib/crawler/rss";
import { extractContent } from "@/lib/crawler/jina";
import { filterNewUrls, normalizeUrl } from "@/lib/crawler/dedupe";
import { generatePost } from "@/lib/ai/anthropic";
import type { TopicVariant } from "./prompts";
import type { Types } from "mongoose";

const VALID_TOPICS = new Set<string>(["tech", "kinh-te", "the-thao", "giai-tri", "general"]);

function toTopic(t: string): TopicVariant {
  return VALID_TOPICS.has(t) ? (t as TopicVariant) : "general";
}

async function getBotUserId(): Promise<Types.ObjectId | null> {
  await connectDB();
  const bot = await User.findOne({ email: "bot@blog.internal" }).select("_id").lean<{ _id: Types.ObjectId }>();
  return bot?._id ?? null;
}

export interface RunAgentResult {
  agentId: string;
  agentName: string;
  postsCreated: number;
  skipped: number;
  errors: string[];
}

export async function runAgent(agentId: string): Promise<RunAgentResult> {
  await connectDB();

  const agent = await AIAgent.findById(agentId).lean<AIAgentDoc>();
  if (!agent) throw new Error(`Agent not found: ${agentId}`);
  if (!agent.active) throw new Error(`Agent is inactive: ${agentId}`);

  const result: RunAgentResult = {
    agentId,
    agentName: agent.name,
    postsCreated: 0,
    skipped: 0,
    errors: [],
  };

  const authorId = agent.owner ?? (await getBotUserId());
  if (!authorId) {
    result.errors.push("No author: create a bot user (bot@blog.internal) or set agent.owner");
    return result;
  }

  const sources: string[] = agent.sources ?? [];
  if (!sources.length) {
    result.errors.push("Agent has no sources configured");
    return result;
  }

  // Collect candidate URLs from RSS feeds
  const candidates: { url: string; fallbackText: string }[] = [];
  for (const src of sources) {
    try {
      if (src.includes("rss") || src.includes("feed") || src.includes("atom") || src.includes(".xml")) {
        const items = await fetchRssItems(src, 8);
        for (const item of items) {
          candidates.push({ url: item.url, fallbackText: `${item.title}\n${item.summary}` });
        }
      } else {
        candidates.push({ url: src, fallbackText: "" });
      }
    } catch (err) {
      result.errors.push(`RSS fetch failed for ${src}: ${String(err)}`);
    }
  }

  const newUrls = await filterNewUrls(candidates.map((c) => c.url));
  result.skipped = candidates.length - newUrls.length;

  // Process up to 3 new URLs per run to stay within daily token limit
  const toProcess = newUrls.slice(0, 3);

  for (const url of toProcess) {
    const run = await AIRun.create({
      agent: agent._id,
      status: "RUNNING",
      inputUrls: [url],
      startedAt: new Date(),
    });

    try {
      // Extract content (Jina first, fallback to RSS summary)
      let sourceText: string;
      try {
        sourceText = await extractContent(url);
      } catch {
        const fallback = candidates.find((c) => normalizeUrl(c.url) === normalizeUrl(url))?.fallbackText ?? "";
        if (!fallback) throw new Error("No content available from Jina or fallback");
        sourceText = fallback;
      }

      const topic = toTopic(agent.topic ?? "general");
      const modelId: string = agent.model ?? "claude-sonnet-4-6";
      const generated = await generatePost(sourceText, topic, modelId);

      const post = await Post.create({
        author: authorId,
        content: generated.post.content,
        title: generated.post.title,
        tags: generated.post.tags,
        aiGenerated: true,
        aiSourceUrls: [normalizeUrl(url)],
        status: agent.autoPublish ? "PUBLISHED" : "DRAFT",
        publishedAt: agent.autoPublish ? new Date() : null,
      });

      await AIRun.updateOne(
        { _id: run._id },
        {
          $set: {
            status: "SUCCESS",
            outputPost: post._id,
            tokensUsed: generated.tokensUsed,
            cacheReadTokens: generated.cacheReadTokens,
            cost: generated.cost,
            finishedAt: new Date(),
          },
        },
      );

      result.postsCreated++;
    } catch (err) {
      const errMsg = String(err);
      result.errors.push(`Failed for ${url}: ${errMsg}`);
      await AIRun.updateOne(
        { _id: run._id },
        { $set: { status: "FAILED", error: errMsg, finishedAt: new Date() } },
      );
    }
  }

  await AIAgent.updateOne({ _id: agent._id }, { $set: { lastRunAt: new Date() } });

  return result;
}

export async function runAllActiveAgents(): Promise<RunAgentResult[]> {
  await connectDB();
  const agents = await AIAgent.find({ active: true }).select("_id").lean<{ _id: Types.ObjectId }[]>();
  const results: RunAgentResult[] = [];
  for (const a of agents) {
    try {
      const r = await runAgent(String(a._id));
      results.push(r);
    } catch (err) {
      results.push({
        agentId: String(a._id),
        agentName: "unknown",
        postsCreated: 0,
        skipped: 0,
        errors: [String(err)],
      });
    }
  }
  return results;
}
