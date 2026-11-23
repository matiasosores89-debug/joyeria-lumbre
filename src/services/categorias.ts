import { and, asc, eq, sql } from "drizzle-orm";
import { db, escribir, type Tx } from "../db";
import { categorias, productos } from "../db/schema";
import { categoriaPatch, categoriaQuery, categoriaSchema } from "../lib/validacion";
import { admin, ApiError, existe, validar, type Usuario } from "./comun";

const seleccionCategoria = { id: categorias.id, nombre: categorias.nombre, activa: categorias.activa, icono: categorias.icono };

async function verificarNombre(tx: Tx, nombre: string, id?: number) {
  const otra = await tx.select().from(categorias).where(sql`lower(${categorias.nombre}) = lower(${nombre})`).get();
  if (otra && otra.id !== id) throw new ApiError(409, "NOMBRE_DUPLICADO", "Ya hay una categoría con ese nombre.", [{ campo: "nombre", mensaje: "Usá un nombre único." }]);
}

// RF-P7: por defecto solo se ofrecen categorías activas.
export async function listarCategorias(usuario: Usuario, input: unknown) {
  const { todas } = validar(categoriaQuery, input);
  if (todas) admin(usuario);
  return db().select(seleccionCategoria)
    .from(categorias).where(todas ? undefined : eq(categorias.activa, true)).orderBy(asc(categorias.nombre));
}

// RF-P7: alta de categorías.
export async function crearCategoria(usuario: Usuario, input: unknown) {
  const datos = validar(categoriaSchema, input);
  admin(usuario);
  return escribir(async tx => {
    await verificarNombre(tx, datos.nombre);
    return tx.insert(categorias).values(datos).returning(seleccionCategoria).get();
  });
}

// RF-P7: baja lógica solo si ningún producto activo usa la categoría.
export async function editarCategoria(usuario: Usuario, id: number, input: unknown) {
  const datos = validar(categoriaPatch, input);
  admin(usuario);
  return escribir(async tx => {
    const actual = existe(await tx.select().from(categorias).where(eq(categorias.id, id)).get(), "La categoría");
    if (datos.nombre) await verificarNombre(tx, datos.nombre, id);
    if (datos.activa === false && await tx.select().from(productos)
      .where(and(eq(productos.categoriaId, id), eq(productos.activo, true))).get()) {
      throw new ApiError(409, "CATEGORIA_EN_USO", "La categoría tiene productos activos.");
    }
    return tx.update(categorias).set({
      nombre: datos.nombre ?? actual.nombre,
      activa: datos.activa ?? actual.activa,
      icono: datos.icono === undefined ? actual.icono : datos.icono,
    }).where(eq(categorias.id, id)).returning(seleccionCategoria).get();
  });
}

// RF-P7: una categoría con productos asociados se conserva para proteger el catálogo y su historial.
export async function eliminarCategoria(usuario: Usuario, id: number) {
  admin(usuario);
  await escribir(async tx => {
    const producto = await tx.select({ id: productos.id }).from(productos)
      .where(eq(productos.categoriaId, id)).get();
    if (producto) {
      throw new ApiError(409, "CATEGORIA_EN_USO", "La categoría tiene productos asociados. Reasignalos antes de eliminarla.");
    }
    existe(await tx.delete(categorias).where(eq(categorias.id, id)).returning({ id: categorias.id }).get(), "La categoría");
  });
}
