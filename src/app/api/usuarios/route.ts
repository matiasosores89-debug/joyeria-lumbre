import { ruta } from "@/adapters/http";
import { listarUsuarios, crearUsuario } from "@/services/usuarios";

export const GET = ruta((usuario, { query }) => listarUsuarios(usuario, query));
export const POST = ruta((usuario, { body }) => crearUsuario(usuario, body), { body: true, status: 201 });
