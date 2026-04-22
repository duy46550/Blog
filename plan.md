# Plan: Fullstack News Blog — Threads-style UI + AI Auto-Posting

## 1. Tổng quan dự án

Website blog tin tức fullstack với giao diện tối giản kiểu **Threads (Meta)**, tích hợp **AI API** (Claude / OpenAI / Gemini) để tự động research chủ đề, tổng hợp tin tức và đăng bài theo lịch.

### Mục tiêu chính
- Feed dạng timeline giống Threads: bài viết ngắn/dài, ảnh, link preview, tương tác (like, comment, repost, share).
- Bảng quản trị (admin dashboard) để cấu hình AI, nguồn tin, lịch đăng.
- AI agent tự động: crawl tin → research → viết bài → duyệt/đăng.
- Hỗ trợ đa người dùng, đa tác giả, SEO friendly.

---

## 2. Tech Stack

### Frontend
- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (components)
- **Framer Motion** (animations cho feed)
- **TanStack Query** (data fetching + cache)
- **Zustand** (client state: modal, compose)
- **next-themes** (dark/light như Threads)

### Backend
- **Next.js API Routes / Server Actions** (monorepo approach)
- **MongoDB** (Atlas free tier) + **Mongoose ODM** (schema, validation, hooks)
- **NextAuth.js v5** với `@auth/mongodb-adapter` (Auth: Google, GitHub, Email OTP)
- **Redis** (Upstash) — cache feed, rate limit, queue
- **BullMQ** — queue cho AI jobs (research, generate, schedule)
- **MongoDB Atlas Search** — full-text search (thay Postgres FTS)
- **MongoDB Vector Search** — semantic search với embeddings (thay pgvector)

### AI & Automation
- **Anthropic Claude API** (claude-opus-4-7 / claude-sonnet-4-6) — viết bài chất lượng cao
- **OpenAI API** (fallback, embeddings cho search semantic)
- **Firecrawl / Jina Reader** — crawl & extract nội dung từ URL nguồn
- **RSS Parser** — đọc feed từ các trang tin (VnExpress, Tuoi Tre, TechCrunch…)
- **Cron jobs** (Vercel Cron / node-cron) — trigger AI agent định kỳ

### Infra & DevOps
- **Vercel** (deploy Next.js) hoặc **Docker + VPS**
- **Cloudflare R2 / AWS S3** — lưu ảnh bài viết
- **Sentry** — error tracking
- **PostHog** — analytics

---

## 3. Giao diện (Threads-style)

### Layout 3 cột (desktop)
```
┌──────────┬─────────────────────────────┬──────────────┐
│ Sidebar  │  Feed (center, max 640px)   │  Right panel │
│ (icons)  │                             │  (login/info)│
│          │   Post card                 │              │
│ Home     │   ┌─────────────────────┐   │  Đăng nhập   │
│ Search   │   │ avatar  user  time  │   │  hoặc đăng   │
│ Compose  │   │ content             │   │  ký          │
│ Activity │   │ [ảnh / link card]   │   │              │
│ Profile  │   │ ♥ 💬 🔁 ➤          │   │              │
└──────────┴───└─────────────────────┘───┴──────────────┘
```

### Trang chính
- `/` — **Trang chủ (Feed)** — danh sách bài viết mới nhất, infinite scroll.
- `/explore` — **Khám phá** — trending, theo chủ đề (công nghệ, kinh tế, thể thao…).
- `/compose` — **Soạn bài** (modal hoặc trang riêng).
- `/@username` — **Profile** tác giả + bài viết của họ.
- `/post/[id]` — **Chi tiết bài viết** + comments thread.
- `/search` — tìm kiếm full-text + semantic.
- `/activity` — thông báo (like, comment, follow).
- `/admin` — dashboard quản trị (xem mục 5).

