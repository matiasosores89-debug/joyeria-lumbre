"use server";

import { sesionApi } from "@/auth/session";
import { credencialesDemo } from "@/auth/demo";
import { errorPublico } from "@/adapters/http";
import { iniciar, mutaciones } from "@/adapters/mutaciones";
import { accesoDemoSchema, id } from "@/lib/validacion";
import { ApiError, validar } from "@/services/comun";

export async function iniciarAction(body: unknown) {
  try {
    const demo = accesoDemoSchema.safeParse(body);
    if (!demo.success) return { ok: true as const, data: await iniciar(body) };
    const cuenta = credencialesDemo(demo.data);
    if (!cuenta) throw new ApiError(403, "SIN_PERMISO", "El enlace de demostración no es válido.");
    return { ok: true as const, data: await iniciar(cuenta, demo.data.rol) };
  }
  catch (error) { return { ok: false as const, error: errorPublico(error).error }; }
}

export async function mutarAction(nombre: keyof typeof mutaciones, recurso: number | null, body: unknown) {
  try {
    const usuario = await sesionApi();
    if (!Object.hasOwn(mutaciones, nombre)) throw new ApiError(404, "NO_ENCONTRADO", "La operación no existe.");
    return { ok: true as const, data: await mutaciones[nombre](usuario, recurso === null ? 0 : validar(id, recurso), body) };
  } catch (error) {
    return { ok: false as const, error: errorPublico(error).error };
  }
}
