import { ruta } from "@/adapters/http";
import { registrarPago } from "@/services/pagos";

export const POST = ruta((usuario, { id, body }) => registrarPago(usuario, id, body), { id: true, body: true, status: 201 });
