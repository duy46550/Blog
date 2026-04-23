import type { SerializedLinkPreview } from "@/lib/serialize";

type Props = {
  preview: SerializedLinkPreview;
  onRemove?: () => void;
};

export function LinkPreviewCard({ preview, onRemove }: Props) {
  const host = preview.domain ?? safeHost(preview.url);

  const body = (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:bg-accent/30">
      {preview.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.image}
          alt=""
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="flex flex-col gap-1 p-3">
        {host ? (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{host}</span>
        ) : null}
        {preview.title ? (
          <span className="line-clamp-2 text-sm font-semibold">{preview.title}</span>
        ) : null}
        {preview.description ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">{preview.description}</span>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Bỏ link preview"
          className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur hover:bg-background"
        >
          ×
        </button>
      ) : null}
      {onRemove ? (
        body
      ) : (
        <a href={preview.url} target="_blank" rel="noreferrer noopener" className="block">
          {body}
        </a>
      )}
    </div>
  );
}

function safeHost(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
