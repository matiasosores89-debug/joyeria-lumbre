import { ruta } from "@/adapters/http";
import { editarUsuario } from "@/services/usuarios";

export const PATCH = ruta((usuario, { id, body }) => editarUsuario(usuario, id, body), { id: true, body: true });
