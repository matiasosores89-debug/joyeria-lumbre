import { eq, max } from "drizzle-orm";
import { db, escribir, type Consulta } from "../db";
import { clientes, movimientosCuenta, pagos, usuarios } from "../db/schema";
import { numeroRecibo } from "../lib/format";
import { pagoSchema } from "../lib/validacion";
import { saldoCliente } from "./clientes";
import { ApiError, existe, validar, type Usuario } from "./comun";

async function recibo(base: Consulta, id: number) {
  const fila = existe(await base.select({
    id: pagos.id, numero: pagos.numero, fecha: pagos.fecha, importe: pagos.importe,
    medio: pagos.medio, observacion: pagos.observacion, movimientoId: movimientosCuenta.id,
    cliente: { id: clientes.id, nombre: clientes.nombre },
    usuario: { id: usuarios.id, nombre: usuarios.nombre },
  }).from(pagos).innerJoin(clientes, eq(clientes.id, pagos.clienteId))
    .innerJoin(usuarios, eq(usuarios.id, pagos.usuarioId))
    .innerJoin(movimientosCuenta, eq(movimientosCuenta.pagoId, pagos.id)).where(eq(pagos.id, id)).get(), "El pago");
  const { numero, movimientoId, ...datos } = fila;
  return { ...datos, numeroRecibo: numeroRecibo(numero), saldoCliente: await saldoCliente(base, fila.cliente.id, { fecha: fila.fecha, movimientoId }) };
}

// RF-C5, regla 8: pago y crédito en una transacción con numeración propia.
export async function registrarPago(usuario: Usuario, id: number, input: unknown, fecha = new Date().toISOString()) {
  const datos = validar(pagoSchema, input);
  return escribir(async tx => {
    const cliente = existe(await tx.select().from(clientes).where(eq(clientes.id, id)).get(), "El cliente");
    if (!cliente.activo || !cliente.cuentaCorriente) throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "El cliente no tiene cuenta corriente habilitada.");
    const saldo = await saldoCliente(tx, id);
    if (datos.importe > saldo) throw new ApiError(422, "PAGO_SUPERA_DEUDA", "El pago supera la deuda actual.", [{ campo: "importe", mensaje: "El importe no puede superar el saldo." }]);
    const [{ ultimo }] = await tx.select({ ultimo: max(pagos.numero) }).from(pagos);
    const numero = (ultimo ?? 0) + 1;
    const pago = await tx.insert(pagos).values({ ...datos, clienteId: id, usuarioId: usuario.id, fecha, numero }).returning({ id: pagos.id }).get();
    await tx.insert(movimientosCuenta).values({
      fecha, clienteId: id, pagoId: pago.id, tipo: "credito", importe: datos.importe, descripcion: "Recibo " + numeroRecibo(numero),
    });
    return recibo(tx, pago.id);
  });
}

// RF-C5: reimpresión del recibo.
export async function obtenerPago(_usuario: Usuario, id: number) {
  return recibo(db(), id);
}
