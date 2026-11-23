import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { facturaItems, facturas, movimientosCuenta, movimientosStock, usuarios } from "../src/db/schema";
import { crearCategoria, editarCategoria, eliminarCategoria, listarCategorias } from "../src/services/categorias";
import { cuentaCliente, crearCliente, editarCliente } from "../src/services/clientes";
import { ApiError, type Usuario } from "../src/services/comun";
import { anularFactura, emitirFactura, listarFacturas, obtenerFactura, proximoNumero } from "../src/services/facturas";
import { obtenerPago, registrarPago } from "../src/services/pagos";
import { crearProducto, editarProducto, obtenerProducto } from "../src/services/productos";
import { listarStock, registrarStock } from "../src/services/stock";
import { cargarTablero } from "../src/services/tablero";

let admin: Usuario;
let vendedor: Usuario;
let categoriaId: number;

before(async () => {
  process.env.DATABASE_URL = "file::memory:?cache=shared";
  await migrate(db(), { migrationsFolder: "drizzle" });
  [admin, vendedor] = await db().insert(usuarios).values([
    { nombre: "Admin", email: "admin@test.example", passwordHash: "fixture", rol: "admin" },
    { nombre: "Vendedor", email: "vendedor@test.example", passwordHash: "fixture", rol: "vendedor" },
  ]).returning();
  categoriaId = (await crearCategoria(admin, { nombre: "Anillos" })).id;
});

after(() => db().$client.close());

const error = (status: number, code: string) => (e: unknown) => e instanceof ApiError && e.code === code && e.status === status;

function pieza(codigo: string, stockInicial: number, precio = 123_450) {
  return crearProducto(admin, { codigo, descripcion: "Pieza " + codigo, categoriaId, precio, stockMinimo: 0, stockInicial });
}

function contado(...ids: number[]) {
  return { clienteId: null, items: ids.map(productoId => ({ productoId, cantidad: 1 })), pago: { forma: "contado" } };
}

test("roles, campos estrictos, código único y egreso por encima del stock", async () => {
  const p = await pieza("PR-01", 1);
  await assert.rejects(editarProducto(vendedor, p.id, { precio: 99 }), error(403, "SIN_PERMISO"));
  await assert.rejects(editarProducto(admin, p.id, { existencia: 100 }), error(422, "VALIDACION"));
  await assert.rejects(pieza(" pr-01 ", 2), error(409, "CODIGO_DUPLICADO"));
  await assert.rejects(registrarStock(admin, p.id, { tipo: "egreso", cantidad: 2, motivo: "Rotura" }), error(409, "STOCK_INSUFICIENTE"));
  assert.equal((await obtenerProducto(admin, p.id)).existencia, 1);
});

test("la categoría conserva su ícono, lo puede cambiar y admite la opción automática", async () => {
  const previa = (await listarCategorias(admin, {})).find(c => c.id === categoriaId);
  assert.equal(previa?.icono, null);
  const categoria = await crearCategoria(admin, { nombre: "Colección Lunar", icono: "luna" });
  assert.equal(categoria.icono, "luna");
  await assert.rejects(editarCategoria(admin, categoria.id, { icono: "desconocido" }), error(422, "VALIDACION"));
  const editada = await editarCategoria(admin, categoria.id, { nombre: "Colección de regalo", icono: "regalo" });
  assert.equal(editada.icono, "regalo");
  assert.equal((await editarCategoria(admin, categoria.id, { activa: false })).icono, "regalo");
  const automatica = await editarCategoria(admin, categoria.id, { activa: true, icono: null });
  assert.equal(automatica.icono, null);
  assert.equal((await listarCategorias(vendedor, {})).find(c => c.id === categoria.id)?.icono, null);
});

test("solo un administrador puede eliminar una categoría sin productos asociados", async () => {
  const categoria = await crearCategoria(admin, { nombre: "Categoría temporal" });
  await assert.rejects(eliminarCategoria(vendedor, categoria.id), error(403, "SIN_PERMISO"));

  const producto = await crearProducto(admin, {
    codigo: "PR-CATEGORIA", descripcion: "Producto de prueba", categoriaId: categoria.id, precio: 1000, stockMinimo: 0,
  });
  await assert.rejects(eliminarCategoria(admin, categoria.id), error(409, "CATEGORIA_EN_USO"));
  await editarProducto(admin, producto.id, { activo: false });
  await editarCategoria(admin, categoria.id, { activa: false });
  await assert.rejects(eliminarCategoria(admin, categoria.id), error(409, "CATEGORIA_EN_USO"));
  assert.equal((await obtenerProducto(admin, producto.id)).categoria.id, categoria.id);

  await editarProducto(admin, producto.id, { categoriaId });
  await eliminarCategoria(admin, categoria.id);
  const categorias = await listarCategorias(admin, { todas: "true" });
  assert.ok(categorias.every(item => item.id !== categoria.id));
  await assert.rejects(eliminarCategoria(admin, categoria.id), error(404, "NO_ENCONTRADO"));
});

