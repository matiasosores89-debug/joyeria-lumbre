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
import { Panel, Tabla, Vacio, enlaceTabla } from "@/components/shared";
import { VentasDiarias, VentasPorPago } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fechaLarga, pesos } from "@/lib/format";

export default async function Inicio() {
  const usuario = await exigirSesion();
  const [tablero, reponer] = await Promise.all([
    cargarTablero(usuario), listarProductos(usuario, { bajoMinimo: "true", pageSize: "5" }),
  ]);
  const indicadores = [
    { nombre: "Ventas de hoy", valor: pesos(tablero.hoy.importe), nota: tablero.hoy.cantidad + " comprobantes", icon: ReceiptIcon },
    { nombre: "Ventas del mes", valor: pesos(tablero.mes.importe), nota: tablero.mes.cantidad + " comprobantes", icon: CalendarBlankIcon },
    { nombre: "Total adeudado", valor: pesos(tablero.cuentasCorrientes.totalAdeudado), nota: tablero.cuentasCorrientes.clientesConSaldo + " clientes con deuda", icon: HandCoinsIcon },
    { nombre: "Stock bajo", valor: String(tablero.bajoMinimo.cantidad), nota: "Productos para reponer", icon: PackageIcon },
  ];

  return <>
    <section className="no-print grid overflow-hidden border border-wine bg-wine text-primary-foreground md:grid-cols-[1.45fr_1fr]" aria-labelledby="titulo-inicio">
      <div className="relative flex flex-col items-start justify-between px-5 pt-5 pb-6 sm:px-9 sm:pt-7 sm:pb-8 xl:px-11">
        <p className="w-full border-b border-gold-ink/40 pb-3 text-xs font-semibold tracking-[.075em] text-gold-ink"><time>{fechaLarga()}</time></p>
        <h1 id="titulo-inicio" className="mt-5 mb-6 font-display text-[clamp(2.75rem,5.1vw,6.6rem)] leading-[.93] font-medium tracking-[-.065em]">
          Resumen del <em className="block font-normal text-[#f2d1cc]">negocio</em>
        </h1>
        <Button asChild size="lg" className="border-primary-foreground/60 bg-primary-foreground text-wine hover:bg-rose-paper">
          <Link href="/ventas/nueva"><PlusIcon aria-hidden /> Nueva venta</Link>
        </Button>
      </div>
      <div className="group relative min-h-36 overflow-hidden border-t border-gold-ink/40 bg-olive-ink md:min-h-full md:border-t-0 md:border-l">
        <Image src="/fotos/mostrador.webp" alt="Cadena dorada y dos anillos sobre terciopelo verde" fill preload
          sizes="(min-width: 1024px) 36vw, (min-width: 768px) 42vw, 100vw"
          className="object-cover object-[center_57%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.035]" />
      </div>
    </section>
    <dl className="mt-6 mb-9 grid grid-cols-2 border-y border-primary/30 xl:grid-cols-4">
      {indicadores.map(({ nombre, valor, nota, icon: Icon }, index) => <div key={nombre}
        className="relative min-w-0 border-primary/25 px-3 py-4 odd:border-r nth-[-n+2]:border-b sm:px-5 sm:py-5 xl:border-r xl:nth-[-n+2]:border-b-0 xl:last:border-r-0">
        <dt className="flex items-center gap-2 text-xs font-bold text-primary sm:text-sm"><Icon size={19} weight={index === 0 ? "fill" : "duotone"} aria-hidden />{nombre}</dt>
        <dd className="mt-2 font-display text-[clamp(1.12rem,2.25vw,2.18rem)] leading-tight font-medium tracking-[-.045em] text-wine tabular-nums [overflow-wrap:anywhere]">{valor}</dd>
        <dd className="mt-1 text-xs text-muted-foreground">{nota}</dd>
      </div>)}
    </dl>
    <div className="mb-7 grid min-w-0 items-stretch gap-5 xl:grid-cols-[1.55fr_1fr] xl:gap-7">
      <Panel titulo="Ventas diarias" detalle="Últimos 30 días · importe en pesos"><VentasDiarias data={tablero.ventasDiarias} /></Panel>
      <Panel titulo="Formas de pago" detalle="Ventas del mes" className="flex flex-col bg-rose-paper/35"><div className="my-auto"><VentasPorPago data={tablero.porFormaDePago} /></div></Panel>
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-[1.35fr_1fr] xl:gap-7">
      <Panel titulo="Productos más vendidos" detalle="Por unidades en el mes">
        <Tabla columnas={["Producto", "Unidades", "Importe"]} vacia={!tablero.masVendidos.length}>
          {tablero.masVendidos.map(p => <tr key={p.productoId}><td><Link className={enlaceTabla} href={"/productos/" + p.productoId}>{p.descripcion}</Link><span className="block text-xs text-muted-foreground">{p.codigo}</span></td><td>{p.unidades}</td><td className="whitespace-nowrap">{pesos(p.importe)}</td></tr>)}
        </Tabla>
      </Panel>
      <Panel titulo="Para reponer" detalle="Existencias por debajo del mínimo">
        {!reponer.data.length ? <Vacio mensaje="Todas las existencias alcanzan el mínimo." /> : <ul className="divide-y divide-border border-y border-border px-5">
          {reponer.data.map(p => <li key={p.id} className="flex items-center justify-between gap-2 py-3 text-sm">
            <Link href={"/productos/" + p.id} className={enlaceTabla}>{p.descripcion}</Link><Badge tone="amber">{p.existencia} / {p.stockMinimo}</Badge>
          </li>)}
        </ul>}
        <Link href="/productos?tab=existencias&bajoMinimo=true" className="flex w-fit items-center gap-2 px-5 py-4 text-sm font-bold text-primary hover:underline">Ver existencias <ArrowUpRightIcon size={15} aria-hidden /></Link>
      </Panel>
    </div>
  </>;
}
