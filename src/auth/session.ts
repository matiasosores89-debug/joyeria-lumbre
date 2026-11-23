import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { usuarioSesion } from "@/services/auth";
import { ApiError } from "@/services/comun";
import { cookieSesion, firmarSesion, opcionesCookie, verificarSesion } from "./cookie";

export const sesion = cache(async () => {
  const token = (await cookies()).get(cookieSesion)?.value;
  const datos = await verificarSesion(token);
  return datos ? usuarioSesion(datos.id, datos.version) : undefined;
});

export async function exigirSesion() {
  const usuario = await sesion();
  if (!usuario) redirect("/login");
  return usuario;
}

export async function sesionApi() {
  const usuario = await sesion();
  if (!usuario) throw new ApiError(401, "NO_AUTENTICADO", "Iniciá sesión para continuar.");
  return usuario;
}

export async function abrirSesion(id: number, version: number) {
  (await cookies()).set(cookieSesion, await firmarSesion(id, version), opcionesCookie);
}

export async function cerrarSesion() {
  (await cookies()).set(cookieSesion, "", { ...opcionesCookie, maxAge: 0 });
}
