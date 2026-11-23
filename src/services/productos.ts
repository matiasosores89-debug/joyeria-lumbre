import { and, asc, eq, sql } from "drizzle-orm";
import { db, escribir, type Consulta, type Tx } from "../db";
import { categorias, productos } from "../db/schema";
import { productoPatch, productoSchema, productosQuery } from "../lib/validacion";
import { admin, ApiError, count, existe, pagina, validar, type Usuario } from "./comun";
import { moverStock } from "./stock";

const bajoMinimo = sql<boolean>`${productos.existencia} < ${productos.stockMinimo}`.mapWith(Boolean);
const seleccion = {
  id: productos.id, codigo: productos.codigo, descripcion: productos.descripcion,
  precio: productos.precio, existencia: productos.existencia, stockMinimo: productos.stockMinimo, activo: productos.activo,
  categoria: { id: categorias.id, nombre: categorias.nombre }, bajoMinimo,
};
function consulta(base: Consulta) {
  return base.select(seleccion).from(productos).innerJoin(categorias, eq(categorias.id, productos.categoriaId));
}

async function categoriaActiva(tx: Tx, id: number) {
  const categoria = await tx.select().from(categorias).where(eq(categorias.id, id)).get();
  if (!categoria?.activa) throw new ApiError(422, "VALIDACION", "Seleccioná una categoría activa.", [{ campo: "categoriaId", mensaje: "La categoría no está activa o no existe." }]);
}

async function verificarCodigo(tx: Tx, codigo: string, id?: number) {
  const otro = await tx.select().from(productos).where(eq(productos.codigo, codigo)).get();
  if (otro && otro.id !== id) throw new ApiError(409, "CODIGO_DUPLICADO", "Ese código ya está en uso.", [{ campo: "codigo", mensaje: "Usá un código único." }]);
}

// RF-P1: catálogo paginado con filtros de búsqueda y reposición.
export async function listarProductos(usuario: Usuario, input: unknown) {
  const p = validar(productosQuery, input);
  if (p.activo && p.activo !== "true") admin(usuario);
  const filtro = and(
    p.activo === "todos" ? undefined : eq(productos.activo, p.activo !== "false"),
    p.q ? sql`(instr(lower(${productos.codigo}), lower(${p.q})) > 0 or instr(lower(${productos.descripcion}), lower(${p.q})) > 0)` : undefined,
    p.categoriaId ? eq(productos.categoriaId, p.categoriaId) : undefined,
    p.bajoMinimo === undefined ? undefined : sql`(${bajoMinimo}) = ${Number(p.bajoMinimo)}`,
  );
  const [data, [resultado]] = await Promise.all([
    consulta(db()).where(filtro).orderBy(asc(productos.descripcion), asc(productos.id)).limit(p.pageSize).offset((p.page - 1) * p.pageSize),
    db().select({ total: count() }).from(productos).where(filtro),
  ]);
  return pagina(data, p, resultado.total);
}

// RF-P1 y RF-P6: detalle del producto, también para consultar su historial.
export async function obtenerProducto(_usuario: Usuario, id: number, base: Consulta = db()) {
  return existe(await consulta(base).where(eq(productos.id, id)).get(), "El producto");
}

// RF-P2: stock inicial asentado como primer ingreso.
export async function crearProducto(usuario: Usuario, input: unknown, fecha?: string) {
  const { stockInicial, ...datos } = validar(productoSchema, input);
  admin(usuario);
  return escribir(async tx => {
    await categoriaActiva(tx, datos.categoriaId);
    await verificarCodigo(tx, datos.codigo);
    const producto = await tx.insert(productos).values(datos).returning({ id: productos.id }).get();
    if (stockInicial) await moverStock(tx, usuario, producto.id, { tipo: "ingreso", motivo: "Stock inicial", cantidad: stockInicial }, fecha);
    return obtenerProducto(usuario, producto.id, tx);
  });
}

// RF-P2 y RF-P3: el precio y los datos se editan, el stock solo se mueve.
export async function editarProducto(usuario: Usuario, id: number, input: unknown) {
  const datos = validar(productoPatch, input);
  admin(usuario);
  return escribir(async tx => {
    const actual = existe(await tx.select().from(productos).where(eq(productos.id, id)).get(), "El producto");
    if (datos.codigo) await verificarCodigo(tx, datos.codigo, id);
    if ((datos.categoriaId && datos.categoriaId !== actual.categoriaId) || (datos.activo === true && !actual.activo)) await categoriaActiva(tx, datos.categoriaId ?? actual.categoriaId);
    if (Object.keys(datos).length) await tx.update(productos).set(datos).where(eq(productos.id, id));
    return obtenerProducto(usuario, id, tx);
  });
}
