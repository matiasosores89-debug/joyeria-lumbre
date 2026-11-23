import { ruta } from "@/adapters/http";
import { obtenerCliente, editarCliente } from "@/services/clientes";

export const GET = ruta((usuario, { id }) => obtenerCliente(usuario, id), { id: true });
export const PATCH = ruta((usuario, { id, body }) => editarCliente(usuario, id, body), { id: true, body: true });
