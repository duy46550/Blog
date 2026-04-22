# Blog — News · Threads-style · AI-powered

Fullstack news blog với giao diện Threads-like, MongoDB backend, tích hợp Claude API để research & tự đăng bài theo lịch.

- Kế hoạch tổng: [plan.md](./plan.md)
- Task theo phase: [tasks/](./tasks/)

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **MongoDB Atlas** + **Mongoose**
- **NextAuth v5** + `@auth/mongodb-adapter` (Google + Email magic link qua Resend)
- **Tailwind v4** + **shadcn/ui** (new-york style)
- **next-themes** (dark/light), **framer-motion**, **lucide-react**

## Yêu cầu

- Node.js 20+
- pnpm 9+ (khuyến nghị): `npm i -g pnpm`
- MongoDB Atlas cluster (M0 free tier OK)

## Quickstart

```bash
# 1. Cài deps
pnpm install

# 2. Copy env, điền MONGODB_URI + AUTH_SECRET (ít nhất)
cp .env.example .env.local

# 3. Sync indexes + seed dữ liệu mẫu
pnpm db:sync-indexes
pnpm db:seed

# 4. Run dev
pnpm dev
# → http://localhost:3000
```

### Tạo `AUTH_SECRET`

```bash
openssl rand -base64 32
```

### Env tối thiểu cho Phase 1

```env
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="blog"
AUTH_SECRET="<random>"
AUTH_TRUST_HOST=true
# Google OAuth — tuỳ chọn ở phase này, để trống nếu chưa có
# AUTH_GOOGLE_ID="..."
# AUTH_GOOGLE_SECRET="..."
```

Nếu chưa set Google/Resend → trang `/login` sẽ không hiện provider nào (UI vẫn render), feed vẫn đọc được.

## Scripts

| Command | Mô tả |
|---------|-------|
| `pnpm dev` | Dev server `localhost:3000` |
| `pnpm build` | Build production |
| `pnpm start` | Chạy production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript typecheck (không emit) |
| `pnpm format` | Prettier |
| `pnpm db:seed` | Seed users + posts mẫu |
| `pnpm db:sync-indexes` | Sync Mongoose indexes |

## Cấu trúc thư mục (Phase 1)

```
app/
  (main)/                # layout 3 cột — feed, explore, profile
    layout.tsx
    page.tsx
  (auth)/                # layout tối giản cho login/register
    login/page.tsx
    register/page.tsx
  admin/page.tsx         # stub — Phase 4 sẽ xây đầy đủ
  api/auth/[...nextauth]/route.ts
  layout.tsx             # root layout + ThemeProvider
  globals.css            # Tailwind v4 CSS-first + theme vars
components/
  layout/                # Sidebar, RightPanel, Logo, ThemeToggle, MobileHeader
  ui/                    # shadcn: button, avatar, input, skeleton, dropdown-menu
  theme-provider.tsx
lib/
  db.ts                  # Mongoose connection (global cache)
  mongodb.ts             # MongoClient promise (cho NextAuth adapter)
  auth-helpers.ts        # getCurrentUser, requireUser, requireAdmin
  utils.ts               # cn, slugify, usernameFromEmail
  env.ts                 # env validation
models/                  # 7 Mongoose schemas
  User.ts, Post.ts, Comment.ts, Like.ts
  AIAgent.ts, AIRun.ts, ApiKey.ts
auth.ts                  # NextAuth v5 config (root)
middleware.ts            # auth middleware (protect /admin)
scripts/
  seed.ts
  sync-indexes.ts
```

## Ghi chú dev

- Mongoose connection cache qua `globalThis` → tránh cạn pool khi HMR.
- NextAuth v5 dùng MongoDB adapter: user được tạo ở collection `users`, event `createUser` augment thêm `username` + `role` qua Mongoose.
- Khi thêm component shadcn mới: `pnpm dlx shadcn@latest add <name>`.
- Đổi schema model → chạy `pnpm db:sync-indexes` để Mongo tạo index mới.

## Roadmap

Xem [tasks/README.md](./tasks/README.md). Đang ở **Phase 1 — Foundation**.
