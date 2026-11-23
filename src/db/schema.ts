import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { iconosCategoria } from "../lib/iconos-categoria";

const id = () => integer().primaryKey({ autoIncrement: true });
const created = () => text("creado_en").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);
const active = () => integer({ mode: "boolean" }).notNull().default(true);

export const usuarios = sqliteTable("usuarios", {
  id: id(), creadoEn: created(),
  email: text().notNull().unique(), nombre: text().notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text({ enum: ["admin", "vendedor"] }).notNull(), activo: active(),
  versionSesion: integer("version_sesion").notNull().default(0),
});
export const categorias = sqliteTable("categorias", {
  id: id(), creadoEn: created(), nombre: text().notNull().unique(), activa: active(),
  icono: text({ enum: iconosCategoria }),
});
export const productos = sqliteTable("productos", {
  id: id(), creadoEn: created(), codigo: text().notNull().unique(), descripcion: text().notNull(),
  categoriaId: integer("categoria_id").notNull().references(() => categorias.id),
  precio: integer().notNull(), existencia: integer().notNull().default(0),
  stockMinimo: integer("stock_minimo").notNull(), activo: active(),
}, t => [check("stock_no_negativo", sql`${t.existencia} >= 0`), index("productos_categoria").on(t.categoriaId)]);
export const clientes = sqliteTable("clientes", {
  id: id(), creadoEn: created(), tipoDoc: text("tipo_doc", { enum: ["DNI", "CUIT"] }).notNull(),
  nroDoc: text("nro_doc").notNull().unique(), nombre: text().notNull(),
  domicilio: text(), telefono: text(), email: text(),
  cuentaCorriente: integer("cuenta_corriente", { mode: "boolean" }).notNull().default(false),
  limiteCredito: integer("limite_credito"), activo: active(),
});
export const facturas = sqliteTable("facturas", {
  id: id(), creadoEn: created(), puntoVenta: integer("punto_venta").notNull().default(1),
  numero: integer().notNull(), fecha: text().notNull(), total: integer().notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  comprador: text({ mode: "json" }).$type<{ id: number; nombre: string; tipoDoc: string; nroDoc: string; domicilio: string | null }>(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  vendedorNombre: text("vendedor_nombre").notNull(),
  forma: text({ enum: ["contado", "tarjeta", "cuenta_corriente"] }).notNull(),
  tarjeta: text({ mode: "json" }).$type<{ tipo: "debito" | "credito"; marca: string; ultimos4: string }>(),
  montoRecibido: integer("monto_recibido"),
  estado: text({ enum: ["emitida", "anulada"] }).notNull().default("emitida"),
  motivoAnulacion: text("motivo_anulacion"), fechaAnulacion: text("fecha_anulacion"),
  importeAReintegrar: integer("importe_a_reintegrar"),
  anuladorId: integer("anulador_id").references(() => usuarios.id),
}, t => [uniqueIndex("facturas_numeracion").on(t.puntoVenta, t.numero), index("facturas_fecha").on(t.fecha), index("facturas_cliente").on(t.clienteId)]);
export const facturaItems = sqliteTable("factura_items", {
  id: id(), creadoEn: created(),
  facturaId: integer("factura_id").notNull().references(() => facturas.id),
  productoId: integer("producto_id").notNull().references(() => productos.id),
  codigo: text().notNull(), descripcion: text().notNull(),
  cantidad: integer().notNull(), precioUnitario: integer("precio_unitario").notNull(), subtotal: integer().notNull(),
}, t => [uniqueIndex("factura_producto").on(t.facturaId, t.productoId)]);
export const movimientosStock = sqliteTable("movimientos_stock", {
  id: id(), creadoEn: created(), fecha: text().notNull(),
  productoId: integer("producto_id").notNull().references(() => productos.id),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  facturaId: integer("factura_id").references(() => facturas.id),
  tipo: text({ enum: ["ingreso", "egreso", "venta", "anulacion"] }).notNull(),
  cantidad: integer().notNull(), existenciaResultante: integer("existencia_resultante").notNull(),
  motivo: text().notNull(), observacion: text(),
}, t => [index("mov_stock_producto_fecha").on(t.productoId, t.fecha)]);
export const pagos = sqliteTable("pagos", {
  id: id(), creadoEn: created(), numero: integer().notNull().unique(), fecha: text().notNull(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  importe: integer().notNull(), medio: text({ enum: ["efectivo", "transferencia", "tarjeta_debito"] }).notNull(),
  observacion: text(),
});
export const movimientosCuenta = sqliteTable("movimientos_cuenta", {
  id: id(), creadoEn: created(), fecha: text().notNull(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  facturaId: integer("factura_id").references(() => facturas.id),
  pagoId: integer("pago_id").references(() => pagos.id),
  tipo: text({ enum: ["debito", "credito"] }).notNull(),
  importe: integer().notNull(), descripcion: text().notNull(),
}, t => [index("mov_cuenta_cliente_fecha").on(t.clienteId, t.fecha)]);
