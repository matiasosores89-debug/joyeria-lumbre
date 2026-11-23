import { and, desc, eq, inArray, max, sql } from "drizzle-orm";
import { db, escribir, type Consulta } from "../db";
import { clientes, facturaItems, facturas, movimientosCuenta, productos, usuarios } from "../db/schema";
import { numeroFactura } from "../lib/format";
import { anulacionSchema, facturaSchema, facturasQuery } from "../lib/validacion";
import { saldoCliente } from "./clientes";
import { admin, ApiError, count, existe, filtrosFecha, pagina, validar, type Usuario } from "./comun";
import { resumenFactura, seleccionResumen } from "./resumen-factura";
import { moverStock } from "./stock";

const puntoVenta = 1;

// RF-V6, regla 4: se usa dentro de la transacción al emitir.
async function siguienteNumero(base: Consulta) {
  const [{ ultimo }] = await base.select({ ultimo: max(facturas.numero) }).from(facturas).where(eq(facturas.puntoVenta, puntoVenta));
  return (ultimo ?? 0) + 1;
}

// RF-V1: vista previa informativa de la numeración.
export async function proximoNumero(_usuario: Usuario) {
  return { numeroFormateado: numeroFactura(await siguienteNumero(db()), puntoVenta) };
}

// RF-V7 y RF-V9: comprobante completo con los datos congelados al emitir.
export async function obtenerFactura(_usuario: Usuario, id: number, base: Consulta = db()) {
  const fila = existe(await base.select().from(facturas).where(eq(facturas.id, id)).get(), "La factura");
  const items = await base.select({
    productoId: facturaItems.productoId, codigo: facturaItems.codigo, descripcion: facturaItems.descripcion,
    cantidad: facturaItems.cantidad, precioUnitario: facturaItems.precioUnitario, subtotal: facturaItems.subtotal,
  }).from(facturaItems).where(eq(facturaItems.facturaId, id)).orderBy(facturaItems.id);
  const pago = fila.forma === "contado"
    ? { forma: fila.forma, montoRecibido: fila.montoRecibido!, vuelto: fila.montoRecibido! - fila.total }
    : fila.forma === "tarjeta" ? { forma: fila.forma, tarjeta: fila.tarjeta! } : { forma: fila.forma };
  const anulador = fila.anuladorId
    ? await base.select({ id: usuarios.id, nombre: usuarios.nombre }).from(usuarios).where(eq(usuarios.id, fila.anuladorId)).get()
    : undefined;
  return {
    ...resumenFactura(fila), items, pago,
    ...(fila.forma === "cuenta_corriente" && fila.clienteId !== null ? { saldoCliente: await saldoCliente(base, fila.clienteId) } : {}),
    ...(fila.estado === "anulada" ? { anulacion: { fecha: fila.fechaAnulacion!, usuario: anulador!, motivo: fila.motivoAnulacion!, ...(fila.importeAReintegrar === null ? {} : { importeAReintegrar: fila.importeAReintegrar }) } } : {}),
  };
}

// RF-V1 a RF-V6: la factura, los renglones, el stock y el débito se escriben juntos.
export async function emitirFactura(usuario: Usuario, input: unknown, fecha = new Date().toISOString()) {
  const { clienteId, items, pago } = validar(facturaSchema, input);
  return escribir(async tx => {
    const catalogo = await tx.select().from(productos).where(inArray(productos.id, items.map(item => item.productoId)));
    const porId = new Map(catalogo.map(producto => [producto.id, producto]));
    const seleccion = items.map(item => ({ ...item, producto: existe(porId.get(item.productoId), "El producto") }));
    if (seleccion.some(item => !item.producto.activo)) throw new ApiError(422, "PRODUCTO_INACTIVO", "Hay un producto inactivo en la venta.");

    const cliente = clienteId === null ? null
      : existe(await tx.select().from(clientes).where(eq(clientes.id, clienteId)).get(), "El cliente");
    if (pago.forma === "cuenta_corriente" && (!cliente?.activo || !cliente.cuentaCorriente)) {
      throw new ApiError(422, "CUENTA_CORRIENTE_NO_HABILITADA", "Seleccioná un cliente activo con cuenta corriente habilitada.");
    }
    if (cliente && !cliente.activo) throw new ApiError(422, "VALIDACION", "El cliente está inactivo.", [{ campo: "clienteId", mensaje: "Seleccioná un cliente activo." }]);

    const faltantes = seleccion.filter(({ cantidad, producto }) => cantidad > producto.existencia)
      .map(({ productoId, cantidad, producto }) => ({ productoId, solicitado: cantidad, disponible: producto.existencia }));
    if (faltantes.length) throw new ApiError(409, "STOCK_INSUFICIENTE", "No hay stock suficiente para completar la venta.", faltantes);

    const renglones = seleccion.map(({ productoId, cantidad, producto }) => ({
      productoId, cantidad, codigo: producto.codigo, descripcion: producto.descripcion,
      precioUnitario: producto.precio, subtotal: producto.precio * cantidad,
    }));
    const total = renglones.reduce((suma, item) => suma + item.subtotal, 0);
    if (!Number.isSafeInteger(total)) throw new ApiError(422, "VALIDACION", "El total de la venta excede el máximo permitido.");
    const montoRecibido = pago.forma === "contado" ? pago.montoRecibido ?? total : null;
    if (montoRecibido !== null && montoRecibido < total) {
      throw new ApiError(422, "MONTO_INSUFICIENTE", "El monto recibido no cubre el total.", [{ campo: "pago.montoRecibido", mensaje: "Ingresá un monto igual o mayor al total." }]);
    }
    if (pago.forma === "cuenta_corriente" && cliente && cliente.limiteCredito !== null) {
      const saldoActual = await saldoCliente(tx, cliente.id);
      const limite = cliente.limiteCredito;
      if (saldoActual + total > limite) throw new ApiError(422, "LIMITE_CREDITO_EXCEDIDO", "La venta supera el límite de crédito.", {
        saldoActual, limite, excedente: saldoActual + total - limite,
      });
    }

    const numero = await siguienteNumero(tx);
    const comprador = cliente && {
      id: cliente.id, nombre: cliente.nombre, tipoDoc: cliente.tipoDoc, nroDoc: cliente.nroDoc, domicilio: cliente.domicilio,
    };
    const factura = await tx.insert(facturas).values({
      puntoVenta, numero, fecha, total, clienteId, comprador, usuarioId: usuario.id, vendedorNombre: usuario.nombre,
      forma: pago.forma, tarjeta: pago.forma === "tarjeta" ? pago.tarjeta : null, montoRecibido,
    }).returning({ id: facturas.id }).get();
    await tx.insert(facturaItems).values(renglones.map(item => ({ ...item, facturaId: factura.id })));
    for (const item of renglones) {
      await moverStock(tx, usuario, item.productoId, { tipo: "venta", motivo: "Venta", cantidad: -item.cantidad, facturaId: factura.id }, fecha);
    }
    if (pago.forma === "cuenta_corriente" && clienteId !== null) {
      await tx.insert(movimientosCuenta).values({
        clienteId, fecha, facturaId: factura.id, tipo: "debito", importe: total, descripcion: "Factura " + numeroFactura(numero, puntoVenta),
      });
    }
    return obtenerFactura(usuario, factura.id, tx);
  });
}

