"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/app/actions/post";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  canLike: boolean;
};

export function LikeButton({ postId, initialLiked, initialCount, canLike }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!canLike) {
      window.location.href = "/login";
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    startTransition(async () => {
      const res = await toggleLike(postId);
      if ("liked" in res) {
        setLiked(res.liked);
        setCount(res.likesCount);
      } else {
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
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
