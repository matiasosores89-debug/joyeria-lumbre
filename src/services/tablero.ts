import { and, desc, eq, gt, gte, sql, sum } from "drizzle-orm";
import { db } from "../db";
import { clientes, facturaItems, facturas, productos } from "../db/schema";
import { fechaArgentina, formas, inicioDia } from "../lib/format";
import { saldoSubconsulta } from "./clientes";
import { count, type Usuario } from "./comun";

// RF-T1 a RF-T3: solo facturas vigentes, con cortes horarios argentinos.
export async function cargarTablero(_usuario: Usuario) {
  const ahora = new Date();
  const dias = Array.from({ length: 30 }, (_, indice) => fechaArgentina(new Date(ahora.getTime() - (29 - indice) * 86_400_000)));
  const hoy = dias[29];
  const mes = hoy.slice(0, 7) + "-01";
  const fechaInicial = dias[0] < mes ? dias[0] : mes;
  const base = db();
  const [ventas, [deuda], [minimo], top] = await Promise.all([
    base.select({ fecha: facturas.fecha, total: facturas.total, forma: facturas.forma }).from(facturas)
      .where(and(eq(facturas.estado, "emitida"), gte(facturas.fecha, inicioDia(fechaInicial)))),
    base.select({ cantidad: count(), importe: sql<number>`coalesce(sum(${saldoSubconsulta}), 0)`.mapWith(Number) })
      .from(clientes).where(gt(saldoSubconsulta, 0)),
    base.select({ cantidad: count() }).from(productos).where(and(eq(productos.activo, true), sql`${productos.existencia} < ${productos.stockMinimo}`)),
    base.select({
      productoId: productos.id, codigo: productos.codigo, descripcion: productos.descripcion,
      unidades: sum(facturaItems.cantidad).mapWith(Number), importe: sum(facturaItems.subtotal).mapWith(Number),
    }).from(facturaItems).innerJoin(facturas, eq(facturas.id, facturaItems.facturaId))
      .innerJoin(productos, eq(productos.id, facturaItems.productoId))
      .where(and(eq(facturas.estado, "emitida"), gte(facturas.fecha, inicioDia(mes))))
      .groupBy(productos.id, productos.codigo, productos.descripcion).orderBy(desc(sum(facturaItems.cantidad)), productos.id).limit(5),
  ]);
  const diario = new Map(dias.map(dia => [dia, 0]));
  const medios = { contado: 0, tarjeta: 0, cuenta_corriente: 0 };
  let cantidadHoy = 0;
  let cantidadMes = 0;
  let importeMes = 0;
  for (const venta of ventas) {
    const fecha = fechaArgentina(new Date(venta.fecha));
    if (diario.has(fecha)) diario.set(fecha, diario.get(fecha)! + venta.total);
    if (fecha === hoy) cantidadHoy += 1;
    if (fecha >= mes && fecha <= hoy) {
      cantidadMes += 1;
      importeMes += venta.total;
      medios[venta.forma] += venta.total;
    }
  }
  return {
    hoy: { cantidad: cantidadHoy, importe: diario.get(hoy)! },
    mes: { cantidad: cantidadMes, importe: importeMes, ticketPromedio: cantidadMes ? Math.round(importeMes / cantidadMes) : 0 },
    cuentasCorrientes: { totalAdeudado: deuda.importe, clientesConSaldo: deuda.cantidad },
    bajoMinimo: minimo,
    ventasDiarias: dias.map(fecha => ({ fecha, importe: diario.get(fecha)! })),
    porFormaDePago: (Object.keys(formas) as (keyof typeof formas)[]).map(forma => ({ forma, importe: medios[forma] })),
    masVendidos: top,
  };
}
