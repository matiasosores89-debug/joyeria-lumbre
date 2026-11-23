import { exigirSesion } from "@/auth/session";
import { obtenerPago } from "@/services/pagos";
import type { Query } from "@/services/comun";
import { recurso } from "@/lib/page-data";
import { medios, pesos } from "@/lib/format";
import { Encabezado } from "@/components/shared";
import { Comprobante } from "@/components/comprobante";
import { Imprimir } from "@/components/imprimir";
import { Aviso } from "@/components/feedback";

export default async function Pago({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const pago = await recurso(params, id => obtenerPago(usuario, id));
  const nuevo = (await searchParams).nuevo === "1";
  return <>
    <Encabezado titulo="Recibo de pago" volver={{ href: "/clientes/" + pago.cliente.id + "?tab=cuenta", label: "Cuenta corriente" }} acciones={<Imprimir />} />
    {nuevo && <div className="no-print mx-auto mb-4 max-w-3xl"><Aviso aviso={{ texto: "Pago registrado." }} /></div>}
    <Comprobante tipo="Recibo" numero={pago.numeroRecibo} fecha={pago.fecha}>
      <dl className="grid grid-cols-2 gap-5 py-5 text-sm">
        <div><dt className="text-muted-foreground">Cliente</dt><dd className="font-semibold">{pago.cliente.nombre}</dd></div>
        <div><dt className="text-muted-foreground">Registrado por</dt><dd className="font-semibold">{pago.usuario.nombre}</dd></div>
        <div><dt className="text-muted-foreground">Medio de pago</dt><dd>{medios[pago.medio]}</dd></div>
        <div><dt className="text-muted-foreground">Saldo de la cuenta</dt><dd>{pesos(pago.saldoCliente)}</dd></div>
        {pago.observacion && <div className="col-span-2"><dt className="text-muted-foreground">Observación</dt><dd>{pago.observacion}</dd></div>}
      </dl>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-4 py-3"><span className="text-sm font-semibold">Importe recibido</span><strong className="text-xl">{pesos(pago.importe)}</strong></div>
    </Comprobante>
  </>;
}
