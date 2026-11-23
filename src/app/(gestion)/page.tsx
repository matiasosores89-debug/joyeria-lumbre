import Link from "next/link";
import { ArrowDownToLine, ArrowRight, CalendarDays, CircleDollarSign, PackageSearch, Plus, Receipt, ShoppingBag } from "lucide-react";
import { exigirSesion } from "@/auth/session";
import { cargarTablero } from "@/services/tablero";
import { listarProductos } from "@/services/productos";
import { Encabezado, Panel, Tabla, Vacio, enlaceTabla } from "@/components/shared";
import { VentasDiarias, VentasPorPago } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fechaLarga, pesos } from "@/lib/format";

export default async function Inicio() {
  const usuario = await exigirSesion();
  const [tablero, reponer] = await Promise.all([
    cargarTablero(usuario), listarProductos(usuario, { bajoMinimo: "true", pageSize: "5" }),
  ]);
  const indicadores = [
    { nombre: "Ventas de hoy", valor: pesos(tablero.hoy.importe), nota: tablero.hoy.cantidad + " comprobantes", icon: Receipt },
    { nombre: "Ventas del mes", valor: pesos(tablero.mes.importe), nota: tablero.mes.cantidad + " comprobantes", icon: CalendarDays },
    { nombre: "Total adeudado", valor: pesos(tablero.cuentasCorrientes.totalAdeudado), nota: tablero.cuentasCorrientes.clientesConSaldo + " clientes con deuda", icon: CircleDollarSign },
    { nombre: "Stock bajo", valor: String(tablero.bajoMinimo.cantidad), nota: "Productos para reponer", icon: PackageSearch },
  ];
  return <>
    <Encabezado titulo="Resumen del negocio" descripcion={fechaLarga()} acciones={<Button asChild><Link href="/ventas/nueva"><Plus /> Nueva venta</Link></Button>} />
    <div className="mb-5 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {indicadores.map(({ nombre, valor, nota, icon: Icon }) => <Card key={nombre} className="min-w-0 p-3.5 sm:p-4">
        <div className="flex min-h-9 items-center justify-between gap-1 text-xs font-semibold text-muted-foreground sm:text-sm">{nombre}<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f3e9db] text-primary"><Icon size={16} strokeWidth={1.6} /></span></div>
        <p className="mt-1.5 text-base font-bold tracking-tight tabular-nums sm:text-[1.45rem]">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{nota}</p>
      </Card>)}
    </div>
    <div className="mb-5 grid min-w-0 gap-5 xl:grid-cols-[1.65fr_1fr]">
      <Panel titulo="Ventas diarias" detalle="Últimos 30 días · importe en pesos"><VentasDiarias data={tablero.ventasDiarias} /></Panel>
      <Panel titulo="Formas de pago" detalle="Ventas del mes" className="flex flex-col"><div className="my-auto"><VentasPorPago data={tablero.porFormaDePago} /></div></Panel>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <Panel titulo="Productos más vendidos" detalle="Por unidades en el mes" acciones={<span className="grid size-8 place-items-center rounded-lg bg-muted text-primary"><ShoppingBag size={16} /></span>}>
        <Tabla columnas={["Producto", "Unidades", "Importe"]} vacia={!tablero.masVendidos.length}>
          {tablero.masVendidos.map(p => <tr key={p.productoId}><td><Link className={enlaceTabla} href={"/productos/" + p.productoId}>{p.descripcion}</Link><span className="block text-xs text-muted-foreground">{p.codigo}</span></td><td>{p.unidades}</td><td className="whitespace-nowrap">{pesos(p.importe)}</td></tr>)}
        </Tabla>
      </Panel>
      <Panel titulo="Para reponer" detalle="Existencias por debajo del mínimo" acciones={<span className="grid size-8 place-items-center rounded-lg bg-muted text-primary"><ArrowDownToLine size={16} /></span>}>
        {!reponer.data.length ? <Vacio mensaje="Todas las existencias alcanzan el mínimo." /> : <ul className="divide-y divide-border border-y border-border px-5">
          {reponer.data.map(p => <li key={p.id} className="flex items-center justify-between gap-2 py-3 text-sm">
            <Link href={"/productos/" + p.id} className={enlaceTabla}>{p.descripcion}</Link><Badge tone="amber">{p.existencia} / {p.stockMinimo}</Badge>
          </li>)}
        </ul>}
        <Link href="/productos?tab=existencias&bajoMinimo=true" className="flex items-center gap-2 px-5 py-4 text-xs font-bold text-primary hover:underline">Ver existencias <ArrowRight size={13} /></Link>
      </Panel>
    </div>
  </>;
}
