# Phase 5 — Polish & Deploy

> **Mục tiêu**: sản phẩm sẵn sàng production — SEO, search, bảo mật, performance, monitoring, đẩy lên Vercel với domain riêng.

**Ước lượng**: ~1 tuần · **Depends on**: Phase 4 · **Unblocks**: 🚀 Launch

---

## 5.1 SEO

- [ ] `generateMetadata` cho mỗi route: `/`, `/post/[id]`, `/@username`, `/explore`
- [ ] Title template: `"%s · Blog Name"` trong root layout
- [ ] Open Graph image động: dùng `@vercel/og` → `app/post/[id]/opengraph-image.tsx`
  - Canvas 1200x630, show title + author avatar + domain
- [ ] `app/robots.ts` — allow all trừ `/admin/*`, `/api/*`
- [ ] `app/sitemap.ts` — sinh sitemap từ DB (published posts + profile pages)
- [ ] Structured data (JSON-LD) cho `Article` schema trong `/post/[id]`
- [ ] Canonical URL, alt text ảnh

## 5.2 Search (MongoDB Atlas Search)

- [ ] Tạo **Atlas Search index** trên collection `posts`:
  ```json
  { "mappings": { "dynamic": false, "fields": {
    "content": { "type": "string", "analyzer": "lucene.standard" },
    "title":   { "type": "string", "analyzer": "lucene.standard" },
    "tags":    { "type": "string" }
  }}}
  ```
- [ ] `GET /api/search?q=...` → aggregation `$search` với fuzzy + highlight
- [ ] Trang `/search` UI: search bar (debounce 300ms), list kết quả với highlight
- [ ] Search suggestions: lấy top tags
- [ ] (Optional) Vector search: thêm embedding khi create Post, index vectorSearch → semantic search

## 5.3 Performance

- [ ] Bật Next.js ISR cho `/post/[id]`: `revalidate = 3600`
- [ ] `Cache-Control` headers cho API `GET` (với `s-maxage` + `stale-while-revalidate`)
- [ ] Redis cache feed home page 60s (invalidate khi có post mới)
- [ ] `next/image` `priority` cho first-fold; lazy load phần còn lại
- [ ] Bundle analysis: `@next/bundle-analyzer`, cắt bớt dep thừa
- [ ] Fonts: preload Inter, dùng `display: swap`
- [ ] Lighthouse target: Performance 90+ mobile

## 5.4 Rate limit & abuse

- [ ] `lib/rate-limit.ts` dùng Upstash Redis với sliding window
- [ ] Middleware apply:
  - `POST /api/posts`: 10 post / 10 phút / user
  - `POST /api/posts/*/like`: 60 / phút / user
  - `POST /api/upload/presign`: 20 / giờ / user
  - `POST /api/og-scrape`: 30 / phút / IP
  - `POST /api/cron/*`: chỉ qua `CRON_SECRET`
- [ ] CAPTCHA (Cloudflare Turnstile) ở `/register` và compose khi IP bị flag
- [ ] Honeypot field trong form register để chặn bot cơ bản

## 5.5 Security hardening

- [ ] CSP header qua `next.config.js` headers (strict, chỉ allow self + R2 + Vercel analytics)
- [ ] HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff
- [ ] Session cookie: `httpOnly`, `secure`, `sameSite=lax`
- [ ] Rotate `NEXTAUTH_SECRET` trước khi prod
- [ ] Audit dependencies: `pnpm audit --audit-level=high` clean
- [ ] Input sanitization khi render user content (DOMPurify cho rich text)
- [ ] Prevent NoSQL injection: không bao giờ pass user input thẳng vào query object (check `$where`, `$regex` escape)

## 5.6 Error handling & monitoring

- [ ] Sentry integration (`@sentry/nextjs`) cho FE + BE
- [ ] `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx` đẹp (không lộ stack trace)
- [ ] Alert Sentry: error rate > 1% / 5 phút
- [ ] PostHog: track page view, post create, AI run cost
- [ ] Uptime monitor (Better Stack / UptimeRobot) ping `/api/health`
- [ ] `app/api/health/route.ts`: check Mongo ping + Redis ping → 200/503

