import Link from "next/link";
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { HandCoinsIcon as CircleDollarSign } from "@phosphor-icons/react/dist/ssr/HandCoins";
import type { listarClientes } from "@/services/clientes";
import type { Query } from "@/services/comun";
import { filtro } from "@/lib/page-data";
import { pesos } from "@/lib/format";
import { Campo, Selector } from "./fields";
import { Filtros, Paginador, Panel, Tabla, enlaceTabla } from "./shared";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function ListadoClientes({ clientes, query, saldo = false }: { clientes: Awaited<ReturnType<typeof listarClientes>>; query: Query; saldo?: boolean }) {
  const ruta = saldo ? "/clientes/saldos" : "/clientes";
  return <Panel listado key={clientes.page + JSON.stringify(query)}>
    {saldo && <div className="flex items-center gap-3 border-b border-border p-4 text-sm"><CircleDollarSign className="text-primary" size={20} /><span>Total adeudado</span><strong>{pesos(clientes.totalAdeudado ?? 0)}</strong></div>}
    <Filtros ruta={ruta}>
      <Campo label="Buscar" name="q" defaultValue={filtro(query, "q")} placeholder="Nombre o documento" className="w-full sm:w-56" />
      {!saldo && <>
        <Selector label="Estado" name="activo" defaultValue={filtro(query, "activo") ?? "todos"}><option value="todos">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></Selector>
        <Selector label="Ordenar por" name="orden" defaultValue={filtro(query, "orden") ?? "nombre"}><option value="nombre">Nombre</option><option value="saldo">Saldo</option></Selector>
      </>}
    </Filtros>
    <Tabla columnas={["Cliente", "Documento", "Cuenta corriente", "Saldo", "Estado", ""]} vacia={!clientes.data.length} mensaje={saldo ? "No hay clientes con deuda para mostrar." : "No hay clientes para estos filtros."}>
      {clientes.data.map(c => <tr key={c.id}>
        <td><Link className={enlaceTabla} href={"/clientes/" + c.id + (saldo ? "?tab=cuenta" : "")}>{c.nombre}</Link>{c.email && <span className="block text-xs text-muted-foreground">{c.email}</span>}</td>
        <td className="whitespace-nowrap">{c.tipoDoc} {c.nroDoc}</td><td>{c.cuentaCorriente ? "Habilitada" : "—"}</td>
        <td className="whitespace-nowrap tabular-nums"><Badge tone={c.saldo > 0 ? "amber" : c.saldo < 0 ? "green" : "neutral"}>{pesos(c.saldo)}</Badge></td>
        <td>{c.activo ? "Activo" : "Inactivo"}</td><td><Button asChild size="sm" variant="ghost"><Link href={"/clientes/" + c.id + (saldo ? "?tab=cuenta" : "")} aria-label={"Ver " + c.nombre}><ArrowUpRight /></Link></Button></td>
      </tr>)}
    </Tabla>
    <Paginador data={clientes} query={query} ruta={ruta} />
  </Panel>;
}
