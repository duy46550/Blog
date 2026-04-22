# Tasks — Blog Tin Tức Threads-style

Chia nhỏ [plan.md](../plan.md) thành 5 phase độc lập. Mỗi file là 1 tuần làm việc, gồm danh sách task checkbox + **Definition of Done (DoD)** để biết khi nào xong.

## Thứ tự thực hiện

| # | File | Mục tiêu | Ước lượng |
|---|------|----------|-----------|
| 1 | [phase-1-foundation.md](./phase-1-foundation.md) | Scaffold Next.js, MongoDB, Auth, layout 3 cột | 1 tuần |
| 2 | [phase-2-core-feed.md](./phase-2-core-feed.md) | Feed + Post + Like + Comment + Profile | 1 tuần |
| 3 | [phase-3-ai-pipeline.md](./phase-3-ai-pipeline.md) | AI agent: crawl → research → generate → draft | 1 tuần |
| 4 | [phase-4-admin-dashboard.md](./phase-4-admin-dashboard.md) | Admin UI: agents, API keys, review queue, analytics | 1 tuần |
| 5 | [phase-5-polish-deploy.md](./phase-5-polish-deploy.md) | SEO, search, rate limit, deploy Vercel | 1 tuần |

## Quy ước

- Mỗi task dùng `- [ ]` để đánh dấu, tick `- [x]` khi xong.
- Task nào block phase sau → ghi rõ trong phần **Blocks**.
- Ghi commit liên quan vào cuối file (optional) để truy vết.
- Khi phase xong, chạy DoD checklist trước khi mở phase kế.

## Global conventions (áp dụng mọi phase)

- **Commit style**: `feat(scope): ...`, `fix(scope): ...`, `chore: ...`.
- **Branch**: `phase-N/<slug>` (vd. `phase-1/auth-setup`).
- **Test**: tối thiểu 1 smoke test/feature chính (Vitest + Playwright).
- **Types**: không dùng `any`; Mongoose model export typed document.
- **Secrets**: không commit `.env` — chỉ cập nhật `.env.example`.
