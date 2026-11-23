import Link from "next/link";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { exigirSesion } from "@/auth/session";
import { obtenerFactura } from "@/services/facturas";
import type { Query } from "@/services/comun";
import { recurso } from "@/lib/page-data";
import { fechaHora, formas, pesos } from "@/lib/format";
import { Encabezado, EstadoFactura, Tabla } from "@/components/shared";
import { Anular } from "@/components/anular";
import { Comprobante } from "@/components/comprobante";
import { Imprimir } from "@/components/imprimir";
import { Aviso } from "@/components/feedback";
import { Button } from "@/components/ui/button";

export default async function Factura({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const factura = await recurso(params, id => obtenerFactura(usuario, id));
  const nueva = (await searchParams).nueva === "1";
  const { pago } = factura;
  return <>
    <Encabezado titulo="Comprobante de venta" volver={{ href: "/ventas", label: "Facturas" }}
      acciones={<><Imprimir />{usuario.rol === "admin" && factura.estado === "emitida" && <Anular id={factura.id} />}
        <Button asChild><Link href="/ventas/nueva"><Plus /> Nueva venta</Link></Button></>} />
    {nueva && <div className="no-print mx-auto mb-4 max-w-3xl"><Aviso aviso={{ texto: factura.estado === "emitida" ? "Venta confirmada." : "Factura anulada." }} /></div>}
    <Comprobante tipo="Factura" numero={factura.numeroFormateado} fecha={factura.fecha}>
      <dl className="grid grid-cols-2 gap-5 py-5 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Comprador</dt><dd className="font-semibold">{factura.cliente?.nombre ?? "Consumidor final"}</dd>
          {factura.cliente && <dd className="mt-0.5 text-xs">{factura.cliente.tipoDoc} {factura.cliente.nroDoc}{factura.cliente.domicilio && <span className="block">{factura.cliente.domicilio}</span>}</dd>}</div>
        <div><dt className="text-muted-foreground">Vendedor</dt><dd className="font-semibold">{factura.vendedor.nombre}</dd></div>
        <div><dt className="mb-0.5 text-muted-foreground">Estado</dt><dd><EstadoFactura estado={factura.estado} /></dd></div>
      </dl>
      <Tabla columnas={["Producto", "Cantidad", "Precio unitario", "Subtotal"]}>
        {factura.items.map(item => <tr key={item.productoId}><td><strong>{item.descripcion}</strong><span className="block font-mono text-xs text-muted-foreground">{item.codigo}</span></td>
          <td>{item.cantidad}</td><td className="whitespace-nowrap">{pesos(item.precioUnitario)}</td><td className="font-semibold whitespace-nowrap">{pesos(item.subtotal)}</td></tr>)}
      </Tabla>
      <div className="my-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-4 py-3"><span className="text-sm font-semibold">Total</span><strong className="text-xl">{pesos(factura.total)}</strong></div>
      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div><dt className="text-muted-foreground">Forma de pago</dt><dd className="font-semibold">{formas[pago.forma]}</dd></div>
        {pago.forma === "contado" && <><div><dt className="text-muted-foreground">Monto recibido</dt><dd>{pesos(pago.montoRecibido)}</dd></div><div><dt className="text-muted-foreground">Vuelto</dt><dd>{pesos(pago.vuelto)}</dd></div></>}
        {pago.forma === "tarjeta" && <div><dt className="text-muted-foreground">Tarjeta</dt><dd>{pago.tarjeta.marca} · {pago.tarjeta.tipo === "debito" ? "Débito" : "Crédito"} · •••• {pago.tarjeta.ultimos4}</dd></div>}
      </dl>
      {factura.anulacion && <div role="status" className="mt-5 rounded-lg bg-rose-50 p-4 text-sm text-rose-900"><strong>Anulada por {factura.anulacion.usuario.nombre} · {fechaHora(factura.anulacion.fecha)}</strong><p className="mt-1">{factura.anulacion.motivo}</p>
        {factura.anulacion.importeAReintegrar !== undefined && <p className="mt-2 font-semibold">Importe pendiente de reintegro: {pesos(factura.anulacion.importeAReintegrar)}</p>}
      </div>}
    </Comprobante>
  </>;
}
