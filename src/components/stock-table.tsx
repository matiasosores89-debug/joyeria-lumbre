import Link from "next/link";
import type { listarStock } from "@/services/stock";
import { fechaHora, tiposStock } from "@/lib/format";
import { Tabla, enlaceTabla } from "./shared";
import { Badge } from "./ui/badge";

type Movimiento = Awaited<ReturnType<typeof listarStock>>["data"][number];
export function TablaStock({ data, mostrarProducto }: { data: Movimiento[]; mostrarProducto?: boolean }) {
  return <Tabla columnas={["Fecha", ...(mostrarProducto ? ["Producto"] : []), "Tipo", "Cantidad", "Existencia resultante", "Motivo", "Usuario", "Factura"]}
    vacia={!data.length} mensaje="No hay movimientos para estos filtros.">
    {data.map(m => <tr key={m.id}>
      <td className="whitespace-nowrap">{fechaHora(m.fecha)}</td>
      {mostrarProducto && <td><Link href={"/productos/" + m.producto.id} className={enlaceTabla}>{m.producto.codigo}</Link></td>}
      <td><Badge tone={m.cantidad > 0 ? "green" : "neutral"}>{tiposStock[m.tipo]}</Badge></td>
      <td className="tabular-nums">{m.cantidad > 0 ? "+" : ""}{m.cantidad}</td><td>{m.existenciaResultante}</td>
      <td>{m.motivo}{m.observacion && <span className="mt-0.5 block text-xs text-muted-foreground">{m.observacion}</span>}</td>
      <td className="whitespace-nowrap">{m.usuario.nombre}</td>
      <td>{m.referencia ? <Link className={enlaceTabla + " whitespace-nowrap"} href={"/ventas/" + m.referencia.facturaId}>{m.referencia.numero}</Link> : "—"}</td>
    </tr>)}
  </Tabla>;
}
