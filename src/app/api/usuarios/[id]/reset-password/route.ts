import { ruta } from "@/adapters/http";
import { restablecerClave } from "@/services/usuarios";

export const POST = ruta((usuario, { id }) => restablecerClave(usuario, id), { id: true });
