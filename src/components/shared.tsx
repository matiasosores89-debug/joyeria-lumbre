import Link from "next/link";
import { CaretLeftIcon as ChevronLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon as ChevronRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { TrayIcon as Inbox } from "@phosphor-icons/react/dist/ssr/Tray";
import type { ReactNode } from "react";
import type { Query } from "@/services/comun";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

export function Encabezado({ titulo, descripcion, acciones, volver, visual }: { titulo: string; descripcion?: string; acciones?: ReactNode; volver?: { href: string; label: string }; visual?: ReactNode }) {
  return <div className={cn("no-print mb-7 flex min-w-0 flex-wrap gap-5 border-b border-primary/30 pb-6", visual && "md:flex-nowrap md:gap-7")}>
    <div className="min-w-0 grow">
      {volver && <Link href={volver.href} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ChevronLeft size={16} aria-hidden /> {volver.label}</Link>}
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2.6rem,5.2vw,5rem)] leading-[.98] font-medium tracking-[-.062em] text-wine [overflow-wrap:anywhere]">{titulo}</h1>
          {descripcion && <p className="mt-3 max-w-prose text-[.95rem] text-muted-foreground">{descripcion}</p>}
        </div>
        {acciones && <div className="flex min-w-0 flex-wrap items-center gap-2">{acciones}</div>}
      </div>
    </div>
    {visual}
  </div>;
}

export function Panel({ titulo, detalle, acciones, children, className }: { titulo?: string; detalle?: string; acciones?: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={cn("min-w-0 overflow-hidden", className)}>
    {titulo && <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
      <div><h2 className="font-display text-[1.65rem] leading-tight font-medium tracking-[-.04em] text-wine sm:text-[1.9rem]">{titulo}</h2>{detalle && <p className="mt-1 text-sm text-muted-foreground">{detalle}</p>}</div>{acciones}
    </div>}
    {children}
  </Card>;
}

export function Vacio({ mensaje = "No hay resultados.", detalle }: { mensaje?: string; detalle?: string }) {
  return <div className="grid justify-items-center gap-2 px-4 py-12 text-center">
    <Inbox size={21} className="text-muted-foreground" aria-hidden /><p className="text-sm font-semibold">{mensaje}</p>
    {detalle && <p className="text-sm text-muted-foreground">{detalle}</p>}
  </div>;
}

export function Tabla({ columnas, children, vacia, mensaje, className }: { columnas: string[]; children: ReactNode; vacia?: boolean; mensaje?: string; className?: string }) {
  if (vacia) return <Vacio mensaje={mensaje} />;
  return <div className="relative overflow-x-auto"><table className={cn("w-full text-left text-sm", className)}>
    <thead className="border-y border-border bg-muted/72 text-xs text-primary"><tr>{columnas.map((c, i) => <th key={i} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">{c || <span className="sr-only">Acciones</span>}</th>)}</tr></thead>
    <tbody className="divide-y divide-border [&>tr:hover]:bg-muted/30 [&>tr>td]:px-4 [&>tr>td]:py-3.5">{children}</tbody>
  </table></div>;
}

export function Paginador({ data, query, ruta }: { data: { page: number; pageSize: number; total: number }; query: Query; ruta: string }) {
  const paginas = Math.max(1, Math.ceil(data.total / data.pageSize));
  function url(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (typeof value === "string" && value) params.set(key, value);
    params.set("page", String(page));
    return ruta + "?" + params.toString();
  }
  return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
    <span>{data.total} {data.total === 1 ? "resultado" : "resultados"} · Página {data.page} de {paginas}</span>
    <nav aria-label="Paginación" className="flex gap-2">
      {data.page > 1 && <Button asChild variant="outline" size="sm"><Link href={url(data.page - 1)}><ChevronLeft /> Anterior</Link></Button>}
      {data.page < paginas && <Button asChild variant="outline" size="sm"><Link href={url(data.page + 1)}>Siguiente <ChevronRight /></Link></Button>}
    </nav>
  </div>;
}

export function Filtros({ ruta, children, conservar }: { ruta: string; children: ReactNode; conservar?: Record<string, string> }) {
  return <form action={ruta} className="no-print flex flex-wrap items-end gap-3 border-b border-border p-4 sm:p-5">
    {Object.entries(conservar ?? {}).map(([name, value]) => <input type="hidden" key={name} name={name} value={value} />)}
    {children}
    <Button variant="outline" type="submit">Filtrar</Button>
    <Button asChild variant="ghost"><Link href={ruta + (conservar ? "?" + new URLSearchParams(conservar) : "")}>Limpiar</Link></Button>
  </form>;
}

export function Pestanas({ items }: { items: { href: string; nombre: string; activo: boolean }[] }) {
  return <nav aria-label="Vistas" className="no-print mb-5 flex gap-6 overflow-auto border-b border-border">
    {items.map(item => <Link key={item.href} href={item.href} aria-current={item.activo ? "page" : undefined}
      className={cn("shrink-0 border-b-2 px-1 pb-2.5 text-sm font-semibold", item.activo ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{item.nombre}</Link>)}
  </nav>;
}

export function EstadoFactura({ estado }: { estado: "emitida" | "anulada" }) {
  return <Badge tone={estado === "emitida" ? "green" : "red"}>{estado === "emitida" ? "Emitida" : "Anulada"}</Badge>;
}

export const enlaceTabla = "font-semibold text-primary underline-offset-4 hover:underline";
