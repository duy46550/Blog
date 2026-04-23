import Anthropic from "@anthropic-ai/sdk";
import { getActiveKey } from "@/lib/apikey";
import { buildSystemPrompt, buildUserPrompt, BANNED_KEYWORDS_RE, type TopicVariant } from "./prompts";

export interface GeneratedPost {
  title: string;
  content: string;
  tags: string[];
  excerpt: string;
}

export interface GenerateResult {
  post: GeneratedPost;
  tokensUsed: number;
  cacheReadTokens: number;
  cost: number;
}

const INPUT_PRICE_PER_M = 3.0;   // Sonnet 4.6
const OUTPUT_PRICE_PER_M = 15.0;
const CACHE_READ_PRICE_PER_M = 0.3;

function calcCost(inputTokens: number, outputTokens: number, cacheRead: number): number {
  return (
    ((inputTokens - cacheRead) * INPUT_PRICE_PER_M) / 1_000_000 +
    (outputTokens * OUTPUT_PRICE_PER_M) / 1_000_000 +
    (cacheRead * CACHE_READ_PRICE_PER_M) / 1_000_000
  );
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function generatePost(
  sourceText: string,
  topic: TopicVariant = "general",
  modelId = "claude-sonnet-4-6",
): Promise<GenerateResult> {
  const apiKey = await getActiveKey("anthropic");
  if (!apiKey) throw new Error("No active Anthropic API key");

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(topic);
  const userPrompt = buildUserPrompt(sourceText, topic);

  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(Math.min(1000 * 2 ** attempt, 16_000));
    try {
      const stream = await client.messages.stream({
        model: modelId,
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
      });

      const msg = await stream.finalMessage();
      const raw = msg.content.find((b) => b.type === "text")?.text ?? "";

      const post = parsePost(raw);

      if (BANNED_KEYWORDS_RE.test(post.content) || BANNED_KEYWORDS_RE.test(post.title)) {
        throw new Error("Generated content contains banned keywords");
      }

      const usage = msg.usage as {
        input_tokens: number;
        output_tokens: number;
        cache_read_input_tokens?: number;
      };
      const cacheRead = usage.cache_read_input_tokens ?? 0;
      const cost = calcCost(usage.input_tokens, usage.output_tokens, cacheRead);

      return {
        post,
        tokensUsed: usage.input_tokens + usage.output_tokens,
        cacheReadTokens: cacheRead,
        cost,
      };
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      if (status === 429 || status === 529) continue; // rate-limit → retry
      throw err;
    }
  }
  throw lastErr;
}

function parsePost(raw: string): GeneratedPost {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
  const p = parsed as Record<string, unknown>;
  if (!p.title || !p.content) throw new Error("Missing required fields in response");
  return {
    title: String(p.title).slice(0, 120),
    content: String(p.content),
    tags: Array.isArray(p.tags) ? (p.tags as string[]).map(String).slice(0, 6) : [],
    excerpt: String(p.excerpt ?? "").slice(0, 200),
  };
}