test("el ajuste físico registra la diferencia y rechaza una existencia desactualizada", async () => {
  const p = await pieza("PR-AJUSTE", 5);
  const ajustar = (existenciaEsperada: number, existenciaObjetivo: number) => ({
    tipo: "ajuste", existenciaEsperada, existenciaObjetivo, observacion: "Conteo de vitrina",
  });

  await assert.rejects(registrarStock(vendedor, p.id, ajustar(5, 6)), error(403, "SIN_PERMISO"));
  await assert.rejects(registrarStock(admin, p.id, ajustar(5, 5)), error(422, "VALIDACION"));
  const ingreso = await registrarStock(admin, p.id, ajustar(5, 8));
  assert.equal(ingreso.cantidad, 3);
  assert.equal(ingreso.tipo, "ingreso");
  await assert.rejects(registrarStock(admin, p.id, ajustar(5, 2)), error(409, "STOCK_DESACTUALIZADO"));
  const egreso = await registrarStock(admin, p.id, ajustar(8, 0));
  assert.equal(egreso.cantidad, -8);
  assert.equal(egreso.existenciaResultante, 0);
  assert.equal(egreso.motivo, "Ajuste de inventario");
  assert.equal(egreso.observacion, "Conteo de vitrina");
  const historial = await listarStock(vendedor, {}, p.id);
  assert.deepEqual(historial.data.map(m => m.existenciaResultante), [0, 8, 5]);
  assert.equal(historial.data.reduce((suma, m) => suma + m.cantidad, 0), (await obtenerProducto(admin, p.id)).existencia);
});

test("dos ventas de la última unidad emiten una factura sin salto en la numeración", async () => {
  const p = await pieza("PR-02", 1);
  const previo = (await proximoNumero(admin)).numeroFormateado;
  const intentos = await Promise.allSettled([emitirFactura(vendedor, contado(p.id)), emitirFactura(admin, contado(p.id))]);
  const confirmadas = intentos.filter(r => r.status === "fulfilled");
  const rechazadas = intentos.filter(r => r.status === "rejected");
  assert.equal(confirmadas.length, 1);
  assert.equal(confirmadas[0].value.numeroFormateado, previo);
  assert.equal(rechazadas.length, 1);
  assert.ok(error(409, "STOCK_INSUFICIENTE")(rechazadas[0].reason));
  assert.equal((await obtenerProducto(admin, p.id)).existencia, 0);
  await editarProducto(admin, p.id, { precio: 999, descripcion: "Otro nombre" });
  const factura = await obtenerFactura(admin, confirmadas[0].value.id);
  assert.equal(factura.items[0].precioUnitario, 123_450);
  assert.equal(factura.items[0].descripcion, "Pieza PR-02");
  assert.equal((await listarFacturas(admin, { q: previo })).total, 1);
});

test("una falla después de escribir un renglón revierte factura, renglones, stock y numeración", async () => {
  const a = await pieza("PR-03", 2);
  const b = await pieza("PR-04", 2);
  const previo = (await proximoNumero(admin)).numeroFormateado;
  const cantidadFacturas = (await db().select().from(facturas)).length;
  const cantidadItems = (await db().select().from(facturaItems)).length;
  await db().run(sql.raw("create trigger falla_de_prueba before insert on movimientos_stock when new.tipo = 'venta' and new.producto_id = " + b.id + " begin select raise(abort, 'falla simulada'); end"));
  try {
    await assert.rejects(emitirFactura(admin, contado(a.id, b.id)), e => e instanceof Error && e.cause instanceof Error && /falla simulada/.test(e.cause.message));
  } finally {
    await db().run(sql.raw("drop trigger falla_de_prueba"));
  }
  assert.equal((await db().select().from(facturas)).length, cantidadFacturas);
  assert.equal((await db().select().from(facturaItems)).length, cantidadItems);
  assert.equal((await obtenerProducto(admin, a.id)).existencia, 2);
  assert.equal((await obtenerProducto(admin, b.id)).existencia, 2);
  assert.equal((await listarStock(admin, {}, a.id)).total, 1);
  assert.equal((await proximoNumero(admin)).numeroFormateado, previo);
});

