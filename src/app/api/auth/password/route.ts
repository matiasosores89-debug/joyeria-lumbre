import { ruta } from "@/adapters/http";
import { guardarClave } from "@/adapters/mutaciones";

export const PUT = ruta((usuario, { body }) => guardarClave(usuario, body), { body: true, status: 204 });
