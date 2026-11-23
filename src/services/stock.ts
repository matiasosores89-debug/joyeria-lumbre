import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, escribir, type Consulta, type Tx } from "../db";
import { facturas, movimientosStock, productos, usuarios } from "../db/schema";
import { numeroFactura } from "../lib/format";
import { stockQuery, stockSchema } from "../lib/validacion";
import { admin, ApiError, count, existe, filtrosFecha, pagina, validar, type Usuario } from "./comun";

type Movimiento = Pick<typeof movimientosStock.$inferInsert, "tipo" | "cantidad" | "motivo" | "observacion" | "facturaId">;
const seleccion = {
  id: movimientosStock.id, tipo: movimientosStock.tipo, cantidad: movimientosStock.cantidad,
  existenciaResultante: movimientosStock.existenciaResultante, motivo: movimientosStock.motivo,
  observacion: movimientosStock.observacion, fecha: movimientosStock.fecha,
  producto: { id: productos.id, codigo: productos.codigo },
  usuario: { id: usuarios.id, nombre: usuarios.nombre },
  factura: { id: facturas.id, punto: facturas.puntoVenta, numero: facturas.numero },
};

function consulta(base: Consulta) {
  return base.select(seleccion).from(movimientosStock).innerJoin(productos, eq(productos.id, movimientosStock.productoId))
    .innerJoin(usuarios, eq(usuarios.id, movimientosStock.usuarioId)).leftJoin(facturas, eq(facturas.id, movimientosStock.facturaId));
}

function publico({ factura, ...movimiento }: NonNullable<Awaited<ReturnType<ReturnType<typeof consulta>["get"]>>>) {
  return { ...movimiento, referencia: factura ? { facturaId: factura.id, numero: numeroFactura(factura.numero, factura.punto) } : null };
}

// RF-P4–P6, reglas 1 y 2: este es el único punto que cambia la existencia.
export async function moverStock(tx: Tx, usuario: Usuario, productoId: number, datos: Movimiento, fecha = new Date().toISOString()) {
  const [producto] = await tx.update(productos)
    .set({ existencia: sql`${productos.existencia} + ${datos.cantidad}` })
    .where(and(eq(productos.id, productoId), gte(productos.existencia, Math.max(0, -datos.cantidad))))
    .returning({ existencia: productos.existencia });
  if (!producto) {
    const actual = existe(await tx.select().from(productos).where(eq(productos.id, productoId)).get(), "El producto");
    throw new ApiError(409, "STOCK_INSUFICIENTE", "La existencia es insuficiente.", [
      { productoId, solicitado: -datos.cantidad, disponible: actual.existencia },
    ]);
  }
  return tx.insert(movimientosStock).values({
    ...datos, fecha, productoId, usuarioId: usuario.id, existenciaResultante: producto.existencia,
  }).returning({ id: movimientosStock.id }).get();
}

// RF-P4 y RF-P5: el signo se determina en el servidor.
export async function registrarStock(usuario: Usuario, productoId: number, input: unknown) {
  const datos = validar(stockSchema, input);
  admin(usuario);
  return escribir(async tx => {
    const movimiento = await moverStock(tx, usuario, productoId, {
      ...datos, cantidad: datos.tipo === "ingreso" ? datos.cantidad : -datos.cantidad,
    });
    return publico(existe(await consulta(tx).where(eq(movimientosStock.id, movimiento.id)).get(), "El movimiento"));
  });
}

// RF-P6: historial con referencia a factura, usuario y existencia resultante.
export async function listarStock(_usuario: Usuario, input: unknown, productoId?: number) {
  const p = validar(stockQuery, input);
  const producto = productoId ?? p.productoId;
  if (productoId) existe(await db().select().from(productos).where(eq(productos.id, productoId)).get(), "El producto");
  const filtro = and(
    producto ? eq(movimientosStock.productoId, producto) : undefined,
    p.tipo ? eq(movimientosStock.tipo, p.tipo) : undefined,
    ...filtrosFecha(movimientosStock.fecha, p),
  );
  const [data, [resultado]] = await Promise.all([
    consulta(db()).where(filtro).orderBy(desc(movimientosStock.fecha), desc(movimientosStock.id)).limit(p.pageSize).offset((p.page - 1) * p.pageSize),
    db().select({ total: count() }).from(movimientosStock).where(filtro),
  ]);
  return pagina(data.map(publico), p, resultado.total);
}
