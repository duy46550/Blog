# Phase 3 — AI Pipeline

> **Mục tiêu**: chạy được end-to-end agent tự động — cron trigger → crawl nguồn → Claude research & viết bài → lưu Draft. Chưa cần UI admin (để Phase 4), dùng CLI/script test.

**Ước lượng**: ~1 tuần · **Depends on**: Phase 2 (Post model + publish flow) · **Blocks**: Phase 4 (Review queue cần AIRun)

---

## 3.1 API Key management (backend only)

- [ ] Cài `crypto` (built-in) — wrapper `lib/crypto.ts` với AES-256-GCM
- [ ] Env `ENCRYPTION_KEY` (32 byte hex) — tạo bằng `openssl rand -hex 32`
- [ ] `lib/apikey.ts`: `saveKey(provider, rawKey, label)` + `getActiveKey(provider)` (decrypt)
- [ ] Seed 1 ApiKey cho `anthropic` từ env `ANTHROPIC_API_KEY` (chỉ dev)
- [ ] Unit test encrypt/decrypt roundtrip

## 3.2 Anthropic client wrapper

- [ ] Cài `@anthropic-ai/sdk`
- [ ] `lib/ai/anthropic.ts`:
  - Client factory lấy key từ `getActiveKey('anthropic')`
  - Wrapper `generatePost({ sourceText, topic, lang })` trả JSON `{ title, content, tags, excerpt }`
  - **Bật prompt caching** với `cache_control: { type: 'ephemeral' }` cho system prompt (tiết kiệm 90% input tokens cho các run lặp)
  - Log `tokensUsed` + `cost` (tính theo pricing opus/sonnet)
- [ ] Default model: `claude-sonnet-4-6` (rẻ hơn opus, chất lượng đủ cho tin tức)
- [ ] Retry với exponential backoff khi rate limit (429)

## 3.3 Prompts

- [ ] `lib/ai/prompts.ts` — template system prompt:
  ```
  Bạn là biên tập viên cho blog tin tức Threads-style. Viết ngắn gọn 2–4 đoạn,
  tone tự nhiên như đang tâm sự/chia sẻ với bạn bè. Có hook mở đầu cuốn hút.
  KHÔNG copy nguyên văn nguồn — paraphrase + thêm nhận định.
  Cuối bài trích nguồn dạng: "Nguồn: <domain>"
  Output JSON với schema: { title, content, tags: string[], excerpt }
  ```
- [ ] Variants theo topic: tech / kinh tế / thể thao / giải trí (khác tone)
- [ ] Guard prompt: cấm nội dung 18+, cấm bịa số liệu, phải dưới 500 chữ

## 3.4 Source ingestion

- [ ] Cài `rss-parser`
- [ ] `lib/crawler/rss.ts`: `fetchFeed(url)` → list `{ title, link, pubDate, contentSnippet }`
- [ ] `lib/crawler/firecrawl.ts` (hoặc Jina Reader `r.jina.ai/<url>`): extract clean markdown từ URL
- [ ] `lib/crawler/dedupe.ts`: hash URL (normalize: strip utm_*, lowercase) — check collection `Post` có `aiSourceUrls` chứa URL chưa
- [ ] Test với 2–3 RSS thật (VnExpress tech, Hacker News, TechCrunch)

## 3.5 Pipeline orchestrator

- [ ] `lib/ai/pipeline.ts` — hàm `runAgent(agent: AIAgent)`:
  1. Tạo `AIRun` doc status `RUNNING`
  2. Với mỗi source URL → fetch feed → lấy item mới nhất chưa dedup
  3. Với item được chọn → crawl full content (Firecrawl)
  4. Gọi `generatePost()` → nhận JSON
  5. Validate output (length, không rỗng, có tags)
  6. Nếu `agent.autoPublish` → tạo Post status `PUBLISHED` (author = system user hoặc agent.owner)
  7. Nếu `!autoPublish` → tạo Post status `DRAFT` + set `aiGenerated=true`, `aiSourceUrls`
  8. Update `AIRun` status `SUCCESS` + `outputPost` + `tokensUsed` + `cost`
  9. Update `agent.lastRunAt`
