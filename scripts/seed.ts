/**
 * Seed dữ liệu mẫu.
 * Chạy: pnpm db:seed
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local thủ công (tsx không tự load như Next.js).
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const { connectDB, mongoose } = await import("../lib/db");
const { User } = await import("../models/User");
const { Post } = await import("../models/Post");
const { AIAgent } = await import("../models/AIAgent");

async function main() {
  await connectDB();
  console.log("✓ Connected to MongoDB");

  // Idempotent — xoá dữ liệu seed cũ
  await Promise.all([
    User.deleteMany({ email: { $regex: /@seed\.local$/ } }),
    Post.deleteMany({ tags: "seed" }),
    AIAgent.deleteMany({ name: { $regex: /^\[seed\]/ } }),
  ]);
  console.log("✓ Cleared previous seed data");

  const users = await User.create([
    {
      email: "admin@seed.local",
      username: "admin",
      displayName: "Admin",
      role: "ADMIN",
      bio: "Site admin",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
    {
      email: "phucduy@seed.local",
      username: "phucduy",
      displayName: "Phúc Duy",
      role: "AUTHOR",
      bio: "Người viết tin tức công nghệ",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=phucduy",
    },
    {
      email: "linh@seed.local",
      username: "linhnews",
      displayName: "Linh",
      role: "AUTHOR",
      bio: "Tin thị trường",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=linh",
    },
  ]);
  const [admin, author1, author2] = users;
  if (!admin || !author1 || !author2) throw new Error("User seed failed");
  console.log(`✓ Created 3 users (admin=${admin._id})`);

  const posts = await Post.create([
    {
      author: author1._id,
      content:
        "Chào buổi sáng! Thời tiết hôm nay mát mẻ, thích hợp viết code nhỉ ☀️\nMình vừa thử Claude Opus 4.7 với 1M context — ấn tượng thật.",
      tags: ["seed", "daily"],
    },
    {
      author: author2._id,
      content:
        "Tin nóng: Bitcoin vượt mốc $120k sau tuyên bố của Fed. Thị trường crypto sôi động trở lại sau 6 tháng đi ngang.",
      tags: ["seed", "crypto", "finance"],
    },
    {
      author: author1._id,
      content:
        "Next.js 15 chính thức support React 19 với Server Actions ổn định hơn nhiều.\nMình đã migrate xong blog cá nhân, không gặp breaking nào lớn.",
      tags: ["seed", "tech", "nextjs"],
      linkPreview: {
        url: "https://nextjs.org/blog/next-15",
        title: "Next.js 15",
        description: "React 19 · Turbopack · Async Request APIs",
        image: "https://nextjs.org/api/og",
        domain: "nextjs.org",
      },
    },
    {
      author: author2._id,
      content: "Giá vàng SJC hôm nay 85 triệu/lượng, tăng 500k so với hôm qua.",
      tags: ["seed", "finance"],
    },
    {
      author: admin._id,
      content: "Welcome to Blog 🎉 Đây là bài test đầu tiên từ admin.",
      tags: ["seed", "welcome"],
    },
  ]);
  console.log(`✓ Created ${posts.length} posts`);

  const welcomePost = posts[posts.length - 1];
  if (welcomePost) {
    await Post.create({
      author: author2._id,
      content: "Chúc mừng admin! Mong hệ thống AI agent sớm hoạt động 🚀",
      parent: welcomePost._id,
      tags: ["seed"],
    });
    await Post.updateOne({ _id: welcomePost._id }, { $inc: { repliesCount: 1 } });
    console.log("✓ Created 1 reply");
  }

  for (const user of [admin, author1, author2]) {
    const count = await Post.countDocuments({ author: user._id, parent: null });
    await User.updateOne({ _id: user._id }, { $set: { postsCount: count } });
  }

  await AIAgent.create({
    name: "[seed] Tech News VN",
    topic: "Công nghệ",
    sources: ["https://vnexpress.net/rss/so-hoa.rss"],
    schedule: "0 */6 * * *",
    prompt:
      "Bạn là biên tập viên Threads về công nghệ cho độc giả VN. Viết 2–3 đoạn ngắn gọn, tone gần gũi, thêm hook mở đầu.",
    model: "claude-sonnet-4-6",
    autoPublish: false,
    active: false,
    owner: admin._id,
  });
  console.log("✓ Created 1 inactive AI agent");

  await mongoose.disconnect();
  console.log("\n✅ Seed done. Sample users:");
  console.log("   - admin@seed.local (role=ADMIN)");
  console.log("   - phucduy@seed.local (role=AUTHOR)");
  console.log("   - linh@seed.local (role=AUTHOR)");
  console.log("\nNote: login qua Google/magic link tạo user mới. Seed users chỉ để render feed demo.");
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
