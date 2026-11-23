import { ruta } from "@/adapters/http";
import { cerrarSesion } from "@/auth/session";

export const POST = ruta(() => cerrarSesion(), { status: 204 });
