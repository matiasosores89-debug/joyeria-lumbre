import Link from "next/link";
import { exigirSesion } from "@/auth/session";
import { cuentaCliente, obtenerCliente } from "@/services/clientes";
import type { Query } from "@/services/comun";
import { filtro, filtrosPagina, recurso } from "@/lib/page-data";
import { fechaHora, pesos } from "@/lib/format";
import { EditorCliente, EditorPago, EstadoCliente } from "@/components/clientes-forms";
import { Encabezado, Filtros, Panel, Pestanas, Tabla, enlaceTabla } from "@/components/shared";
import { Campo } from "@/components/fields";
import { TablaFacturas } from "@/components/facturas-table";
import { Badge } from "@/components/ui/badge";

export default async function Cliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = filtrosPagina(await searchParams);
  const cliente = await recurso(params, id => obtenerCliente(usuario, id));
  const ruta = "/clientes/" + cliente.id;
  const cuenta = query.tab === "cuenta" ? await cuentaCliente(usuario, cliente.id, query) : null;
  return <>
    <Encabezado titulo={cliente.nombre} descripcion={cliente.tipoDoc + " " + cliente.nroDoc} volver={{ href: "/clientes", label: "Clientes" }}
      acciones={<><EditorCliente cliente={cliente} /><EstadoCliente cliente={cliente} /><EditorPago cliente={cliente} /></>} />
    <Panel className="mb-5 p-5">
      <dl className="grid grid-cols-2 gap-5 text-sm lg:grid-cols-4">
        <div><dt className="text-muted-foreground">Saldo actual</dt><dd className="mt-1 text-lg font-bold">{pesos(cliente.saldo)}</dd></div>
        <div><dt className="text-muted-foreground">Límite de crédito</dt><dd className="mt-1 font-semibold">{cliente.limiteCredito === null ? "Sin límite" : pesos(cliente.limiteCredito)}</dd></div>
        <div><dt className="text-muted-foreground">Crédito disponible</dt><dd className="mt-1 font-semibold">{!cliente.cuentaCorriente ? "—" : cliente.disponible === null ? "Sin límite" : pesos(cliente.disponible)}</dd></div>
        <div className="flex flex-wrap content-start gap-2"><dt className="sr-only">Estado</dt><dd><Badge tone={cliente.activo ? "green" : "neutral"}>{cliente.activo ? "Activo" : "Inactivo"}</Badge></dd><dd><Badge>{cliente.cuentaCorriente ? "Cuenta habilitada" : "Cuenta deshabilitada"}</Badge></dd></div>
      </dl>
    </Panel>
    <Pestanas items={[{ href: ruta, nombre: "Ficha", activo: !cuenta }, { href: ruta + "?tab=cuenta", nombre: "Cuenta corriente", activo: !!cuenta }]} />
    {cuenta ? <Panel>
      <Filtros ruta={ruta} conservar={{ tab: "cuenta" }}>
        <Campo name="desde" label="Desde" type="date" defaultValue={filtro(query, "desde")} />
        <Campo name="hasta" label="Hasta" type="date" defaultValue={filtro(query, "hasta")} />
      </Filtros>
      <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-sm">
        <span>Saldo anterior <strong>{pesos(cuenta.saldoAnterior)}</strong></span><span>Saldo al cierre del período <strong>{pesos(cuenta.saldo)}</strong></span>
      </div>
      <Tabla columnas={["Fecha", "Concepto", "Débito", "Crédito", "Saldo"]} vacia={!cuenta.movimientos.length} mensaje="No hay movimientos en este período.">
        {cuenta.movimientos.map((m, i) => <tr key={i}>
          <td className="whitespace-nowrap">{fechaHora(m.fecha)}</td>
          <td className="min-w-40">{m.facturaId ? <Link href={"/ventas/" + m.facturaId} className={enlaceTabla}>{m.descripcion}</Link>
            : m.pagoId ? <Link href={"/pagos/" + m.pagoId} className={enlaceTabla}>{m.descripcion}</Link> : m.descripcion}</td>
          <td className="whitespace-nowrap">{m.tipo === "debito" ? pesos(m.importe) : "—"}</td><td className="whitespace-nowrap">{m.tipo === "credito" ? pesos(m.importe) : "—"}</td>
          <td className="font-semibold whitespace-nowrap">{pesos(m.saldo)}</td>
        </tr>)}
      </Tabla>
    </Panel> : <div className="grid gap-5">
      <Panel titulo="Datos de contacto"><dl className="grid gap-4 px-5 pb-5 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Domicilio</dt><dd className="mt-1">{cliente.domicilio ?? "—"}</dd></div>
        <div><dt className="text-muted-foreground">Teléfono</dt><dd className="mt-1">{cliente.telefono ?? "—"}</dd></div>
        <div className="min-w-0"><dt className="text-muted-foreground">Email</dt><dd className="mt-1 break-words">{cliente.email ?? "—"}</dd></div>
      </dl></Panel>
      <Panel titulo="Últimas facturas"><TablaFacturas data={cliente.ultimasFacturas} comprador={false} /></Panel>
    </div>}
  </>;
}
