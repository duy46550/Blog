"use client";

import { useState, useEffect, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLikeAnon } from "@/app/actions/post";

function getLikedPosts(): Set<string> {
  try {
    const raw = localStorage.getItem("liked_posts");
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function setLikedPost(postId: string, liked: boolean) {
  const set = getLikedPosts();
  if (liked) set.add(postId);
  else set.delete(postId);
  localStorage.setItem("liked_posts", JSON.stringify([...set]));
}

type Props = {
  postId: string;
  initialCount: number;
};

export function LikeButton({ postId, initialCount }: Props) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLiked(getLikedPosts().has(postId));
  }, [postId]);

  function onClick() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setLikedPost(postId, nextLiked);

    startTransition(async () => {
      const res = await toggleLikeAnon(postId, nextLiked);
      if ("likesCount" in res) {
        setCount(res.likesCount);
      } else {
        // rollback
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
        setLikedPost(postId, !nextLiked);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={liked}
      className={cn(
        "flex items-center gap-1 transition-colors",
        liked ? "text-rose-500" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className={cn("size-5", liked && "fill-current")} />
      {count > 0 ? <span className="text-sm">{count}</span> : null}
    </button>
  );
}
