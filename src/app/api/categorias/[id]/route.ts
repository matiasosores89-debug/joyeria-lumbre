import { ruta } from "@/adapters/http";
import { editarCategoria } from "@/services/categorias";

export const PATCH = ruta((usuario, { id, body }) => editarCategoria(usuario, id, body), { id: true, body: true });
