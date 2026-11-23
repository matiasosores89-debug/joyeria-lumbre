import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr/Package";
import type { obtenerProducto } from "@/services/productos";
import type { CategoriaProducto } from "./productos-forms";
import { Vacio } from "./shared";
import { StockDialog } from "./stock-dialog";
import { Badge } from "./ui/badge";

type Producto = Awaited<ReturnType<typeof obtenerProducto>>;

export function SelectorProductos({ data, categorias, puedeEditar }: {
  data: Producto[]; categorias: CategoriaProducto[]; puedeEditar: boolean;
}) {
  if (!data.length) return <Vacio mensaje="No encontramos productos." detalle="Probá con otro nombre o código, o cambiá los filtros." />;

  return <ul data-selector-productos aria-label="Productos para seleccionar"
    className="grid min-w-0 content-start gap-2.5 bg-muted/35 p-3 sm:grid-cols-2 xl:grid-cols-3">
    {data.map(producto => {
      const sinStock = producto.existencia === 0;
      const tono = sinStock ? "red" : producto.bajoMinimo ? "amber" : "neutral";
      const stock = producto.existencia + (producto.bajoMinimo ? " u. · Bajo mínimo" : producto.existencia === 1 ? " disponible" : " disponibles");

      return <li key={producto.id} className="min-w-0">
        <StockDialog producto={producto} puedeEditar={puedeEditar} categorias={categorias}
          disparador={<button type="button" aria-label={"Seleccionar " + producto.descripcion + ", " + producto.codigo}
            className="group grid h-full w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5 rounded-sm border border-border bg-card px-3 py-2.5 text-left text-foreground motion-safe:transition-colors hover:border-primary/45 hover:bg-background">
            <span className="grid size-8 place-items-center rounded-sm border border-primary/15 bg-rose-paper/55 text-primary">
              <PackageIcon size={17} weight="duotone" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-mono">{producto.codigo}</span>
                <span>{producto.categoria.nombre}</span>
                {!producto.activo && <Badge>Inactivo</Badge>}
              </span>
              <strong className="block text-sm leading-snug [overflow-wrap:anywhere]">{producto.descripcion}</strong>
              <span className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                <Badge tone={tono}>{sinStock ? "Sin stock" : stock}</Badge>
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                  Seleccionar <ArrowRightIcon size={13} aria-hidden />
                </span>
              </span>
            </span>
          </button>} />
      </li>;
    })}
  </ul>;
}
