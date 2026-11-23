import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ClockCounterClockwiseIcon as History } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { DiamondsFourIcon as Shapes } from "@phosphor-icons/react/dist/ssr/DiamondsFour";
import { exigirSesion } from "@/auth/session";
import { listarCategorias } from "@/services/categorias";
import { listarProductos } from "@/services/productos";
import type { Query } from "@/services/comun";
import { filtro, filtrosPagina } from "@/lib/page-data";
import { pesos } from "@/lib/format";
import { Campo, Selector } from "@/components/fields";
import { Encabezado, Filtros, Paginador, Panel, Pestanas, Tabla, enlaceTabla } from "@/components/shared";
import { EditorProducto } from "@/components/productos-forms";
import { StockDialog } from "@/components/stock-dialog";
import { SelectorProductos } from "@/components/selector-productos";
import { SelectorCategoriasProductos } from "@/components/selector-categorias-productos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Productos" };

export default async function Productos({ searchParams }: { searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = filtrosPagina(await searchParams);
  const existencias = query.tab === "existencias";
  const catalogo = query.tab === "catalogo";
  const seleccionar = !catalogo && !existencias;
  const esAdmin = usuario.rol === "admin";
  const categorias = await listarCategorias(usuario, {});
  const categoriaActual = seleccionar ? categorias.find(c => String(c.id) === filtro(query, "categoriaId")) : undefined;
  const productos = !seleccionar || categoriaActual
    ? await listarProductos(usuario, seleccionar ? { pageSize: "6", ...query } : query)
    : null;
  const filtrosFijos: Record<string, string> | undefined = categoriaActual
    ? { categoriaId: String(categoriaActual.id) }
    : !seleccionar ? { tab: existencias ? "existencias" : "catalogo" } : undefined;
  return <>
    <Encabezado titulo="Productos" descripcion="Catálogo, precios y existencias de la joyería."
      visual={!existencias && <div className={"group relative h-16 w-full shrink-0 overflow-hidden border border-primary/20 bg-muted md:h-20 md:w-[135px] xl:w-[166px]" + (seleccionar ? " hidden md:block" : "")}>
        <Image src="/fotos/catalogo.webp" alt="Aros dorados sobre un estuche claro" fill sizes="(min-width: 1280px) 166px, (min-width: 768px) 135px, 100vw"
          className="object-cover object-[center_55%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.035]" />
      </div>}
      acciones={<>
      <Button asChild variant="outline"><Link href="/productos/movimientos"><History aria-hidden /> Historial</Link></Button>
      <Button asChild variant="outline"><Link href="/productos/categorias"><Shapes aria-hidden /> {esAdmin ? "Administrar categorías" : "Ver categorías"}</Link></Button>
      {esAdmin && <><StockDialog puedeEditar categorias={categorias} /><EditorProducto categorias={categorias} /></>}
    </>} />
    <Pestanas items={[
      { href: "/productos", nombre: "Seleccionar productos", activo: seleccionar },
      { href: "/productos?tab=catalogo", nombre: "Catálogo", activo: catalogo },
      { href: "/productos?tab=existencias", nombre: "Existencias", activo: existencias },
    ]} />
    {!productos ? <SelectorCategoriasProductos categorias={categorias} /> :
    <Panel listado key={productos.page + JSON.stringify(query)}
      titulo={categoriaActual?.nombre}
      detalle={categoriaActual ? "Seleccioná una pieza para consultar o gestionar su stock." : undefined}
      acciones={categoriaActual && <Button asChild variant="outline" size="sm">
        <Link href="/productos"><ArrowLeftIcon aria-hidden /> Volver a categorías</Link>
      </Button>}>
      <Filtros ruta="/productos" conservar={filtrosFijos}>
        <Campo label="Buscar" type="search" name="q" defaultValue={filtro(query, "q")} placeholder="Código o descripción" className="w-full sm:w-52" />
        {!seleccionar && <Selector label="Categoría" name="categoriaId" defaultValue={filtro(query, "categoriaId") ?? ""}>
          <option value="">Todas</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Selector>}
        <Selector label="Existencias" name="bajoMinimo" defaultValue={filtro(query, "bajoMinimo") ?? ""}>
          <option value="">Todas</option><option value="true">Bajo mínimo</option><option value="false">En mínimo o más</option>
        </Selector>
        {esAdmin && <Selector label="Estado" name="activo" defaultValue={filtro(query, "activo") ?? "true"}><option value="true">Activos</option><option value="false">Inactivos</option><option value="todos">Todos</option></Selector>}
      </Filtros>
      {seleccionar ? <SelectorProductos data={productos.data} categorias={categorias} puedeEditar={esAdmin} /> : <Tabla columnas={["Producto", "Código", "Categoría", "Precio", "Existencia", ...(existencias ? ["Stock mínimo"] : [])]} vacia={!productos.data.length}>
        {productos.data.map(p => <tr key={p.id}>
          <td className="min-w-44">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Link href={"/productos/" + p.id} className={enlaceTabla}>{p.descripcion}</Link>
              <StockDialog producto={p} puedeEditar={esAdmin} categorias={categorias} />
            </div>
            {!p.activo && <span className="block text-xs text-muted-foreground">Inactivo</span>}
          </td>
          <td className="font-mono text-xs whitespace-nowrap text-muted-foreground">{p.codigo}</td><td>{p.categoria.nombre}</td>
          <td className="whitespace-nowrap tabular-nums">{pesos(p.precio)}</td>
          <td><Badge tone={p.bajoMinimo ? "amber" : "neutral"}>{p.existencia}{p.bajoMinimo ? " · Bajo mínimo" : ""}</Badge></td>
          {existencias && <td>{p.stockMinimo}</td>}
        </tr>)}
      </Tabla>}
      <Paginador data={productos} query={query} ruta="/productos" />
    </Panel>}
  </>;
}
