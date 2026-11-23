export default function Loading() {
  return <div role="status" className="grid gap-4 animate-pulse">
    <span className="sr-only">Cargando información…</span>
    <div className="h-11 w-52 rounded-lg bg-muted" />
    <div className="h-56 rounded-xl border border-border bg-muted/70" />
  </div>;
}
