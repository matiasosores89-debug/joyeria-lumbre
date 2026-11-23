import { exigirSesion } from "@/auth/session";
import { listarCategorias } from "@/services/categorias";
import { obtenerProducto } from "@/services/productos";
import { listarStock } from "@/services/stock";
import type { Query } from "@/services/comun";
import { pesos } from "@/lib/format";
import { recurso } from "@/lib/page-data";
import { Encabezado, Paginador, Panel } from "@/components/shared";
import { EditorProducto, EstadoProducto } from "@/components/productos-forms";
import { StockDialog } from "@/components/stock-dialog";
import { TablaStock } from "@/components/stock-table";
import { Badge } from "@/components/ui/badge";

export default async function Producto({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = await searchParams;
  const producto = await recurso(params, id => obtenerProducto(usuario, id));
  const [historial, categorias] = await Promise.all([listarStock(usuario, query, producto.id), listarCategorias(usuario, {})]);
  return <>
    <Encabezado titulo={producto.descripcion} descripcion={producto.codigo + " · " + producto.categoria.nombre} volver={{ href: "/productos", label: "Productos" }}
      acciones={usuario.rol === "admin" && <><EditorProducto producto={producto} categorias={categorias} /><EstadoProducto producto={producto} /></>} />
    <Panel className="mb-5 px-5 py-4">
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Precio de venta</dt><dd className="mt-1 font-semibold">{pesos(producto.precio)}</dd></div>
        <div><dt className="text-muted-foreground">Existencia</dt><dd className="mt-1"><Badge tone={producto.bajoMinimo ? "amber" : "neutral"}>{producto.existencia}{producto.bajoMinimo ? " · Bajo mínimo" : ""}</Badge></dd></div>
        <div><dt className="text-muted-foreground">Stock mínimo</dt><dd className="mt-1 font-semibold">{producto.stockMinimo}</dd></div>
        <div><dt className="text-muted-foreground">Estado</dt><dd className="mt-1"><Badge tone={producto.activo ? "green" : "neutral"}>{producto.activo ? "Activo" : "Inactivo"}</Badge></dd></div>
      </dl>
    </Panel>
    <Panel listado key={historial.page + JSON.stringify(query)} titulo="Movimientos de stock" acciones={<StockDialog producto={producto} puedeEditar={usuario.rol === "admin"} categorias={categorias} />}>
      <TablaStock data={historial.data} />
      <Paginador data={historial} query={query} ruta={"/productos/" + producto.id} />
    </Panel>
  </>;
}
