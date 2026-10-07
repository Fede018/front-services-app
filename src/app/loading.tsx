export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="h-12 w-48 animate-pulse rounded-md bg-surface-raised" />
      <div className="mt-4 h-5 w-72 max-w-full animate-pulse rounded-md bg-surface" />
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    </main>
  );
}