### Chi tiết UI components (shadcn/ui base)
- `PostCard` — avatar tròn, username bold, timestamp "3 giờ", nội dung, media grid, action bar (icon outline như Threads).
- `ComposeModal` — textarea auto-grow, đính kèm ảnh (drag-drop), preview link.
- `Sidebar` — icons: Home (hexagon), Search, Plus (compose), Heart (activity), User.
- `LinkPreviewCard` — như post Dodge Viper trong ảnh: ảnh cover + domain + title.
- Font: **Inter** hoặc **SF Pro** (giống Threads).
- Border radius: `rounded-2xl` cho card, `rounded-full` cho avatar & buttons.

---

## 4. Database Schema (MongoDB + Mongoose)

> MongoDB là **document-based NoSQL** — không có JOIN như SQL. Ta dùng **references** (`ObjectId` + `.populate()`) cho quan hệ nhiều-nhiều, và **embed** cho dữ liệu gắn chặt (vd. linkPreview, mediaUrls). Tags, mediaUrls lưu thẳng dưới dạng array trong document.

### Collections

```ts
// models/User.ts
const UserSchema = new Schema({
  email:       { type: String, required: true, unique: true, index: true },
  username:    { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  avatarUrl:   String,
  bio:         String,
  role:        { type: String, enum: ['USER', 'AUTHOR', 'ADMIN'], default: 'USER' },
  // Follow relationship — embed mảng ObjectId (ok khi < vài nghìn follow/user)
  following:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followers:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// models/Post.ts
const PostSchema = new Schema({
  author:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content:      { type: String, required: true },
  title:        String,
  slug:         { type: String, unique: true, sparse: true },
  mediaUrls:    [String],
  linkPreview:  {                              // embed document
    url: String, title: String, image: String, domain: String,
  },
  tags:         { type: [String], index: true },
  status:       { type: String, enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED'], default: 'PUBLISHED', index: true },
  scheduledAt:  Date,
  aiGenerated:  { type: Boolean, default: false },
  aiSourceUrls: [String],
  parent:       { type: Schema.Types.ObjectId, ref: 'Post', index: true }, // reply thread
  likesCount:   { type: Number, default: 0 },   // denormalized counters
  repliesCount: { type: Number, default: 0 },
  viewCount:    { type: Number, default: 0 },
}, { timestamps: true });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ content: 'text', title: 'text' });  // text search

// models/Comment.ts — tương tự, có post ref + parent ref
// models/Like.ts — { user, post } với compound unique index
const LikeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: true });
LikeSchema.index({ user: 1, post: 1 }, { unique: true });

// models/AIAgent.ts
const AIAgentSchema = new Schema({
  name:        { type: String, required: true },
  topic:       String,                    // "công nghệ", "crypto"...
  sources:     [String],                  // RSS urls / website urls
  schedule:    String,                    // cron expression
  prompt:      String,                    // system prompt template
  model:       { type: String, default: 'claude-opus-4-7' },
  autoPublish: { type: Boolean, default: false },
  active:      { type: Boolean, default: true },
  lastRunAt:   Date,
}, { timestamps: true });

// models/AIRun.ts
const AIRunSchema = new Schema({
  agent:        { type: Schema.Types.ObjectId, ref: 'AIAgent', required: true, index: true },
  status:       { type: String, enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  inputUrls:    [String],
  outputPost:   { type: Schema.Types.ObjectId, ref: 'Post' },
  tokensUsed:   Number,
  cost:         Number,
  error:        String,
}, { timestamps: true });

// models/ApiKey.ts
const ApiKeySchema = new Schema({
  provider:     { type: String, required: true }, // "anthropic" | "openai" | "firecrawl"
  keyEncrypted: { type: String, required: true }, // AES-256 ciphertext
  label:        String,
  active:       { type: Boolean, default: true },
}, { timestamps: true });
```

