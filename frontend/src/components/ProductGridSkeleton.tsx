export default function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex w-full animate-pulse flex-col">
          <div className="aspect-square w-full rounded-2xl bg-card" />
          <div className="mt-4 flex flex-col gap-2 px-1">
            <div className="h-2.5 w-16 rounded-full bg-card" />
            <div className="h-3.5 w-32 rounded-full bg-card" />
            <div className="mt-1 h-3 w-20 rounded-full bg-card" />
          </div>
        </div>
      ))}
    </div>
  );
}
