import { ruta } from "@/adapters/http";
import { obtenerFactura } from "@/services/facturas";

export const GET = ruta((usuario, { id }) => obtenerFactura(usuario, id), { id: true });