### Ghi chú design MongoDB
- **Counters** (`likesCount`, `repliesCount`) denormalize để feed không phải `count()` mỗi lần → nhanh hơn nhiều. Cập nhật qua `$inc` trong transaction khi like/unlike.
- **Follow**: embed mảng `ObjectId` trong User — đơn giản, đủ cho quy mô vừa. Nếu user có >10k follow, tách collection `Follow` riêng.
- **Feed query** chính: `Post.find({ status: 'PUBLISHED' }).sort({ createdAt: -1 }).limit(20).populate('author')` — dùng cursor-based pagination (`_id < lastId`).
- **Reply thread** (Threads style): `parent` field self-reference. Fetch replies: `Post.find({ parent: postId })`.
- **Atlas Search** (tìm kiếm): tạo index search trên `content`, `title`, `tags` — dùng `$search` aggregation stage.
- **Vector Search** (semantic): thêm field `embedding: [Number]` (1536 dim cho OpenAI `text-embedding-3-small`), index kiểu `vectorSearch`.
- **Transactions**: MongoDB 4.0+ hỗ trợ multi-document transactions (cần replica set — Atlas có sẵn). Dùng cho like/unlike + update counter.

---

## 5. AI Auto-Posting Pipeline

### Flow
```
[Cron trigger] → [Fetch sources (RSS/crawl)] → [Dedupe vs DB]
  → [AI: research + summarize] → [AI: generate post (Threads style)]
  → [AI: generate tags + SEO] → [Store as DRAFT or PUBLISH]
  → [Notify admin if needs review]
```

### Chi tiết các bước
1. **Scheduler**: `node-cron` hoặc Vercel Cron chạy mỗi N phút theo config của từng `AIAgent`.
2. **Source Ingestion**:
   - RSS: `rss-parser` đọc feed, lấy link mới.
   - Web: Firecrawl/Jina Reader → markdown sạch.
3. **Dedup**: hash URL + title, check DB để bỏ bài trùng.
4. **Research step** (optional, dùng tool use):
   - Claude gọi tool `fetchUrl` để đọc thêm bài liên quan.
5. **Generate step**:
   - System prompt: "Bạn là biên tập viên cho blog tin tức style Threads. Viết ngắn gọn 2–4 đoạn, giọng tự nhiên, có hook mở đầu…"
   - Input: nội dung nguồn + yêu cầu (ngôn ngữ, tone).
   - Output: JSON `{ title, content, tags, excerpt }`.
6. **Post-process**: check độ dài, lọc nội dung nhạy cảm, thêm nguồn trích dẫn.
7. **Publish hoặc Review queue**:
   - `autoPublish=true` → đăng luôn.
   - `autoPublish=false` → vào `/admin/review` cho người duyệt (accept/edit/reject).

### Admin Dashboard `/admin`
- **Agents**: CRUD, bật/tắt, xem log chạy, token/cost.
- **API Keys**: thêm/xoá key (mã hoá AES trước khi lưu).
- **Review queue**: xem draft AI tạo, edit inline, 1-click publish.
- **Sources**: thêm RSS/website, test crawl.
- **Analytics**: bài đăng/ngày, cost AI, top post.

---

## 6. Cấu trúc thư mục

```
blog/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx          # 3-column layout
│   │   ├── page.tsx            # Feed (home)
│   │   ├── explore/page.tsx
│   │   ├── post/[id]/page.tsx
│   │   ├── [username]/page.tsx # profile (@user)
│   │   └── search/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── admin/
│   │   ├── layout.tsx          # admin shell
│   │   ├── page.tsx            # overview
│   │   ├── agents/
│   │   ├── review/
│   │   ├── sources/
│   │   └── api-keys/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── posts/
│   │   ├── ai/
│   │   │   ├── generate/route.ts
│   │   │   └── research/route.ts
│   │   └── cron/
│   │       └── run-agents/route.ts
│   └── layout.tsx
├── components/
│   ├── feed/  (PostCard, ComposeModal, LinkPreview, MediaGrid)
│   ├── layout/ (Sidebar, RightPanel, Header)
│   ├── ui/     (shadcn)
│   └── admin/
├── lib/
│   ├── db.ts              # Mongoose connection (cached for Next.js hot reload)
│   ├── auth.ts            # NextAuth + MongoDBAdapter
│   ├── redis.ts
│   ├── ai/
│   │   ├── anthropic.ts   # Claude client wrapper
│   │   ├── openai.ts
│   │   ├── prompts.ts     # system prompts
│   │   └── pipeline.ts    # research+generate orchestrator
│   ├── crawler/
│   │   ├── rss.ts
│   │   └── firecrawl.ts
│   ├── queue/
│   │   └── worker.ts      # BullMQ worker
│   └── crypto.ts          # AES for API keys
├── models/                # Mongoose schemas
│   ├── User.ts
│   ├── Post.ts
│   ├── Comment.ts
│   ├── Like.ts
│   ├── AIAgent.ts
│   ├── AIRun.ts
│   └── ApiKey.ts
├── public/
├── .env.example
├── package.json
└── plan.md
```

