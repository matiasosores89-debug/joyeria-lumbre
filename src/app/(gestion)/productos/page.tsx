import Link from "next/link";
import { ArrowUpRight, History, Shapes } from "lucide-react";
import { exigirSesion } from "@/auth/session";
import { listarCategorias } from "@/services/categorias";
import { listarProductos } from "@/services/productos";
import type { Query } from "@/services/comun";
import { filtro, filtrosPagina } from "@/lib/page-data";
import { pesos } from "@/lib/format";
import { Campo, Selector } from "@/components/fields";
import { Encabezado, Filtros, Paginador, Panel, Pestanas, Tabla, enlaceTabla } from "@/components/shared";
import { EditorProducto, MovimientoManual } from "@/components/productos-forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Productos" };

export default async function Productos({ searchParams }: { searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = filtrosPagina(await searchParams);
  const existencias = query.tab === "existencias";
  const esAdmin = usuario.rol === "admin";
  const [categorias, productos] = await Promise.all([listarCategorias(usuario, {}), listarProductos(usuario, query)]);
  return <>
    <Encabezado titulo="Productos" descripcion="Catálogo, precios y existencias de la joyería." acciones={<>
      <Button asChild variant="outline"><Link href="/productos/movimientos"><History /> Historial</Link></Button>
      <Button asChild variant="outline"><Link href="/productos/categorias"><Shapes /> Categorías</Link></Button>
      {esAdmin && <EditorProducto categorias={categorias} />}
    </>} />
    <Pestanas items={[{ href: "/productos", nombre: "Catálogo", activo: !existencias }, { href: "/productos?tab=existencias", nombre: "Existencias", activo: existencias }]} />
    <Panel>
      <Filtros ruta="/productos" conservar={existencias ? { tab: "existencias" } : undefined}>
        <Campo label="Buscar" name="q" defaultValue={filtro(query, "q")} placeholder="Código o descripción" className="w-full sm:w-52" />
        <Selector label="Categoría" name="categoriaId" defaultValue={filtro(query, "categoriaId") ?? ""}>
          <option value="">Todas</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Selector>
        <Selector label="Existencias" name="bajoMinimo" defaultValue={filtro(query, "bajoMinimo") ?? ""}>
          <option value="">Todas</option><option value="true">Bajo mínimo</option><option value="false">En mínimo o más</option>
        </Selector>
        {esAdmin && <Selector label="Estado" name="activo" defaultValue={filtro(query, "activo") ?? "true"}><option value="true">Activos</option><option value="false">Inactivos</option><option value="todos">Todos</option></Selector>}
      </Filtros>
      <Tabla columnas={["Código", "Descripción", "Categoría", "Precio", "Existencia", ...(existencias ? ["Stock mínimo"] : []), ""]} vacia={!productos.data.length}>
        {productos.data.map(p => <tr key={p.id}>
          <td className="font-mono text-xs whitespace-nowrap text-muted-foreground">{p.codigo}</td>
          <td><Link href={"/productos/" + p.id} className={enlaceTabla}>{p.descripcion}</Link>{!p.activo && <span className="block text-xs text-muted-foreground">Inactivo</span>}</td><td>{p.categoria.nombre}</td>
          <td className="whitespace-nowrap tabular-nums">{pesos(p.precio)}</td>
          <td><Badge tone={p.bajoMinimo ? "amber" : "neutral"}>{p.existencia}{p.bajoMinimo ? " · Bajo mínimo" : ""}</Badge></td>
          {existencias && <td>{p.stockMinimo}</td>}
          <td>{existencias && esAdmin ? <div className="flex gap-1.5"><MovimientoManual producto={p} tipo="ingreso" /><MovimientoManual producto={p} tipo="egreso" /></div>
            : <Button asChild size="sm" variant="ghost"><Link href={"/productos/" + p.id} aria-label={"Ver " + p.descripcion}><ArrowUpRight /></Link></Button>}</td>
        </tr>)}
      </Tabla>
      <Paginador data={productos} query={query} ruta="/productos" />
    </Panel>
  </>;
}
