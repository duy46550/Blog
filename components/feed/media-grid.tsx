"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  urls: string[];
  onRemove?: (index: number) => void;
};

export function MediaGrid({ urls, onRemove }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  if (urls.length === 0) return null;
  const shown = urls.slice(0, 4);

  const cls = cn(
    "mt-3 grid gap-1 overflow-hidden rounded-2xl",
    shown.length === 1 && "grid-cols-1",
    shown.length === 2 && "grid-cols-2",
    shown.length === 3 && "grid-cols-2",
    shown.length >= 4 && "grid-cols-2",
  );

  return (
    <>
      <div className={cls}>
        {shown.map((url, i) => (
          <div
            key={url + i}
            className={cn(
              "relative aspect-square overflow-hidden bg-muted",
              shown.length === 1 && "aspect-[4/3]",
              shown.length === 3 && i === 0 && "row-span-2 aspect-auto",
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setLightboxIdx(i);
              }}
              className="block size-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" loading="lazy" />
            </button>
            {onRemove ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRemove(i);
                }}
                aria-label="Xoá ảnh"
                className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur hover:bg-background"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {lightboxIdx !== null ? (
        <Lightbox
          urls={urls}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  urls,
  startIndex,
  onClose,
}: {
  urls: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const url = urls[idx];
  if (!url) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
        if (e.key === "ArrowRight") setIdx((i) => Math.min(urls.length - 1, i + 1));
      }}
      tabIndex={-1}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        ×
      </button>
      {urls.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => Math.max(0, i - 1));
            }}
            disabled={idx === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => Math.min(urls.length - 1, i + 1));
            }}
            disabled={idx === urls.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20 disabled:opacity-30"
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}