// RF-V8: búsqueda y total de las emitidas dentro del filtro.
export async function listarFacturas(_usuario: Usuario, input: unknown) {
  const p = validar(facturasQuery, input);
  const filtro = and(
    ...filtrosFecha(facturas.fecha, p),
    p.clienteId ? eq(facturas.clienteId, p.clienteId) : undefined,
    p.vendedorId ? eq(facturas.usuarioId, p.vendedorId) : undefined,
    p.forma ? eq(facturas.forma, p.forma) : undefined,
    p.estado ? eq(facturas.estado, p.estado) : undefined,
    p.q ? sql`(instr(printf('%04d-%08d', ${facturas.puntoVenta}, ${facturas.numero}), ${p.q}) > 0
      or instr(lower(coalesce(json_extract(${facturas.comprador}, '$.nombre'), 'Consumidor final')), lower(${p.q})) > 0)` : undefined,
  );
  const [data, [resultado]] = await Promise.all([
    db().select(seleccionResumen).from(facturas).where(filtro).orderBy(desc(facturas.fecha), desc(facturas.id)).limit(p.pageSize).offset((p.page - 1) * p.pageSize),
    db().select({ total: count(), totalEmitido: sql<number>`coalesce(sum(case when ${facturas.estado} = 'emitida' then ${facturas.total} else 0 end), 0)`.mapWith(Number) })
      .from(facturas).where(filtro),
  ]);
  return { ...pagina(data.map(resumenFactura), p, resultado.total), totalEmitido: resultado.totalEmitido };
}

// RF-V8: solo los datos necesarios para el filtro de vendedor.
export async function opcionesVendedor(_usuario: Usuario) {
  return db().select({ id: usuarios.id, nombre: usuarios.nombre }).from(usuarios).orderBy(usuarios.nombre);
}

// RF-V9, regla 5: una única anulación, con reposición y crédito en la misma transacción.
export async function anularFactura(usuario: Usuario, id: number, input: unknown) {
  const { motivo } = validar(anulacionSchema, input);
  admin(usuario);
  return escribir(async tx => {
    const factura = existe(await tx.select().from(facturas).where(eq(facturas.id, id)).get(), "La factura");
    if (factura.estado === "anulada") throw new ApiError(409, "FACTURA_ANULADA", "La factura ya está anulada.");
    const fecha = new Date().toISOString();
    let importeAReintegrar: number | null = null;
    const items = await tx.select().from(facturaItems).where(eq(facturaItems.facturaId, id));
    for (const item of items) {
      await moverStock(tx, usuario, item.productoId, { tipo: "anulacion", cantidad: item.cantidad, motivo, facturaId: id }, fecha);
    }
    if (factura.forma === "cuenta_corriente" && factura.clienteId !== null) {
      const clienteId = factura.clienteId;
      const referencia = numeroFactura(factura.numero, factura.puntoVenta);
      const saldo = await saldoCliente(tx, clienteId);
      // Reglas 5 y 8: revertir el débito completo y dejar los cobros excedentes pendientes de reintegro.
      if (saldo < factura.total) {
        importeAReintegrar = factura.total - saldo;
        await tx.insert(movimientosCuenta).values({
          clienteId, fecha, facturaId: id, tipo: "debito", importe: importeAReintegrar,
          descripcion: "Reintegro pendiente por anulación " + referencia,
        });
      }
      await tx.insert(movimientosCuenta).values({
        clienteId, fecha, facturaId: id, tipo: "credito", importe: factura.total,
        descripcion: "Anulación factura " + referencia,
      });
    }
    await tx.update(facturas).set({
      estado: "anulada", motivoAnulacion: motivo, fechaAnulacion: fecha, anuladorId: usuario.id, importeAReintegrar,
    }).where(eq(facturas.id, id));
    return obtenerFactura(usuario, id, tx);
  });
}
