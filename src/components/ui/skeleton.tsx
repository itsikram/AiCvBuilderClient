import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary", className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  if (children) {
    return (
      <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
        {children}
      </div>
    );
  }
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4 w-full", i === lines - 1 && "w-2/3")} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24",
  };
  return <Skeleton className={cn("rounded-full", sizes[size], className)} />;
}

export function SkeletonImage({ className }: { className?: string }) {
  return <Skeleton className={cn("w-full object-cover", className)} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2 border-b">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t" 
            style={{ height: `${Math.random() * 60 + 20}%` }} 
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonFormField({ label = true, input = true }: { label?: boolean; input?: boolean }) {
  return (
    <div className="space-y-2">
      {label && <Skeleton className="h-4 w-24" />}
      {input && <Skeleton className="h-10 w-full" />}
    </div>
  );
}

export function SkeletonButton({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizes = {
    sm: "h-8",
    default: "h-10",
    lg: "h-12",
  };
  return <Skeleton className={cn("rounded-md", sizes[size], className)} />;
}

export function SkeletonNavbar({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between p-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24" />
        <div className="hidden md:flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <SkeletonAvatar size="sm" />
      </div>
    </div>
  );
}

export function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}