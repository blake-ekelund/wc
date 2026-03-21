"use client";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className || ""}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Shimmer className="h-6 w-40 mb-2" />
          <Shimmer className="h-4 w-64" />
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4">
            <Shimmer className="h-4 w-20 mb-3" />
            <Shimmer className="h-8 w-24 mb-2" />
            <Shimmer className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="bg-white rounded-xl border border-border p-6">
        <Shimmer className="h-5 w-32 mb-4" />
        <Shimmer className="h-48 w-full" />
      </div>
    </div>
  );
}

export function ContactListSkeleton() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <Shimmer className="h-6 w-32" />
        <Shimmer className="h-9 w-28 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
            <Shimmer className="w-9 h-9 rounded-full" />
            <div className="flex-1">
              <Shimmer className="h-4 w-32 mb-1.5" />
              <Shimmer className="h-3 w-24" />
            </div>
            <Shimmer className="h-5 w-16 rounded-full hidden sm:block" />
            <Shimmer className="h-4 w-20 hidden md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PipelineSkeleton() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Shimmer className="h-6 w-36 mb-2" />
          <Shimmer className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-3">
            <Shimmer className="h-5 w-20 mb-2 rounded-full" />
            <Shimmer className="h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
            <Shimmer className="w-8 h-8 rounded-full hidden sm:block" />
            <div className="flex-1">
              <Shimmer className="h-4 w-28 mb-1" />
              <Shimmer className="h-3 w-20" />
            </div>
            <Shimmer className="h-5 w-16 rounded-full" />
            <Shimmer className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
