import Link from "next/link";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { exigirSesion } from "@/auth/session";
import { listarFacturas, opcionesVendedor } from "@/services/facturas";
import { listarClientes, obtenerCliente } from "@/services/clientes";
import type { Query } from "@/services/comun";
import { filtro, filtrosPagina } from "@/lib/page-data";
import { formas, pesos } from "@/lib/format";
import { Campo, Selector } from "@/components/fields";
import { Encabezado, Filtros, Paginador, Panel } from "@/components/shared";
import { TablaFacturas } from "@/components/facturas-table";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Facturas" };

export default async function Ventas({ searchParams }: { searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = filtrosPagina(await searchParams);
  const clienteId = filtro(query, "clienteId") ?? "";
  const [facturas, clientes, vendedores] = await Promise.all([
    listarFacturas(usuario, query), listarClientes(usuario, { pageSize: "100" }), opcionesVendedor(usuario),
  ]);
  const clienteSeleccionado = clienteId && !clientes.data.some(c => String(c.id) === clienteId)
    ? await obtenerCliente(usuario, Number(clienteId)).catch(() => undefined) : undefined;
  return <>
    <Encabezado titulo="Facturas" descripcion="Consultá las ventas emitidas y sus comprobantes." acciones={<Button asChild><Link href="/ventas/nueva"><Plus /> Nueva venta</Link></Button>} />
    <Panel listado key={facturas.page + JSON.stringify(query)}>
      <Filtros ruta="/ventas">
        <Campo name="q" label="Buscar" placeholder="Número o comprador" defaultValue={filtro(query, "q")} />
        <Campo name="desde" label="Desde" type="date" defaultValue={filtro(query, "desde")} />
        <Campo name="hasta" label="Hasta" type="date" defaultValue={filtro(query, "hasta")} />
        <Selector name="clienteId" label="Cliente" defaultValue={clienteId}><option value="">Todos</option>{clientes.data.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          {clienteSeleccionado && <option value={clienteSeleccionado.id}>{clienteSeleccionado.nombre}</option>}</Selector>
        <Selector name="vendedorId" label="Vendedor" defaultValue={filtro(query, "vendedorId") ?? ""}><option value="">Todos</option>{vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}</Selector>
        <Selector name="forma" label="Forma de pago" defaultValue={filtro(query, "forma") ?? ""}><option value="">Todas</option>{Object.entries(formas).map(([key, nombre]) => <option key={key} value={key}>{nombre}</option>)}</Selector>
        <Selector name="estado" label="Estado" defaultValue={filtro(query, "estado") ?? ""}><option value="">Todos</option><option value="emitida">Emitida</option><option value="anulada">Anulada</option></Selector>
      </Filtros>
      <div className="px-4 py-3 text-sm">Total emitido <strong className="ml-1">{pesos(facturas.totalEmitido)}</strong></div>
      <TablaFacturas data={facturas.data} /><Paginador data={facturas} query={query} ruta="/ventas" />
    </Panel>
  </>;
}
