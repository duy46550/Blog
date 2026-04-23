"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/app/actions/user";

type Initial = {
  displayName: string;
  username: string;
  bio: string;
  image: string;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [image, setImage] = useState(initial.image);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const initial1 = (displayName || username || "?").slice(0, 1).toUpperCase();

  async function onAvatar(files: File[]) {
    if (files.length === 0) return;
    const form = new FormData();
    form.append("files", files[0] as File);
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload thất bại");
      setImage(data.urls[0] as string);
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Upload thất bại" });
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfile({ displayName, username, bio, image });
      if (!res.ok) {
        setMessage({ kind: "err", text: res.error });
        return;
      }
      setMessage({ kind: "ok", text: "Đã lưu" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          {image ? <AvatarImage src={image} alt="" /> : null}
          <AvatarFallback className="text-2xl">{initial1}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Đang tải…" : "Đổi ảnh đại diện"}
          </Button>
          {image ? (
            <button
              type="button"
              onClick={() => setImage("")}
              className="text-xs text-muted-foreground hover:underline"
            >
              Xoá ảnh
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void onAvatar(files);
            }}
          />
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Tên hiển thị
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Username
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="example"
        />
        <span className="text-xs text-muted-foreground">3–24 ký tự, chỉ a-z, 0-9, _</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Giới thiệu
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-[15px] outline-none focus:border-foreground/30"
        />
      </label>

      <div className="flex items-center justify-between">
        {message ? (
          <p className={message.kind === "ok" ? "text-sm text-emerald-500" : "text-sm text-rose-500"}>
            {message.text}
          </p>
        ) : (
          <span />
        )}
        <Button type="button" onClick={submit} disabled={isPending || uploading}>
          {isPending ? "Đang lưu…" : "Lưu"}
        </Button>
      </div>
    </div>
  );
}
