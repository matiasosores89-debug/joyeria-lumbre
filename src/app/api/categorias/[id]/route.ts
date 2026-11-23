import { ruta } from "@/adapters/http";
import { editarCategoria, eliminarCategoria } from "@/services/categorias";

export const PATCH = ruta((usuario, { id, body }) => editarCategoria(usuario, id, body), { id: true, body: true });
export const DELETE = ruta((usuario, { id }) => eliminarCategoria(usuario, id), { id: true, status: 204 });
