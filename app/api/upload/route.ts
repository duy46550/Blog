import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentUser } from "@/lib/auth-helpers";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > 4) return NextResponse.json({ error: "Tối đa 4 ảnh" }, { status: 400 });

  const urls: string[] = [];
  const uploadDir = join(process.cwd(), "public", "uploads", String(user._id));
  await mkdir(uploadDir, { recursive: true });

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: `Định dạng không hỗ trợ: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Ảnh vượt quá 5MB` }, { status: 400 });
    }
    const ext = EXT[file.type] ?? "bin";
    const name = `${randomBytes(8).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, name), buf);
    urls.push(`/uploads/${String(user._id)}/${name}`);
  }

  return NextResponse.json({ urls });
}