test("cuenta corriente: límite, recibo, anulación y reconstrucción de stock y saldo", async () => {
  const p = await pieza("PR-05", 3, 20_000);
  const c = await crearCliente(vendedor, { tipoDoc: "DNI", nroDoc: "29.121.223", nombre: "María", cuentaCorriente: true, limiteCredito: 30_000 });
  const input = { ...contado(p.id), clienteId: c.id, pago: { forma: "cuenta_corriente" } };
  await assert.rejects(emitirFactura(vendedor, { ...input, clienteId: null }), error(422, "CUENTA_CORRIENTE_NO_HABILITADA"));
  const a = await emitirFactura(vendedor, input);
  await assert.rejects(emitirFactura(vendedor, input), error(422, "LIMITE_CREDITO_EXCEDIDO"));
  await assert.rejects(editarCliente(vendedor, c.id, { activo: false }), error(422, "SALDO_PENDIENTE"));
  await assert.rejects(registrarPago(vendedor, c.id, { importe: 20_001, medio: "efectivo" }), error(422, "PAGO_SUPERA_DEUDA"));
  const pago = await registrarPago(vendedor, c.id, { importe: 13_000, medio: "transferencia" });
  assert.equal(pago.numeroRecibo, "R 0001-00000001");
  assert.equal(pago.saldoCliente, 7000);
  assert.equal((await registrarPago(vendedor, c.id, { importe: 7000, medio: "efectivo" })).saldoCliente, 0);
  assert.equal((await obtenerPago(vendedor, pago.id)).saldoCliente, 7000);
  const segunda = await emitirFactura(vendedor, input);
  await assert.rejects(anularFactura(vendedor, segunda.id, { motivo: "Error de mostrador" }), error(403, "SIN_PERMISO"));
  assert.equal((await anularFactura(admin, segunda.id, { motivo: "Error de mostrador" })).estado, "anulada");
  await assert.rejects(anularFactura(admin, segunda.id, { motivo: "Repetida" }), error(409, "FACTURA_ANULADA"));
  const cuenta = await cuentaCliente(admin, c.id, {});
  assert.equal(cuenta.saldo, 0);
  assert.deepEqual(cuenta.movimientos.map(m => m.saldo), [20_000, 7000, 0, 20_000, 0]);
  const stock = await db().select().from(movimientosStock).where(eq(movimientosStock.productoId, p.id));
  assert.equal(stock.reduce((s, m) => s + m.cantidad, 0), (await obtenerProducto(admin, p.id)).existencia);
  const anulacion = await db().select().from(movimientosCuenta).where(eq(movimientosCuenta.facturaId, segunda.id));
  assert.deepEqual(anulacion.map(m => m.tipo), ["debito", "credito"]);
  assert.equal((await obtenerFactura(admin, a.id)).estado, "emitida");
  const anuladaPagada = await anularFactura(admin, a.id, { motivo: "Devolución de pieza pagada" });
  assert.equal(anuladaPagada.anulacion?.importeAReintegrar, 20_000);
  assert.equal((await cuentaCliente(admin, c.id, {})).saldo, 0);
});

test("tarjeta rechaza datos no previstos y el tablero devuelve treinta días", async () => {
  const p = await pieza("PR-06", 2);
  const body = { ...contado(p.id), pago: { forma: "tarjeta", tarjeta: { tipo: "debito", marca: "Visa", ultimos4: "0002" } } };
  await assert.rejects(emitirFactura(vendedor, { ...body, pago: { ...body.pago, tarjeta: { ...body.pago.tarjeta, numero: "campo no previsto" } } }), error(422, "VALIDACION"));
  const f = await emitirFactura(vendedor, body);
  assert.equal(f.pago.forma, "tarjeta");
  if (f.pago.forma === "tarjeta") assert.deepEqual(f.pago.tarjeta, body.pago.tarjeta);
  const tablero = await cargarTablero(admin);
  assert.equal(tablero.ventasDiarias.length, 30);
  assert.ok(tablero.hoy.cantidad >= 1);
});
