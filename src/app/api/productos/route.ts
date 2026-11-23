import { ruta } from "@/adapters/http";
import { listarProductos, crearProducto } from "@/services/productos";

export const GET = ruta((usuario, { query }) => listarProductos(usuario, query));
export const POST = ruta((usuario, { body }) => crearProducto(usuario, body), { body: true, status: 201 });
