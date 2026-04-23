"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PostRow {
  _id: string;
  title: string | null;
  content: string;
  status: string;
  aiGenerated: boolean;
  tags: string[];
  createdAt: string | null;
  author: { displayName: string; username: string | null } | null;
}

const FILTER_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "ai", label: "AI" },
  { value: "draft", label: "Draft" },
];

export function PostsClient({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState("");

  const filtered = filter === "ai"
    ? posts.filter((p) => p.aiGenerated)
    : filter === "draft"
    ? posts.filter((p) => p.status === "DRAFT")
    : posts;

  async function handleStatus(id: string, status: string) {
    const res = await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, status } : p)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoá bài đăng này?")) return;
    const res = await fetch("/api/admin/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={filter === opt.value ? "default" : "outline"}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col divide-y rounded-xl border overflow-hidden">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Không có bài nào.</p>
        )}
        {filtered.map((p) => (
          <div key={p._id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>{p.status}</Badge>
                {p.aiGenerated && <Badge variant="outline">AI</Badge>}
                {p.tags.slice(0, 2).map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
              {p.title && <p className="mt-1 font-medium text-sm">{p.title}</p>}
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{p.content}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {p.author?.displayName ?? "unknown"} ·{" "}
                {p.createdAt ? new Date(p.createdAt).toLocaleDateString("vi-VN") : "—"}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {p.status !== "PUBLISHED" && (
                <Button size="sm" variant="outline" onClick={() => handleStatus(p._id, "PUBLISHED")}>
                  Publish
                </Button>
              )}
              {p.status !== "DRAFT" && (
                <Button size="sm" variant="outline" onClick={() => handleStatus(p._id, "DRAFT")}>
                  Draft
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => handleDelete(p._id)}>
                Xoá
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
