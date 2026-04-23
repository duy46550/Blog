import { Skeleton } from "@/components/ui/skeleton";

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ol className="flex flex-col divide-y divide-border/50">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex gap-3 py-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </li>
      ))}
    </ol>
  );
}