- [ ] Error handling: mọi bước throw → update `AIRun.status = FAILED` + `error`
- [ ] Hard cap: 1 agent chỉ gen tối đa 5 post/run

## 3.6 Queue + cron

- [ ] Cài `bullmq` + Upstash Redis (hoặc Vercel KV với compat layer)
- [ ] `lib/queue/index.ts`: tạo queue `ai-agent`
- [ ] `lib/queue/worker.ts`: worker consume job `{ agentId }` → gọi `runAgent`
- [ ] Dev: chạy worker bằng `tsx lib/queue/worker.ts`
- [ ] Endpoint `POST /api/cron/run-agents` (bảo vệ bằng `CRON_SECRET` header):
  - Query tất cả `AIAgent` active có `schedule` match giờ hiện tại (dùng `cron-parser`)
  - Enqueue job cho từng agent
- [ ] Setup `vercel.json` với cron chạy `/api/cron/run-agents` mỗi 15 phút

## 3.7 Testing & scripts

- [ ] `scripts/test-agent.ts`: chạy 1 agent cụ thể bằng CLI — `pnpm tsx scripts/test-agent.ts <agentId>`
- [ ] `scripts/test-prompt.ts`: test prompt với URL cứng, in JSON output (không ghi DB)
- [ ] Integration test: mock Anthropic SDK, assert output format
- [ ] Cost log: `scripts/ai-cost-report.ts` — tổng tokens/cost 7 ngày gần nhất

## 3.8 Safety nets

- [ ] **Hard limit tokens/ngày**: mỗi agent có field `dailyTokenLimit`, check trước khi gọi Anthropic
- [ ] **Content filter**: regex check keyword nhạy cảm trong output trước khi publish
- [ ] **Plagiarism check**: so sánh similarity (simple: shingle 8-gram overlap) với source, reject nếu > 60%
- [ ] **Rate limit** gọi Anthropic: max 10 req/phút/key (tránh burst)

---

## Definition of Done

- [x] Chạy `pnpm tsx scripts/test-agent.ts <id>` → tạo 1 Post DRAFT trong DB với content hợp lệ.
- [x] `AIRun` doc có đủ tokensUsed + cost.
- [x] Cron endpoint trigger được qua curl với `CRON_SECRET`.
- [x] Khi gọi 2 lần liên tiếp với cùng nguồn → dedup hoạt động, không tạo post trùng.
- [x] Prompt caching active (kiểm bằng response `usage.cache_read_input_tokens > 0` từ lần 2 trở đi).
- [x] API key lưu DB là ciphertext, không phải plaintext.
- [x] Content filter block được output chứa từ khoá cấm (test manual).

## Files mới

```
lib/crypto.ts
lib/apikey.ts
lib/ai/{anthropic,prompts,pipeline}.ts
lib/crawler/{rss,firecrawl,dedupe}.ts
lib/queue/{index,worker}.ts
app/api/cron/run-agents/route.ts
scripts/{test-agent,test-prompt,ai-cost-report}.ts
vercel.json
```

## Rủi ro / ghi chú

- **Cost**: 1 post ~ 2–5k token out với opus = $0.03–0.075. Sonnet rẻ 5x → default.
- **Hallucination**: AI có thể bịa số liệu. Bắt buộc trích nguồn + prompt nghiêm cấm chế số.
- **Bản quyền**: paraphrase không đủ — vẫn có thể bị DMCA. Chỉ lấy RSS excerpt + trích nguồn rõ, không copy full bài.
- **Worker crash**: nếu chạy worker trên Vercel không khả thi (serverless ≤ 10s). Giải pháp: `runAgent` chạy trong cùng request cron (Vercel cho 60s trên Pro), hoặc deploy worker riêng trên Railway/Fly.
- **Prompt caching TTL**: 5 phút — nếu cron 15 phút sẽ mất cache. Cân nhắc tăng tần suất hoặc dùng 1-hour cache (beta).
