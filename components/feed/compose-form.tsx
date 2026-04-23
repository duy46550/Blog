"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost } from "@/app/actions/post";
import { MediaGrid } from "./media-grid";
import { LinkPreviewCard } from "./link-preview-card";
import type { SerializedLinkPreview } from "@/lib/serialize";

const MAX = 500;
const MAX_IMAGES = 4;
const URL_RE = /https?:\/\/[^\s<>"]+/;

type Props = {
  parent?: string | null;
  placeholder?: string;
  submitLabel?: string;
  onDone?: () => void;
  autoFocus?: boolean;
};

export function ComposeForm({
  parent = null,
  placeholder = "Có gì mới?",
  submitLabel = "Đăng",
  onDone,
  autoFocus,
}: Props) {
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [linkPreview, setLinkPreview] = useState<SerializedLinkPreview | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrapedUrlRef = useRef<string | null>(null);
  const dismissedUrlRef = useRef<string | null>(null);

  const remaining = MAX - content.length;
  const disabled =
    content.trim().length === 0 || remaining < 0 || isPending || uploadingImages;

  useEffect(() => {
    const match = content.match(URL_RE);
    const url = match?.[0] ?? null;
    if (!url) {
      if (linkPreview) setLinkPreview(null);
      lastScrapedUrlRef.current = null;
      return;
    }
    if (url === lastScrapedUrlRef.current) return;
    if (url === dismissedUrlRef.current) return;
    lastScrapedUrlRef.current = url;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setScrapingUrl(true);
      fetch("/api/og-scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: SerializedLinkPreview | null) => {
          if (data) setLinkPreview(data);
        })
        .catch(() => {})
        .finally(() => setScrapingUrl(false));
    }, 600);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [content, linkPreview]);

  async function uploadFiles(files: File[]) {
    const room = MAX_IMAGES - mediaUrls.length;
    if (room <= 0) return;
    const trimmed = files.slice(0, room);
    const form = new FormData();
    for (const f of trimmed) form.append("files", f);
    setUploadingImages(true);
    setError(null);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload thất bại");
      setMediaUrls((prev) => [...prev, ...(data.urls as string[])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload thất bại");
    } finally {
      setUploadingImages(false);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files: File[] = [];
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f && f.type.startsWith("image/")) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      void uploadFiles(files);
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createPost({
        content,
        parent,
        mediaUrls,
        linkPreview,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setContent("");
      setMediaUrls([]);
      setLinkPreview(null);
      if (onDone) onDone();
      else router.push(parent ? `/post/${parent}` : "/");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={onPaste}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={4}
        className="w-full resize-none rounded-xl border border-border bg-background p-3 text-[15px] leading-relaxed outline-none focus:border-foreground/30"
      />

      {mediaUrls.length > 0 ? (
        <MediaGrid
          urls={mediaUrls}
          onRemove={(i) => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
        />
      ) : null}

      {linkPreview ? (
        <LinkPreviewCard
          preview={linkPreview}
          onRemove={() => {
            dismissedUrlRef.current = linkPreview.url;
            setLinkPreview(null);
          }}
        />
      ) : scrapingUrl ? (
        <p className="text-xs text-muted-foreground">Đang tải preview…</p>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Đính kèm ảnh"
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaUrls.length >= MAX_IMAGES || uploadingImages}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <ImagePlus className="size-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length > 0) void uploadFiles(files);
            }}
          />
          {uploadingImages ? (
            <span className="text-xs text-muted-foreground">Đang tải ảnh…</span>
          ) : null}
          <span
            className={
              remaining < 0
                ? "text-sm text-rose-500"
                : remaining < 50
                  ? "text-sm text-amber-500"
                  : "text-sm text-muted-foreground"
            }
          >
            {remaining}
          </span>
        </div>
        <Button type="button" onClick={submit} disabled={disabled}>
          {isPending ? "Đang đăng…" : submitLabel}
        </Button>
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
