import { and, asc, desc, eq, gt, lte, lt, or, sql } from "drizzle-orm";
import { db, escribir, type Consulta, type Tx } from "../db";
import { clientes, facturas, movimientosCuenta } from "../db/schema";
import { diaSiguiente, documento, inicioDia } from "../lib/format";
import { clientePatch, clienteSchema, clientesQuery, documentoValido, rangoQuery } from "../lib/validacion";
import { ApiError, count, existe, pagina, validar, type Usuario } from "./comun";
import { resumenFactura, seleccionResumen } from "./resumen-factura";

const importeConSigno = sql<number>`case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end`;
const sumaSaldo = sql<number>`coalesce(sum(${importeConSigno}), 0)`.mapWith(Number);
export const saldoSubconsulta = sql<number>`(select ${sumaSaldo} from movimientos_cuenta where movimientos_cuenta.cliente_id = ${clientes.id})`.mapWith(Number);

function clientePublico({ creadoEn: _fecha, ...fila }: typeof clientes.$inferSelect, saldo: number) {
  return { ...fila, nroDoc: documento(fila.tipoDoc, fila.nroDoc), saldo, disponible: fila.limiteCredito === null ? null : fila.limiteCredito - saldo };
}

// Regla 7: los movimientos son la única fuente del saldo.
export async function saldoCliente(base: Consulta, id: number, corte?: { fecha: string; movimientoId: number }) {
  const hasta = corte ? or(lt(movimientosCuenta.fecha, corte.fecha),
    and(eq(movimientosCuenta.fecha, corte.fecha), lte(movimientosCuenta.id, corte.movimientoId))) : undefined;
  const [fila] = await base.select({ saldo: sumaSaldo }).from(movimientosCuenta).where(and(eq(movimientosCuenta.clienteId, id), hasta));
  return fila.saldo;
}

async function verificarDocumento(tx: Tx, nroDoc: string, id?: number) {
  const otro = await tx.select().from(clientes).where(eq(clientes.nroDoc, nroDoc)).get();
  if (otro && otro.id !== id) throw new ApiError(409, "DOCUMENTO_DUPLICADO", "Ese documento ya está registrado.", [{ campo: "nroDoc", mensaje: "El documento ya pertenece a un cliente." }]);
}

// RF-C1 y RF-C6: búsqueda por nombre/documento y saldos ordenables.
export async function listarClientes(_usuario: Usuario, input: unknown) {
  const p = validar(clientesQuery, input);
  const digitos = p.q?.replace(/[.\- ]/g, "") ?? "";
  const filtros = and(
    p.activo && p.activo !== "todos" ? eq(clientes.activo, p.activo === "true") : undefined,
    p.q ? sql`(instr(lower(${clientes.nombre}), lower(${p.q})) > 0 or (${/^\d+$/.test(digitos)} and instr(${clientes.nroDoc}, ${digitos}) > 0))` : undefined,
    p.conDeuda ? gt(saldoSubconsulta, 0) : undefined,
  );
  const [data, [totales]] = await Promise.all([
    db().select({ cliente: clientes, saldo: saldoSubconsulta }).from(clientes).where(filtros)
      .orderBy(...(p.orden === "saldo" || (p.conDeuda && !p.orden) ? [desc(saldoSubconsulta), asc(clientes.nombre)] : [asc(clientes.nombre)]), asc(clientes.id))
      .limit(p.pageSize).offset((p.page - 1) * p.pageSize),
    db().select({ total: count(), adeudado: p.conDeuda ? sql<number>`coalesce(sum(${saldoSubconsulta}), 0)`.mapWith(Number) : sql<number>`0` })
      .from(clientes).where(filtros),
  ]);
  return { ...pagina(data.map(({ cliente, saldo }) => clientePublico(cliente, saldo)), p, totales.total), ...(p.conDeuda ? { totalAdeudado: totales.adeudado } : {}) };
}

// RF-C3: ficha y últimas seis facturas.
export async function obtenerCliente(_usuario: Usuario, id: number) {
  const [fila, ultimas] = await Promise.all([
    db().select({ cliente: clientes, saldo: saldoSubconsulta }).from(clientes).where(eq(clientes.id, id)).get(),
    db().select(seleccionResumen).from(facturas).where(eq(facturas.clienteId, id)).orderBy(desc(facturas.fecha), desc(facturas.id)).limit(6),
  ]);
  const { cliente, saldo } = existe(fila, "El cliente");
  return { ...clientePublico(cliente, saldo), ultimasFacturas: ultimas.map(resumenFactura) };
}

// RF-C2 y RF-V2: alta común para el listado y la venta.
export async function crearCliente(_usuario: Usuario, input: unknown) {
  const datos = validar(clienteSchema, input);
  return escribir(async tx => {
    await verificarDocumento(tx, datos.nroDoc);
    const fila = await tx.insert(clientes).values(datos).returning().get();
    return clientePublico(fila, 0);
  });
}

// RF-C2 y RF-C7: no se cierra una cuenta con saldo pendiente.
export async function editarCliente(_usuario: Usuario, id: number, input: unknown) {
  const datos = validar(clientePatch, input);
  return escribir(async tx => {
    const actual = existe(await tx.select().from(clientes).where(eq(clientes.id, id)).get(), "El cliente");
    const tipo = datos.tipoDoc ?? actual.tipoDoc;
    const nro = datos.nroDoc ?? actual.nroDoc;
    if (!documentoValido(tipo, nro)) throw new ApiError(422, "VALIDACION", "Hay campos con errores.", [{ campo: "nroDoc", mensaje: "La longitud del número no coincide con el tipo de documento." }]);
    if (datos.nroDoc) await verificarDocumento(tx, nro, id);
    const saldo = await saldoCliente(tx, id);
    if (saldo !== 0 && (datos.activo === false || datos.cuentaCorriente === false)) {
      throw new ApiError(422, "SALDO_PENDIENTE", "La cuenta tiene saldo pendiente.");
    }
    const fila = Object.keys(datos).length ? await tx.update(clientes).set(datos).where(eq(clientes.id, id)).returning().get() : actual;
    return clientePublico(fila, saldo);
  });
}

// RF-C4: saldo acumulado, con corte anterior de un rango opcional.
export async function cuentaCliente(_usuario: Usuario, id: number, input: unknown) {
  const { desde, hasta } = validar(rangoQuery, input);
  const [cliente, filas] = await Promise.all([
    db().select({ id: clientes.id, nombre: clientes.nombre }).from(clientes).where(eq(clientes.id, id)).get(),
    db().select({
      fecha: movimientosCuenta.fecha, tipo: movimientosCuenta.tipo, importe: movimientosCuenta.importe,
      descripcion: movimientosCuenta.descripcion, facturaId: movimientosCuenta.facturaId, pagoId: movimientosCuenta.pagoId,
    }).from(movimientosCuenta).where(eq(movimientosCuenta.clienteId, id)).orderBy(asc(movimientosCuenta.fecha), asc(movimientosCuenta.id)),
  ]);
  const inicio = desde ? inicioDia(desde) : "";
  const fin = hasta ? diaSiguiente(hasta) : "\uffff";
  let saldo = 0;
  let saldoAnterior = 0;
  const movimientos = [];
  for (const movimiento of filas) {
    if (movimiento.fecha >= fin) break;
    saldo += movimiento.tipo === "debito" ? movimiento.importe : -movimiento.importe;
    if (movimiento.fecha < inicio) saldoAnterior = saldo;
    else movimientos.push({ ...movimiento, saldo });
  }
  return { cliente: existe(cliente, "El cliente"), saldoAnterior, movimientos, saldo };
}
