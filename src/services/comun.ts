import { count, gte, lt, type SQL, type SQLWrapper } from "drizzle-orm";
import type { ZodType } from "zod";
import { diaSiguiente, inicioDia } from "../lib/format";

export type Usuario = { id: number; nombre: string; email: string; rol: "admin" | "vendedor" };
export type Paginacion = { page: number; pageSize: number };
export type Query = Record<string, string | string[] | undefined>;
export { count };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

// §10.4: un único formato de validación para los servicios y los adaptadores.
export function validar<T>(schema: ZodType<T>, input: unknown): T {
  const resultado = schema.safeParse(input);
  if (resultado.success) return resultado.data;
  const details = resultado.error.issues.flatMap(issue => issue.code === "unrecognized_keys"
    ? issue.keys.map(key => ({ campo: [...issue.path, key].join("."), mensaje: "Este campo no está permitido." }))
    : [{ campo: issue.path.join("."), mensaje: issue.message }]);
  throw new ApiError(422, "VALIDACION", "Hay campos con errores.", details);
}

// RF-U2: los permisos se deciden en el servicio.
export function admin(usuario: Usuario) {
  if (usuario.rol !== "admin") throw new ApiError(403, "SIN_PERMISO", "Esta operación requiere permisos de administración.");
}

// §11.8: ausencia de un recurso.
export function existe<T>(fila: T | undefined, recurso: string): T {
  if (!fila) throw new ApiError(404, "NO_ENCONTRADO", recurso + " no existe.");
  return fila;
}

export function filtrosFecha(columna: SQLWrapper, rango: { desde?: string; hasta?: string }): (SQL | undefined)[] {
  return [
    rango.desde ? gte(columna, inicioDia(rango.desde)) : undefined,
    rango.hasta ? lt(columna, diaSiguiente(rango.hasta)) : undefined,
  ];
}

export function pagina<T>(data: T[], { page, pageSize }: Paginacion, total: number) {
  return { data, page, pageSize, total };
}

export function buscarPatron(q: string) {
  return "%" + q.replace(/[\\%_]/g, "\\$&").toLowerCase() + "%";
}
