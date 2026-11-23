import { notFound } from "next/navigation";
import { idRuta } from "./validacion";
import { ApiError, type Query } from "@/services/comun";

export function filtrosPagina(query: Query): Query {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ""));
}

export const filtro = (query: Query, nombre: string) => typeof query[nombre] === "string" ? query[nombre] : undefined;

export async function recurso<T>(params: Promise<{ id: string }>, cargar: (id: number) => Promise<T>) {
  const id = idRuta.safeParse((await params).id);
  if (!id.success) notFound();
  try { return await cargar(id.data); }
  catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
