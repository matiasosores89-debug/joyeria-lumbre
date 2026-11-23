import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { fechaHora, formas, pesos } from "@/lib/format";
import type { resumenFactura } from "@/services/resumen-factura";
import { EstadoFactura, Tabla, enlaceTabla } from "./shared";
import { Button } from "./ui/button";

export function TablaFacturas({ data, comprador = true }: { data: ReturnType<typeof resumenFactura>[]; comprador?: boolean }) {
  return <Tabla columnas={["Número", "Fecha", ...(comprador ? ["Comprador"] : []), "Vendedor", "Forma de pago", "Total", "Estado", ""]} vacia={!data.length} mensaje="No hay facturas para mostrar.">
    {data.map(f => <tr key={f.id}>
      <td><Link href={"/ventas/" + f.id} className={enlaceTabla + " font-mono text-xs whitespace-nowrap"}>{f.numeroFormateado}</Link></td>
      <td className="whitespace-nowrap">{fechaHora(f.fecha)}</td>
      {comprador && <td className="min-w-28">{f.cliente?.nombre ?? "Consumidor final"}</td>}
      <td>{f.vendedor.nombre}</td><td className="whitespace-nowrap">{formas[f.pago.forma]}</td>
      <td className="font-semibold whitespace-nowrap tabular-nums">{pesos(f.total)}</td><td><EstadoFactura estado={f.estado} /></td>
      <td><Button asChild variant="ghost" size="sm"><Link href={"/ventas/" + f.id} aria-label={"Ver factura " + f.numeroFormateado}><ArrowUpRight /></Link></Button></td>
    </tr>)}
  </Tabla>;
}
