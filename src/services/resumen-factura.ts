import { facturas } from "../db/schema";
import { documento, numeroFactura } from "../lib/format";

export const seleccionResumen = {
  id: facturas.id, puntoVenta: facturas.puntoVenta, numero: facturas.numero,
  fecha: facturas.fecha, estado: facturas.estado, total: facturas.total,
  comprador: facturas.comprador, usuarioId: facturas.usuarioId, vendedorNombre: facturas.vendedorNombre, forma: facturas.forma,
};

export function resumenFactura({ comprador, usuarioId, vendedorNombre, forma, ...fila }: Pick<typeof facturas.$inferSelect, keyof typeof seleccionResumen>) {
  const cliente = comprador ? { ...comprador, nroDoc: documento(comprador.tipoDoc, comprador.nroDoc) } : null;
  return { ...fila, cliente, vendedor: { id: usuarioId, nombre: vendedorNombre }, pago: { forma }, numeroFormateado: numeroFactura(fila.numero, fila.puntoVenta) };
}
