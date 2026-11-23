import { ruta } from "@/adapters/http";
import { obtenerPago } from "@/services/pagos";

export const GET = ruta((usuario, { id }) => obtenerPago(usuario, id), { id: true });
