export default function FormSubmissionsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="h-4 w-48 animate-pulse rounded bg-slate-700/30" />
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded bg-slate-700/30" />
        <div className="h-4 w-24 animate-pulse rounded bg-slate-700/30" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-slate-800/40"
          />
        ))}
      </div>
    </div>
  )
}
