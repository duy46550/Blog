# Phase 4 — Admin Dashboard

> **Mục tiêu**: admin không cần dev cũng quản lý được hệ thống — thêm agent, thêm API key, duyệt bài AI, xem cost & analytics.

**Ước lượng**: ~1 tuần · **Depends on**: Phase 3 (AIAgent/AIRun/ApiKey models) · **Blocks**: Phase 5 (launch cần dashboard hoàn thiện)

---

## 4.1 Admin shell & RBAC

- [ ] `app/admin/layout.tsx`: layout 2 cột (sidebar admin trái + content), **không** dùng layout Threads ở public
- [ ] Middleware check role `ADMIN` → redirect nếu không đủ quyền (đã setup Phase 1, verify lại)
- [ ] Sidebar admin: Overview / Agents / Review Queue / Sources / API Keys / Analytics / Settings
- [ ] Breadcrumb + page title consistent
- [ ] Dark mode reuse từ public

## 4.2 Overview page

- [ ] `app/admin/page.tsx`: 4 KPI cards
  - Tổng bài đăng 7 ngày
  - Bài AI tạo 7 ngày
  - Token/cost 7 ngày (stack bar chart)
  - Active agents / total agents
- [ ] Biểu đồ dùng `recharts` hoặc `tremor`
- [ ] List 5 AIRun gần nhất (status badge + link chi tiết)

## 4.3 Agents CRUD

- [ ] `app/admin/agents/page.tsx`: table list agent (tên, topic, schedule, lastRunAt, active toggle)
- [ ] Nút "Tạo agent" → form modal:
  - name, topic, sources (multi-url input, validate URL)
  - schedule (cron expression, có preset dropdown: mỗi giờ / mỗi 6h / mỗi ngày 8h)
  - prompt (textarea với tokens template `{{topic}}`, `{{source}}`)
  - model (select: sonnet / opus)
  - autoPublish (switch)
  - dailyTokenLimit (number)
- [ ] Validate cron expression bằng `cron-parser` (preview 3 lần chạy tiếp theo)
- [ ] Edit + Delete (confirm dialog)
- [ ] Nút "Chạy thử" → enqueue job ngay lập tức, redirect sang tab Runs của agent đó
- [ ] `app/admin/agents/[id]/page.tsx`: chi tiết + list AIRun của agent đó

## 4.4 API Keys CRUD

- [ ] `app/admin/api-keys/page.tsx`: table provider / label / preview (4 ký tự cuối) / active / createdAt
- [ ] Form thêm key: provider (select), label, rawKey (password input)
- [ ] **Client không bao giờ nhìn thấy key thô sau khi tạo** — chỉ hiện `sk-...XXXX`
- [ ] Nút Disable (toggle active) thay vì delete để giữ audit trail
- [ ] Cảnh báo hiện khi chưa có key `anthropic` active
- [ ] Nút "Test connection" — gọi API provider bằng key, trả về success/fail

## 4.5 Review Queue

- [ ] `app/admin/review/page.tsx`: list Post status `DRAFT` & `aiGenerated=true`
- [ ] Card review: title + excerpt + tags + nguồn (list aiSourceUrls) + thời gian AI tạo
- [ ] Nút action: **Edit inline** (mở modal editor) / **Publish** / **Reject** (soft delete)
- [ ] Editor: dùng `@tiptap/react` basic (bold, italic, link, list) hoặc textarea markdown
- [ ] Sau publish: status → `PUBLISHED`, set `publishedAt = now`, revalidate `/`
- [ ] Bulk actions: select nhiều → Publish tất cả / Reject tất cả
- [ ] Filter: theo agent / theo topic / theo ngày

## 4.6 Sources management

- [ ] `app/admin/sources/page.tsx`: list các source URL từ tất cả agents (dedup)
- [ ] Card source: URL, domain, loại (RSS/Web), last fetch, số post đã sinh từ source này
- [ ] Nút "Test crawl" → chạy `fetchFeed` hoặc Firecrawl ngay, show kết quả
- [ ] Health check: icon đỏ nếu source lỗi 3 lần liên tiếp (query AIRun có error chứa URL đó)

## 4.7 Analytics

- [ ] `app/admin/analytics/page.tsx`:
  - Line chart: cost AI theo ngày (split anthropic / openai)
  - Bar chart: số post/ngày (manual vs AI)
  - Top 10 post by view/like tuần qua
  - Token efficiency: cost/post trung bình, so sánh các agent
- [ ] Export CSV button (7 ngày / 30 ngày)

## 4.8 Settings

- [ ] `app/admin/settings/page.tsx`:
  - Site name, logo, favicon
  - Default AI model khi tạo agent
  - Global daily token cap (tổng tất cả agents)
  - Content filter keyword list (textarea)
  - Noti email khi có draft mới (tuỳ chọn, gửi qua Resend)
- [ ] Model `SiteConfig` (single doc collection)

## 4.9 Audit log (nice-to-have)

- [ ] Model `AuditLog` (actor, action, target, meta, createdAt)
- [ ] Log mọi hành động admin (create agent, publish post, disable key)
- [ ] Trang `/admin/audit` list có filter theo actor/action

---

## Definition of Done

- [x] Admin non-dev tạo được agent mới qua UI, bật lên và thấy chạy theo cron.
- [x] Thêm API key qua UI → encrypt + store → pipeline gọi được.
- [x] Review queue: edit → publish → bài lên homepage.
- [x] Analytics hiển thị số liệu đúng khớp với DB.
- [x] Không user thường nào truy cập được `/admin/*` (test bằng account USER).
- [x] Test connection API key trả kết quả chính xác (thử key sai → fail).

## Files mới

```
app/admin/
  layout.tsx
  page.tsx                     # overview
  agents/{page,[id]/page}.tsx
  review/page.tsx
  api-keys/page.tsx
  sources/page.tsx
  analytics/page.tsx
  settings/page.tsx
  audit/page.tsx
components/admin/
  AgentForm.tsx
  ApiKeyForm.tsx
  ReviewCard.tsx
  KpiCard.tsx
  CronPreview.tsx
models/{SiteConfig,AuditLog}.ts
```

## Rủi ro / ghi chú

- **Khi admin delete agent**: các AIRun cũ vẫn giữ lại (foreign ref). Dùng soft delete (`deletedAt`) thay hard delete.
- **API key rotation**: khi disable key cũ + add mới → đang có run in-flight dùng key cũ? → worker luôn fetch key mới nhất khi start job (không cache trong memory).
- **Cron preview**: UX quan trọng — admin gõ cron sai sẽ pain. Hiện 3 thời điểm run tiếp theo bằng chữ Việt ("08:00 ngày mai, ...").
- **Big query**: analytics 30 ngày có thể chậm. Dùng MongoDB aggregation với `$dateTrunc` + index `createdAt`.
