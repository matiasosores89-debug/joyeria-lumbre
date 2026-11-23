import { exigirSesion } from "@/auth/session";
import { proximoNumero } from "@/services/facturas";
import { Encabezado } from "@/components/shared";
import { NuevaVenta } from "@/components/nueva-venta";

export const metadata = { title: "Nueva venta" };

export default async function VentaNueva() {
  const usuario = await exigirSesion();
  const proximo = await proximoNumero(usuario);
  return <>
    <Encabezado titulo="Nueva venta" descripcion="Identificá al comprador, agregá productos y elegí cómo paga." volver={{ href: "/ventas", label: "Facturas" }} />
    <NuevaVenta numero={proximo.numeroFormateado} />
  </>;
}
