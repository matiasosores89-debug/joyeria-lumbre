import { ruta } from "@/adapters/http";
import { obtenerProducto, editarProducto } from "@/services/productos";

export const GET = ruta((usuario, { id }) => obtenerProducto(usuario, id), { id: true });
export const PATCH = ruta((usuario, { id, body }) => editarProducto(usuario, id, body), { id: true, body: true });
