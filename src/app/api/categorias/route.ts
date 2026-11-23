import { ruta } from "@/adapters/http";
import { listarCategorias, crearCategoria } from "@/services/categorias";

export const GET = ruta((usuario, { query }) => listarCategorias(usuario, query));
export const POST = ruta((usuario, { body }) => crearCategoria(usuario, body), { body: true, status: 201 });
