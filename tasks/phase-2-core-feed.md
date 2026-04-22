# Phase 2 — Core Feed

> **Mục tiêu**: có feed Threads-style dùng được — xem, đăng, like, comment, reply thread, profile. Đây là trái tim sản phẩm.

**Ước lượng**: ~1 tuần · **Depends on**: Phase 1 · **Blocks**: Phase 3 (cần Post model để AI đăng)

---

## 2.1 PostCard component

- [ ] `components/feed/PostCard.tsx`: avatar tròn, username bold + handle + timestamp ("3 giờ"), content (preserve line break), media grid, action bar
- [ ] Relative time: dùng `date-fns` (`formatDistanceToNowStrict`, locale `vi`)
- [ ] Action bar 4 icons (outline lucide): `Heart`, `MessageCircle`, `Repeat2`, `Send`
- [ ] Hover state + tap animation bằng `framer-motion`
- [ ] Long content → collapse sau 6 dòng với nút "Xem thêm"
- [ ] Support reply indicator: "Đang trả lời @username" (như ảnh mẫu)

## 2.2 Media & link preview

- [ ] `components/feed/MediaGrid.tsx`: layout 1/2/3/4 ảnh (Threads style — 1 ảnh full, 2 ảnh 50/50, 4 ảnh 2x2)
- [ ] Ảnh dùng `next/image`, click mở lightbox (dialog)
- [ ] `components/feed/LinkPreviewCard.tsx`: giống card Dodge Viper — ảnh cover, domain nhỏ, title bold, toàn bộ card clickable
- [ ] Scrape open graph khi compose: endpoint `POST /api/og-scrape` → trả `{ title, description, image, domain }`
- [ ] Lib gợi ý: `open-graph-scraper` hoặc tự fetch + parse `<meta>`

## 2.3 Feed (home page)

- [ ] `app/(main)/page.tsx`: server component fetch 20 post đầu
- [ ] Cursor pagination: query `{ _id: { $lt: lastId }, status: 'PUBLISHED' }` sort `_id: -1`
- [ ] Infinite scroll: TanStack Query `useInfiniteQuery` + `IntersectionObserver`
- [ ] Skeleton loading với shadcn `Skeleton`
- [ ] Empty state: khi chưa có post nào
- [ ] Pull-to-refresh trên mobile (optional)

## 2.4 Compose (soạn bài)

- [ ] `components/feed/ComposeModal.tsx`: mở bằng nút `+` ở sidebar
- [ ] Textarea auto-grow (`react-textarea-autosize`), max 500 ký tự với counter
- [ ] Đính kèm ảnh: drag-drop + paste clipboard, upload lên R2/S3
- [ ] Khi dán URL → tự scrape OG và hiển thị preview bên dưới textarea
- [ ] Nút "Đăng" disable khi empty; show loading state
- [ ] Server action `createPost(formData)`: validate zod, tạo Post doc, revalidate `/`
- [ ] Optimistic update: đẩy post mới lên đầu feed ngay khi submit

## 2.5 Upload ảnh (R2 / S3)

- [ ] Setup Cloudflare R2 bucket + API token (public read)
- [ ] Cài `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- [ ] Endpoint `POST /api/upload/presign` trả presigned PUT URL (client upload trực tiếp, server không trung chuyển)
- [ ] Validate: max 5MB/ảnh, max 4 ảnh/post, chỉ accept `image/jpeg|png|webp|gif`
- [ ] Tên file: `${userId}/${nanoid()}.${ext}` để tránh collision
- [ ] Sau upload, client gửi URL về server khi submit post

## 2.6 Like + Comment + Reply thread

- [ ] Server action `toggleLike(postId)`:
  - MongoDB transaction: insert/delete `Like` doc + `$inc` `post.likesCount`
  - Trả về `{ liked: boolean, likesCount: number }`
- [ ] Optimistic UI: icon đỏ + count +1 ngay, rollback nếu lỗi
- [ ] Server action `createComment(postId, content)` với validation
- [ ] Trang `/post/[id]`: hiển thị post gốc lớn + cột replies bên dưới (giống Threads)
- [ ] Reply thread: dùng Post với `parent` field — reply cũng là 1 Post riêng (reusable `PostCard`)
- [ ] Nested reply tối đa 3 level, sau đó hiển thị "Xem thread đầy đủ →"

## 2.7 Profile `/@username`

- [ ] Dynamic route `app/(main)/[username]/page.tsx` (param bắt đầu `@` — dùng regex hoặc strip client-side)
- [ ] Header profile: banner, avatar lớn, displayName, handle, bio, counts (posts/followers/following)
- [ ] Nút Follow/Unfollow (server action, optimistic)
- [ ] Tabs: "Bài đăng" | "Phản hồi" | "Đã thích" (dùng shadcn `Tabs`)
- [ ] Feed dạng `PostCard` lọc theo `author = user._id`
- [ ] Trang Settings `/settings/profile` để sửa displayName/bio/avatar

## 2.8 Follow system

- [ ] Server action `toggleFollow(targetUserId)`:
  - Update `User.following` + `User.followers` (2 document) trong transaction
  - Không cho follow chính mình
- [ ] Feed cá nhân hoá (optional, phase này để default = all posts): `/following` chỉ hiện post của người đang follow

## 2.9 Notifications (basic)

- [ ] Model `Notification` (id, recipient, type: LIKE|COMMENT|FOLLOW, actor, postRef, read)
- [ ] Tạo notification khi like/comment/follow
- [ ] Trang `/activity`: list notification, click → đến post/profile
- [ ] Badge số đỏ trên icon Activity khi có unread

---

## Definition of Done

- [x] Đăng bài (text + ảnh + link preview) hoạt động end-to-end.
- [x] Feed infinite scroll mượt, không duplicate khi scroll.
- [x] Like/unlike có optimistic update, count đúng khi refresh.
- [x] Reply thread hiển thị đúng quan hệ parent-child.
- [x] Profile `/@username` render đúng post của user.
- [x] Upload ảnh trực tiếp từ client lên R2 (server không relay).
- [x] Ảnh hiển thị qua CDN (R2 public URL).
- [x] Không có N+1 query khi render feed (check bằng log Mongoose `mongoose.set('debug', true)`).

## API endpoints mới

```
POST /api/og-scrape        → scrape open graph
POST /api/upload/presign   → presigned URL R2
GET  /api/posts?cursor=... → feed pagination
POST /api/posts            → create post (hoặc server action)
POST /api/posts/[id]/like
POST /api/posts/[id]/comments
GET  /api/users/[username]
POST /api/users/[id]/follow
```

## Rủi ro / ghi chú

- **Feed performance**: luôn dùng `.lean()` khi render list để bỏ overhead Mongoose document. Populate chỉ field cần (`populate('author', 'username displayName avatarUrl')`).
- **Like count drift**: nếu bỏ transaction → count có thể lệch. Giải pháp: cron hằng đêm recount từ collection `Like`.
- **OG scrape timeout**: set timeout 5s, fallback không preview nếu lỗi.
- **Upload abuse**: rate limit 20 upload/giờ/user ở phase 5.
