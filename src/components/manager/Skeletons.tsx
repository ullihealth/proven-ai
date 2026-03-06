import { cn } from "@/lib/utils";

/** Skeleton card matching ManageCard shape */
export function SkeletonCard() {
  return (
    <div className="p-3 rounded-lg bg-[#242b35] border border-[#30363d] animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 bg-[#30363d] rounded w-3/4" />
        <div className="h-3.5 w-3.5 bg-[#30363d] rounded" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-4 bg-[#30363d] rounded w-16" />
        <div className="h-4 bg-[#30363d] rounded w-12" />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 bg-[#30363d] rounded w-12" />
        </div>
        <div className="h-5 w-5 bg-[#30363d] rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton stat card for dashboard */
export function SkeletonStatCard() {
  return (
    <div className="bg-[#242b35] rounded-lg border border-[#30363d] p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 bg-[#30363d] rounded" />
        <div>
          <div className="h-7 bg-[#30363d] rounded w-10 mb-1" />
          <div className="h-3 bg-[#30363d] rounded w-14" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton row for dashboard card list */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#242b35] border border-[#30363d] animate-pulse">
      <div className="h-4 bg-[#30363d] rounded w-16" />
      <div className="flex-1 h-4 bg-[#30363d] rounded w-full" />
      <div className="h-4 bg-[#30363d] rounded w-20" />
    </div>
  );
}

/** Skeleton column for kanban board */
export function SkeletonColumn() {
  return (
    <div className="w-72 flex-shrink-0 rounded-lg border border-[#30363d] bg-[#161b22] flex flex-col">
      <div className="px-4 py-3 border-b border-[#30363d] animate-pulse">
        <div className="h-4 bg-[#30363d] rounded w-24" />
      </div>
      <div className="p-2 space-y-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/** Typing indicator — three bouncing cyan dots */
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#242b35] border border-[#30363d] rounded-lg px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-[#00bcd4]"
            style={{
              animation: "bounce 1.4s infinite ease-in-out",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
