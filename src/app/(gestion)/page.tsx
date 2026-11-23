import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { HandCoinsIcon } from "@phosphor-icons/react/dist/ssr/HandCoins";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr/Package";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { exigirSesion } from "@/auth/session";
import { cargarTablero } from "@/services/tablero";
import { listarProductos } from "@/services/productos";
import { Panel, Pestanas, Tabla, Vacio, enlaceTabla } from "@/components/shared";
import { VentasDiarias, VentasPorPago } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fechaLarga, pesos } from "@/lib/format";
import type { Query } from "@/services/comun";

export default async function Inicio({ searchParams }: { searchParams: Promise<Query> }) {
  const inventario = (await searchParams).vista === "inventario";
  const usuario = await exigirSesion();
  const [tablero, reponer] = await Promise.all([
    cargarTablero(usuario), inventario ? listarProductos(usuario, { bajoMinimo: "true", pageSize: "5" }) : null,
  ]);
  const indicadores = [
    { nombre: "Ventas de hoy", valor: pesos(tablero.hoy.importe), nota: tablero.hoy.cantidad + " comprobantes", icon: ReceiptIcon },
    { nombre: "Ventas del mes", valor: pesos(tablero.mes.importe), nota: tablero.mes.cantidad + " comprobantes", icon: CalendarBlankIcon },
    { nombre: "Total adeudado", valor: pesos(tablero.cuentasCorrientes.totalAdeudado), nota: tablero.cuentasCorrientes.clientesConSaldo + " clientes con deuda", icon: HandCoinsIcon },
    { nombre: "Stock bajo", valor: String(tablero.bajoMinimo.cantidad), nota: "Productos para reponer", icon: PackageIcon },
  ];

  return <div className="tablero-ventana flex flex-col gap-3 sm:gap-4">
    <section className="no-print grid shrink-0 grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] overflow-hidden border border-wine bg-wine text-primary-foreground md:grid-cols-[1.55fr_1fr]" aria-labelledby="titulo-inicio">
      <div className="relative flex flex-col items-start justify-between px-3 py-3 sm:px-6 sm:py-4 xl:px-7">
        <p className="w-full border-b border-gold-ink/40 pb-1.5 text-xs font-semibold tracking-[.075em] text-gold-ink"><time>{fechaLarga()}</time></p>
        <h1 id="titulo-inicio" className="my-2.5 font-display text-[clamp(1.85rem,4.1vw,4.25rem)] leading-[.93] font-medium tracking-[-.065em]">
          Resumen del <em className="block font-normal text-[#f2d1cc] sm:inline">negocio</em>
        </h1>
        <Button asChild size="sm" className="border-primary-foreground/60 bg-primary-foreground text-wine hover:bg-rose-paper">
          <Link href="/ventas/nueva"><PlusIcon aria-hidden /> Nueva venta</Link>
        </Button>
      </div>
      <div className="group relative overflow-hidden border-l border-gold-ink/40 bg-olive-ink">
        <Image src="/fotos/mostrador.webp" alt="Cadena dorada y dos anillos sobre terciopelo verde" fill preload
          sizes="(min-width: 1024px) 36vw, (min-width: 768px) 42vw, 38vw"
          className="object-cover object-[center_57%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.035]" />
      </div>
    </section>
    <dl className="grid shrink-0 grid-cols-2 border-y border-primary/30 sm:grid-cols-4">
      {indicadores.map(({ nombre, valor, nota, icon: Icon }, index) => <div key={nombre}
        className="relative min-w-0 border-primary/25 px-3 py-2.5 odd:border-r nth-[-n+2]:border-b sm:border-r sm:px-4 sm:nth-[-n+2]:border-b-0 sm:last:border-r-0">
        <dt className="flex items-center gap-2 text-xs font-bold text-primary sm:text-sm"><Icon size={19} weight={index === 0 ? "fill" : "duotone"} aria-hidden />{nombre}</dt>
        <dd className="mt-1 font-display text-[clamp(1.12rem,2.2vw,2rem)] leading-tight font-medium tracking-[-.045em] text-wine tabular-nums [overflow-wrap:anywhere]">{valor}</dd>
        <dd className="mt-1 text-xs text-muted-foreground">{nota}</dd>
      </div>)}
    </dl>
    <div className="shrink-0 [&>nav]:mb-0">
      <Pestanas items={[
        { href: "/", nombre: "Resumen de ventas", activo: !inventario },
        { href: "/?vista=inventario", nombre: "Inventario", activo: inventario },
      ]} />
    </div>
    {!inventario && <div className="tablero-vistas grid min-w-0 items-stretch gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Panel titulo="Ventas diarias" detalle="Últimos 30 días · importe en pesos" className="flex min-h-0 flex-col"><VentasDiarias data={tablero.ventasDiarias} /></Panel>
      <Panel titulo="Formas de pago" detalle="Ventas del mes" className="flex min-h-0 flex-col bg-rose-paper/35"><div className="my-auto"><VentasPorPago data={tablero.porFormaDePago} /></div></Panel>
    </div>}
    {reponer && <div className="tablero-vistas grid min-w-0 items-stretch gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Panel titulo="Productos más vendidos" detalle="Por unidades en el mes" className="flex min-h-0 flex-col [&>[data-tabla]]:min-h-0 [&>[data-tabla]]:overflow-auto">
        <Tabla columnas={["Producto", "Unidades", "Importe"]} vacia={!tablero.masVendidos.length}>
          {tablero.masVendidos.map(p => <tr key={p.productoId}><td><Link className={enlaceTabla} href={"/productos/" + p.productoId}>{p.descripcion}</Link><span className="block text-xs text-muted-foreground">{p.codigo}</span></td><td>{p.unidades}</td><td className="whitespace-nowrap">{pesos(p.importe)}</td></tr>)}
        </Tabla>
      </Panel>
      <Panel titulo="Para reponer" detalle="Existencias por debajo del mínimo" className="flex min-h-0 flex-col">
        {!reponer.data.length ? <Vacio mensaje="Todas las existencias alcanzan el mínimo." /> : <ul className="min-h-0 divide-y divide-border overflow-auto border-y border-border px-5">
          {reponer.data.map(p => <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <Link href={"/productos/" + p.id} className={enlaceTabla}>{p.descripcion}</Link><Badge tone="amber">{p.existencia} / {p.stockMinimo}</Badge>
          </li>)}
        </ul>}
        <Link href="/productos?tab=existencias&bajoMinimo=true" className="flex w-fit shrink-0 items-center gap-2 px-5 py-3 text-sm font-bold text-primary hover:underline">Ver existencias <ArrowUpRightIcon size={15} aria-hidden /></Link>
      </Panel>
    </div>}
  </div>;
}
