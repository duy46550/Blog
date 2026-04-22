# Phase 1 — Foundation

> **Mục tiêu**: dựng xong nền tảng. Kết thúc phase này phải login được, có layout 3 cột Threads-style, DB Mongo đã kết nối và có seed data.

**Ước lượng**: ~1 tuần · **Blocks**: Phase 2 (Core Feed)

---

## 1.1 Project init

- [ ] `npx create-next-app@latest blog --ts --tailwind --app --eslint --src-dir=false`
- [ ] Thêm `.nvmrc` (Node 20+) và `.editorconfig`
- [ ] Cài `prettier` + `prettier-plugin-tailwindcss`, config `.prettierrc`
- [ ] Init git, `.gitignore` chuẩn Next.js + `.env*`
- [ ] Setup `husky` + `lint-staged` chạy prettier/eslint trước commit

## 1.2 UI toolkit

- [ ] Init shadcn/ui: `npx shadcn@latest init` (base color: neutral, CSS variables)
- [ ] Add các component cần: `button`, `input`, `textarea`, `avatar`, `dropdown-menu`, `dialog`, `toast`, `skeleton`, `tabs`, `sheet`
- [ ] Cài `lucide-react` (icons), `framer-motion`, `next-themes`
- [ ] Font: Inter via `next/font/google`, set làm default trong `app/layout.tsx`
- [ ] Setup dark/light toggle với `next-themes` + provider

## 1.3 MongoDB + Mongoose

- [ ] Tạo cluster **MongoDB Atlas** free tier (M0), whitelist IP local + `0.0.0.0/0` cho dev
- [ ] Cài `mongoose`
- [ ] Tạo `lib/db.ts` — connection helper với **global cache** cho Next.js hot reload:
  ```ts
  // chống tạo nhiều connection trong dev
  const cached = (global as any).mongoose ?? { conn: null, promise: null };
  ```
- [ ] Tạo các model dưới `models/`:
  - [ ] `User.ts`
  - [ ] `Post.ts`
  - [ ] `Comment.ts`
  - [ ] `Like.ts`
  - [ ] `AIAgent.ts`
  - [ ] `AIRun.ts`
  - [ ] `ApiKey.ts`
- [ ] Mỗi model export cả `Schema` + `Model` + TS type (`HydratedDocument<IUser>`)
- [ ] Verify indexes được tạo (chạy `Model.syncIndexes()` trong script init)

## 1.4 Authentication (NextAuth v5)

- [ ] Cài `next-auth@beta` + `@auth/mongodb-adapter` + `mongodb` driver
- [ ] Tạo `lib/auth.ts` với providers: **Google OAuth** + **Email (Resend)** magic link
- [ ] Route handler `app/api/auth/[...nextauth]/route.ts`
- [ ] Middleware bảo vệ `/admin/*` (chỉ role `ADMIN`)
- [ ] Page `/login`, `/register` (UI Threads-style, tối giản)
- [ ] Hook custom `useSession()` wrapper + server helper `getCurrentUser()`
- [ ] Test: login Google → user doc được tạo tự động trong Mongo

## 1.5 Layout 3 cột Threads-style

- [ ] `app/(main)/layout.tsx`: grid 3 cột (sidebar trái cố định, feed giữa max-w-[640px], right panel)
- [ ] `components/layout/Sidebar.tsx`: logo Threads-like (hexagon), nav icons Home/Search/Compose(+)/Activity/Profile, dark mode toggle
- [ ] `components/layout/RightPanel.tsx`: khi chưa login → card "Đăng nhập hoặc đăng ký"; khi đã login → suggestions/trending tags placeholder
- [ ] Responsive: mobile → sidebar chuyển thành bottom tab bar
- [ ] Header mobile: chỉ hiện logo giữa + nút back

## 1.6 Seed data

- [ ] `scripts/seed.ts` (chạy bằng `tsx scripts/seed.ts`)
- [ ] Tạo 3 user mẫu (1 ADMIN, 2 AUTHOR)
- [ ] Tạo ~20 post mẫu (mix có ảnh, có link preview, có reply thread)
- [ ] Tạo 1 AIAgent mẫu (inactive) để test CRUD về sau
- [ ] Thêm script `"db:seed": "tsx scripts/seed.ts"` vào `package.json`

## 1.7 DX & tooling

- [ ] `.env.example` đầy đủ các biến của Phase 1 (`MONGODB_URI`, `NEXTAUTH_*`, `GOOGLE_*`, `RESEND_API_KEY`)
- [ ] README root: mô tả ngắn + hướng dẫn `pnpm install && pnpm db:seed && pnpm dev`
- [ ] Setup Vitest + `@testing-library/react` (chỉ config, chưa test gì)
- [ ] CI GitHub Actions: chạy `lint` + `build` trên PR

---

## Definition of Done

- [x] `pnpm dev` chạy không lỗi, mở `localhost:3000` thấy layout 3 cột trống.
- [x] Login Google tạo user trong Mongo Atlas.
- [x] `pnpm db:seed` chạy thành công, Mongo có user + post mẫu.
- [x] Truy cập `/admin` khi chưa phải admin → redirect login.
- [x] Dark/light toggle hoạt động, lưu theme vào localStorage.
- [x] `pnpm build` pass, ESLint + TS không error.

## Files/paths sẽ tồn tại sau phase

```
app/(main)/layout.tsx, page.tsx
app/(auth)/login/page.tsx, register/page.tsx
app/api/auth/[...nextauth]/route.ts
components/layout/{Sidebar,RightPanel,Header,ThemeToggle}.tsx
lib/{db.ts,auth.ts}
models/{User,Post,Comment,Like,AIAgent,AIRun,ApiKey}.ts
scripts/seed.ts
.env.example
```

## Rủi ro / ghi chú

- **Mongoose + Next.js dev**: không cache connection → mỗi save file tạo connection mới, dễ đụng limit Atlas. → cache qua `global`.
- **NextAuth v5 (beta)**: API khác v4 nhiều, đọc kỹ docs. Adapter Mongo cần collection riêng (`accounts`, `sessions`, `verification_tokens`) — để Mongo tự tạo.
- **Username**: NextAuth không tự gen username → thêm hook `events.createUser` tự slug từ email.
