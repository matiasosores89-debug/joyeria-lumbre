import type { NextRequest } from "next/server";
import { sesionApi } from "@/auth/session";
import { idRuta } from "@/lib/validacion";
import { ApiError, validar, type Usuario } from "@/services/comun";

type Contexto = { params: Promise<Record<string, string>> };
type Entrada = { id: number; query: Record<string, string>; body: unknown };
type Opciones = { body?: boolean; id?: boolean; status?: number };

export function errorPublico(error: unknown) {
  if (error instanceof ApiError) return { status: error.status, error: {
    code: error.code, message: error.message, ...(error.details !== undefined ? { details: error.details } : {}),
  } };
  console.error(error);
  return { status: 500, error: { code: "ERROR_INTERNO", message: "Ocurrió un error. Volvé a intentar." } };
}

async function json(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo debe ser JSON válido.");
  }
}

function protegerOrigen(request: NextRequest) {
  const origen = request.headers.get("origin");
  if (request.method !== "GET" && origen && origen !== request.nextUrl.origin) {
    throw new ApiError(403, "SIN_PERMISO", "Origen de la solicitud inválido.");
  }
}

function ejecutar(handler: (request: NextRequest, context: Contexto) => Promise<unknown>, status = 200) {
  return async (request: NextRequest, context: Contexto) => {
    try {
      protegerOrigen(request);
      const resultado = await handler(request, context);
      if (status === 204) return new Response(null, { status });
      return Response.json(resultado, { status, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const entrada = errorPublico(error);
      return Response.json({ error: entrada.error }, { status: entrada.status, headers: { "Cache-Control": "no-store" } });
    }
  };
}

export function ruta(handler: (usuario: Usuario, entrada: Entrada) => Promise<unknown>, opciones: Opciones = {}) {
  return ejecutar(async (request, context) => {
    const usuario = await sesionApi();
    return handler(usuario, {
      id: opciones.id ? validar(idRuta, (await context.params).id) : 0,
      query: Object.fromEntries(request.nextUrl.searchParams),
      body: opciones.body ? await json(request) : undefined,
    });
  }, opciones.status);
}

export function rutaPublica(handler: (body: unknown) => Promise<unknown>) {
  return ejecutar(async request => handler(await json(request)));
}
