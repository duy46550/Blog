"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageCircle, Repeat2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from "./like-button";
import { MediaGrid } from "./media-grid";
import { LinkPreviewCard } from "./link-preview-card";
import { cn } from "@/lib/utils";
import type { SerializedPost } from "@/lib/serialize";

const COLLAPSE_LIMIT = 280;

type Props = {
  post: SerializedPost;
  replyingTo?: string | null;
  hrefDetail?: string;
};

export function PostCard({ post, replyingTo, hrefDetail }: Props) {
  const { author, content } = post;
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > COLLAPSE_LIMIT;
  const shown = !isLong || expanded ? content : content.slice(0, COLLAPSE_LIMIT) + "…";

  const initial = (author.displayName || author.username || "?").slice(0, 1).toUpperCase();
  const time = formatDistanceToNowStrict(new Date(post.createdAt), {
    locale: vi,
    addSuffix: false,
  });
  const detailHref = hrefDetail ?? `/post/${post._id}`;
  const profileHref = author.username ? `/@${author.username}` : "#";

  return (
    <article className="flex gap-3 py-4" suppressHydrationWarning>
      <Link href={profileHref} aria-label={author.displayName}>
        <Avatar className="size-10 shrink-0">
          {author.image ? <AvatarImage src={author.image} alt="" /> : null}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col" suppressHydrationWarning>
        <header className="flex items-baseline gap-2">
          <Link href={profileHref} className="truncate text-sm font-semibold hover:underline">
            {author.displayName}
          </Link>
          {author.username ? (
            <Link
              href={profileHref}
              className="truncate text-sm text-muted-foreground hover:underline"
            >
              @{author.username}
            </Link>
          ) : null}
          <span className="text-sm text-muted-foreground">· {time}</span>
        </header>

        {replyingTo ? (
          <p className="text-xs text-muted-foreground">
            Đang trả lời{" "}
            <Link href={`/@${replyingTo}`} className="hover:underline">
              @{replyingTo}
            </Link>
          </p>
        ) : null}

        <Link href={detailHref} className="block">
          <p
            className={cn(
              "mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed",
            )}
          >
            {shown}
          </p>
        </Link>

        {isLong ? (
          <button
            type="button"
            className="mt-1 self-start text-sm text-muted-foreground hover:underline"
            onClick={(e) => {
              e.preventDefault();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </button>
        ) : null}

        {post.mediaUrls.length > 0 ? <MediaGrid urls={post.mediaUrls} /> : null}

        {post.linkPreview ? (
          <div className="mt-3">
            <LinkPreviewCard preview={post.linkPreview} />
          </div>
        ) : null}

        <footer className="mt-3 flex items-center gap-4 text-muted-foreground">
          <LikeButton
            postId={post._id}
            initialCount={post.likesCount}
          />
          <Link
            href={detailHref}
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-5" />
            {post.repliesCount > 0 ? (
              <span className="text-sm">{post.repliesCount}</span>
            ) : null}
          </Link>
          <button type="button" className="transition-colors hover:text-foreground" aria-label="Repost">
            <Repeat2 className="size-5" />
          </button>
          <button type="button" className="transition-colors hover:text-foreground" aria-label="Chia sẻ">
            <Send className="size-5" />
          </button>
        </footer>
      </div>
    </article>
  );
}