## 5.7 i18n (optional, nếu cần EN)

- [ ] Cài `next-intl`, route `[locale]`
- [ ] Dịch UI strings: VN (default) + EN
- [ ] Language switcher ở footer

## 5.8 Accessibility

- [ ] Keyboard nav qua toàn bộ UI (Tab, Enter, Esc close modal)
- [ ] ARIA labels cho icon-only button
- [ ] Focus ring visible (không `outline: none` trần)
- [ ] Contrast AA: check `@axe-core/react` trong dev
- [ ] Alt text bắt buộc khi upload ảnh (prompt khi user bỏ trống)

## 5.9 Deploy

- [ ] Push repo lên GitHub (private)
- [ ] Import project vào Vercel
- [ ] Add env vars production (Vercel dashboard):
  - `MONGODB_URI` (Atlas cluster prod, không dùng dev)
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - `GOOGLE_CLIENT_ID/SECRET` (thêm domain prod vào OAuth)
  - `ANTHROPIC_API_KEY`, `RESEND_API_KEY`
  - `R2_*`, `REDIS_URL`
  - `ENCRYPTION_KEY`, `CRON_SECRET`
  - `SENTRY_DSN`
- [ ] Verify Vercel cron hoạt động (check logs sau deploy)
- [ ] Custom domain: mua + point CNAME, enable HTTPS
- [ ] Verify `sitemap.xml`, `robots.txt` accessible

## 5.10 Docs

- [ ] `README.md` root: quickstart, tech stack, architecture diagram
- [ ] `docs/deploy.md`: hướng dẫn deploy chi tiết
- [ ] `docs/agent-guide.md`: user guide cho admin — cách tạo agent, viết prompt hiệu quả
- [ ] `docs/schema.md`: mô tả collections + relations
- [ ] `CONTRIBUTING.md`: coding convention, PR template

## 5.11 Smoke test pre-launch

- [ ] Đăng ký account mới flow đầy đủ
- [ ] Đăng 1 post text + ảnh + link preview
- [ ] Like + comment + reply thread
- [ ] Tạo 1 agent AI mới, chạy thử, duyệt draft, publish
- [ ] Test mobile (iPhone + Android browser)
- [ ] Test dark mode mọi page
- [ ] Test `/admin` bị chặn với user thường
- [ ] Lighthouse audit homepage + post detail
- [ ] Bắt lỗi 404, 500 intentional → Sentry nhận

---

## Definition of Done

- [x] Domain prod chạy, SSL valid, Lighthouse ≥ 85 mobile mọi trang chính.
- [x] Google crawl được sitemap (check Search Console).
- [x] Search trả kết quả relevant cho query VN + EN.
- [x] Rate limit hoạt động (test bằng script spam request).
- [x] Sentry nhận error events từ prod.
- [x] Agent AI chạy đúng lịch trên Vercel cron ≥ 24h liên tục không lỗi.
- [x] CSP không block tính năng hợp lệ (check DevTools console sạch).
- [x] `pnpm audit` không có high/critical.
- [x] Docs đủ cho người mới onboard lại dự án.

## Files mới

```
app/robots.ts
app/sitemap.ts
app/post/[id]/opengraph-image.tsx
app/api/health/route.ts
app/{error,not-found,global-error}.tsx
lib/rate-limit.ts
docs/{deploy,agent-guide,schema}.md
next.config.js       # CSP, headers, bundle analyzer
sentry.{client,server,edge}.config.ts
```

## Rủi ro / ghi chú

- **Atlas Search free tier**: giới hạn search index — với data lớn phải upgrade M10 ($57/tháng). Phase đầu ok.
- **Vercel cron** miễn phí chỉ 2 jobs trên Hobby plan. Nếu cần nhiều cron → gộp vào 1 endpoint dispatcher hoặc upgrade Pro.
- **ISR + Mongo**: khi publish post mới nhớ `revalidatePath('/')` — nếu quên, homepage cache cũ.
- **Prompt caching 5 phút**: nếu trafic agent thưa → cache miss hoài. Cân nhắc gộp nhiều agent chạy cùng giờ.
- **Launch checklist**: đi hết mục 5.11 rồi mới announce.
