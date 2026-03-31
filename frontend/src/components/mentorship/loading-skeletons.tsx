import { Skeleton } from '@/components/ui/skeleton';

export function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-3 h-3 rounded-full" />
          </div>
          <Skeleton className="w-20 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-28 h-7" />
          <Skeleton className="w-7 h-7" />
          <Skeleton className="w-7 h-7" />
          <Skeleton className="w-7 h-7" />
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 p-4 space-y-2">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-8 h-5 shrink-0" />
            <Skeleton className={`h-5 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-1/2'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full p-3 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`flex gap-2 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
          <div className={`space-y-1 ${i % 2 === 1 ? 'items-end' : 'items-start'}`}>
            <Skeleton className="w-20 h-3" />
            <Skeleton className={`h-8 ${i % 2 === 0 ? 'w-40' : 'w-32'}`} />
          </div>
        </div>
      ))}
      <div className="mt-auto pt-3 border-t border-border">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-9" />
          <Skeleton className="w-9 h-9" />
        </div>
      </div>
    </div>
  );
}

export function VideoSkeleton() {
  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex-1 grid grid-rows-2 gap-3">
        <Skeleton className="rounded-lg" />
        <Skeleton className="rounded-lg" />
      </div>
      <div className="flex justify-center gap-3 mt-3 pt-3 border-t border-border">
        <Skeleton className="w-10 h-10 rounded-md" />
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>
    </div>
  );
}

export function SessionSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-20 h-3" />
        <div className="space-y-2">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>
    </div>
  );
}
