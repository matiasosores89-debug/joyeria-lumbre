import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { IconoDeCategoria } from "./icono-categoria";
import type { CategoriaProducto } from "./productos-forms";
import { Panel, Vacio } from "./shared";

export function SelectorCategoriasProductos({ categorias }: { categorias: CategoriaProducto[] }) {
  return <Panel listado titulo="Elegí una categoría">
    {categorias.length === 0 ? <Vacio mensaje="Todavía no hay categorías activas." /> :
      <ul data-selector-productos aria-label="Categorías de productos"
        className="grid min-w-0 content-start gap-2.5 border-t border-border bg-muted/35 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {categorias.map(categoria => <li key={categoria.id} className="min-w-0">
            <Link href={"/productos?categoriaId=" + categoria.id}
              aria-label={"Ver productos de " + categoria.nombre}
              className="group grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-sm border border-border bg-card px-3.5 py-3 text-wine motion-safe:transition-colors hover:border-primary/45 hover:bg-background sm:px-4 sm:py-4">
              <span className="grid size-10 place-items-center rounded-sm border border-primary/15 bg-rose-paper/60 text-primary">
                <IconoDeCategoria icono={categoria.icono} nombre={categoria.nombre} />
              </span>
              <span className="min-w-0">
                <strong className="block font-display text-xl leading-tight font-medium tracking-tight [overflow-wrap:anywhere]">{categoria.nombre}</strong>
                <span className="mt-0.5 block text-xs font-medium text-muted-foreground group-hover:text-primary">Ver productos</span>
              </span>
              <ArrowRightIcon size={18} className="text-primary" aria-hidden />
            </Link>
          </li>)}
      </ul>}
  </Panel>;
}
