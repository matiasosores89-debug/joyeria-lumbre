import { exigirSesion } from "@/auth/session";
import { listarStock } from "@/services/stock";
import type { Query } from "@/services/comun";
import { filtro, filtrosPagina } from "@/lib/page-data";
import { tiposStock } from "@/lib/format";
import { Campo, Selector } from "@/components/fields";
import { Encabezado, Filtros, Paginador, Panel } from "@/components/shared";
import { TablaStock } from "@/components/stock-table";

export default async function Movimientos({ searchParams }: { searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = filtrosPagina(await searchParams);
  const historial = await listarStock(usuario, query);
  const ruta = "/productos/movimientos";
  return <>
    <Encabezado titulo="Historial de stock" volver={{ href: "/productos", label: "Productos" }} />
    <Panel listado key={historial.page + JSON.stringify(query)}>
      <Filtros ruta={ruta}>
        <Selector name="tipo" label="Tipo" defaultValue={filtro(query, "tipo") ?? ""}><option value="">Todos</option>{Object.entries(tiposStock).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</Selector>
        <Campo name="desde" label="Desde" type="date" defaultValue={filtro(query, "desde")} />
        <Campo name="hasta" label="Hasta" type="date" defaultValue={filtro(query, "hasta")} />
      </Filtros>
      <TablaStock data={historial.data} mostrarProducto /><Paginador data={historial} query={query} ruta={ruta} />
    </Panel>
  </>;
}
