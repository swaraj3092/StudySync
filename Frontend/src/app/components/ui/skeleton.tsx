import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseCls = "animate-pulse bg-slate-200/10 dark:bg-slate-800/40";
  const variantCls = 
    variant === 'circle' ? 'rounded-full' : 
    variant === 'text' ? 'rounded h-4 w-full' : 'rounded-xl';

  return (
    <div className={`${baseCls} ${variantCls} ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 border border-border bg-card/50 rounded-2xl space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-2/4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
