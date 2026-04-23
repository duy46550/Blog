"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PostCard } from "./post-card";
import { FeedSkeleton } from "./feed-skeleton";
import type { SerializedPost } from "@/lib/serialize";

type Props = {
  initialPosts: SerializedPost[];
  initialCursor: string | null;
  canInteract: boolean;
  scope?: "home" | "following";
};

export function Feed({ initialPosts, initialCursor, canInteract, scope = "home" }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialCursor === null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || done || !cursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor });
      if (scope !== "home") params.set("scope", scope);
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { posts: SerializedPost[]; nextCursor: string | null };
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const fresh = data.posts.filter((p) => !seen.has(p._id));
        return [...prev, ...fresh];
      });
      setCursor(data.nextCursor);
      if (!data.nextCursor) setDone(true);
    } catch (err) {
      console.error("load more failed", err);
    } finally {
      setLoading(false);
    }
  }, [loading, done, cursor, scope]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-2 text-lg font-medium">Chưa có bài nào</p>
        <p className="text-sm text-muted-foreground">
          Hãy là người đầu tiên đăng bài.
        </p>
      </div>
    );
  }

  return (
    <>
      <ol className="flex flex-col divide-y divide-border/50">
        {posts.map((post) => (
          <li key={post._id}>
            <PostCard post={post} canInteract={canInteract} />
          </li>
        ))}
      </ol>
      <div ref={sentinelRef} className="h-10" />
      {loading ? <FeedSkeleton /> : null}
      {done && posts.length > 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Đã hết bài.</p>
      ) : null}
    </>
  );
}