---

## 7. Roadmap (milestones)

### Phase 1 — Foundation (tuần 1)
- [ ] Init Next.js 15 + TS + Tailwind + shadcn.
- [ ] Setup MongoDB Atlas cluster + Mongoose connection (`lib/db.ts` với global cache cho Next.js dev hot reload).
- [ ] Define Mongoose models (User, Post, Comment, Like, AIAgent, AIRun, ApiKey).
- [ ] NextAuth v5 + `@auth/mongodb-adapter` (Google + Email).
- [ ] Layout 3 cột Threads-style + dark mode.
- [ ] Seed script (`scripts/seed.ts`).

### Phase 2 — Core Feed (tuần 2)
- [ ] `PostCard`, `ComposeModal`, infinite scroll feed.
- [ ] Like, comment, reply thread.
- [ ] Profile page `/@username`.
- [ ] Upload ảnh lên R2/S3 + link preview (open graph scrape).

### Phase 3 — AI Pipeline (tuần 3)
- [ ] Models `AIAgent`, `AIRun`, `ApiKey`.
- [ ] Anthropic client + prompt templates.
- [ ] RSS/Firecrawl ingestion.
- [ ] Endpoint `POST /api/ai/generate` (tạo 1 bài từ URL).
- [ ] Cron runner + BullMQ queue.

### Phase 4 — Admin Dashboard (tuần 4)
- [ ] `/admin` shell + RBAC (role ADMIN).
- [ ] CRUD AIAgent + API keys (AES encrypt).
- [ ] Review queue (draft → publish).
- [ ] Analytics cơ bản (cost, số bài, views).

### Phase 5 — Polish & Deploy (tuần 5)
- [ ] SEO (metadata, sitemap, OG images).
- [ ] Search (MongoDB Atlas Search + optional Vector Search cho semantic).
- [ ] Rate limit + abuse prevention.
- [ ] Deploy Vercel + domain + Sentry.
- [ ] Viết README + docs agent.

---

## 8. ENV variables (`.env.example`)

```env
# Database
MONGODB_URI="mongodb+srv://<user>:<pass>@cluster.xxx.mongodb.net/blog?retryWrites=true&w=majority"
MONGODB_DB="blog"

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Redis
REDIS_URL="rediss://..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
FIRECRAWL_API_KEY="fc-..."

# Storage
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="blog-media"

# Security
ENCRYPTION_KEY="32-byte-hex"   # AES-256 cho API keys trong DB
CRON_SECRET="..."              # bảo vệ endpoint /api/cron/*
```

---

## 9. Lưu ý quan trọng

- **Bảo mật API key**: không bao giờ trả key thô về client. Lưu DB phải mã hoá AES-256. Admin UI chỉ hiển thị 4 ký tự cuối.
- **Cost control AI**: set hard limit token/ngày per agent. Log cost mỗi run.
- **Bản quyền**: khi AI tổng hợp từ báo khác, luôn trích nguồn + link. Cân nhắc chỉ paraphrase, không copy paste.
- **Rate limit**: dùng Upstash Redis + middleware, 60 req/phút/IP cho API công khai.
- **SEO**: server-render post detail, gen OG image với `@vercel/og`.
- **i18n**: hỗ trợ VN + EN bằng `next-intl` nếu cần.
- **Accessibility**: keyboard nav, ARIA cho modal compose, contrast AA.

---

## 10. Next step

1. Xác nhận tech stack + scope với user.
2. Init repo, scaffold Next.js + Prisma.
3. Bắt đầu Phase 1.
