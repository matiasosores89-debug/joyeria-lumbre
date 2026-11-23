import { z } from "zod";
import { iconosCategoria } from "./iconos-categoria";

const texto = (max = 120) => z.string().trim().min(1, "Es obligatorio.").max(max);
export const id = z.number().int().positive();
const idQuery = z.string().regex(/^[1-9]\d*$/, "Identificador inválido.").transform(Number).pipe(id);
const dinero = z.number({ error: "Ingresá un importe válido." }).int().min(0).max(1_000_000_000);
const cantidadBase = z.number({ error: "Ingresá una cantidad válida." }).int().max(1_000_000);
const cantidad = cantidadBase.min(1);
const estadistica = z.enum(["true", "false"]).transform(v => v === "true");
const activo = z.enum(["true", "false", "todos"]);
const email = z.email("Ingresá un correo válido.").max(254).toLowerCase();
const limiteBcrypt = (value: string) => new TextEncoder().encode(value).length <= 72;
const claveActual = z.string().min(1, "Es obligatorio.").refine(limiteBcrypt, "La contraseña admite hasta 72 bytes.");
const clave = z.string().min(8, "Usá al menos 8 caracteres.").refine(limiteBcrypt, "La contraseña admite hasta 72 bytes.");
const rol = z.enum(["admin", "vendedor"]);
export const loginSchema = z.strictObject({ email, password: claveActual });
export const accesoDemoSchema = z.strictObject({ rol, claveDemo: z.string().regex(/^[a-f0-9]{64}$/) });
export const claveSchema = z.strictObject({ actual: claveActual, nueva: clave });
export const usuarioSchema = z.strictObject({ nombre: texto(), email, rol, password: clave });
export const usuarioPatch = usuarioSchema.omit({ password: true }).partial().extend({ activo: z.boolean().optional() });
export const categoriaSchema = z.strictObject({ nombre: texto(80), icono: z.enum(iconosCategoria, "Elegí un ícono de la galería.").nullish() });
export const categoriaPatch = categoriaSchema.partial().extend({ activa: z.boolean().optional() });
const camposProducto = z.strictObject({
  codigo: texto(40).transform(v => v.toUpperCase()), descripcion: texto(180),
  categoriaId: id, precio: dinero.min(1), stockMinimo: cantidadBase.min(0),
});
export const productoSchema = camposProducto.extend({ stockInicial: cantidadBase.min(0).optional() });
export const productoPatch = camposProducto.partial().extend({ activo: z.boolean().optional() });
export const motivosIngreso = ["Reposición", "Stock inicial", "Devolución de cliente"] as const;
export const motivoAjuste = "Ajuste de inventario";
export const motivosEgreso = ["Rotura", "Vencimiento", motivoAjuste, "Uso interno"] as const;
const camposStock = { cantidad, observacion: texto(400).optional() };
export const stockSchema = z.discriminatedUnion("tipo", [
  z.strictObject({ ...camposStock, tipo: z.literal("ingreso"), motivo: z.enum(motivosIngreso) }),
  z.strictObject({ ...camposStock, tipo: z.literal("egreso"), motivo: z.enum(motivosEgreso) }),
  z.strictObject({
    tipo: z.literal("ajuste"),
    existenciaObjetivo: z.number({ error: "Ingresá la cantidad contada." }).int().nonnegative(),
    existenciaEsperada: z.number().int().nonnegative(),
    observacion: texto(400),
  }),
]);
const camposCliente = z.strictObject({
  tipoDoc: z.enum(["DNI", "CUIT"]),
  nroDoc: z.string().trim().regex(/^[\d.\- ]+$/, "Ingresá un DNI o CUIT válido.").transform(v => v.replace(/[.\- ]/g, ""))
    .pipe(z.string().regex(/^(\d{7,8}|\d{11})$/, "Ingresá un DNI o CUIT válido.")),
  nombre: texto(), domicilio: texto(180).nullish(), telefono: texto(40).nullish(), email: email.nullish(),
  cuentaCorriente: z.boolean().optional(), limiteCredito: dinero.nullish(),
});
export function documentoValido(tipo: string, numero: string) {
  return tipo === "DNI" ? /^\d{7,8}$/.test(numero) : /^\d{11}$/.test(numero);
}
export const clienteSchema = camposCliente.refine(v => documentoValido(v.tipoDoc, v.nroDoc), {
  path: ["nroDoc"], message: "La longitud del número no coincide con el tipo de documento.",
});
export const clientePatch = camposCliente.partial().extend({ activo: z.boolean().optional() }).refine(
  v => !v.tipoDoc || !v.nroDoc || documentoValido(v.tipoDoc, v.nroDoc),
  { path: ["nroDoc"], message: "La longitud del número no coincide con el tipo de documento." },
);
export const pagoSchema = z.strictObject({
  importe: dinero.min(1), medio: z.enum(["efectivo", "transferencia", "tarjeta_debito"]), observacion: texto(400).optional(),
});
const forma = z.enum(["contado", "tarjeta", "cuenta_corriente"]);
const estado = z.enum(["emitida", "anulada"]);
export const facturaSchema = z.strictObject({
  clienteId: id.nullable(),
  items: z.array(z.strictObject({ productoId: id, cantidad })).min(1, "Agregá al menos un producto.").max(100)
    .refine(items => new Set(items.map(item => item.productoId)).size === items.length, "Los productos deben ser distintos."),
  pago: z.discriminatedUnion("forma", [
    z.strictObject({ forma: z.literal("contado"), montoRecibido: dinero.optional() }),
    z.strictObject({ forma: z.literal("tarjeta"), tarjeta: z.strictObject({
      tipo: z.enum(["debito", "credito"]), marca: texto(40).regex(/^[\p{L} .-]+$/u, "Ingresá la marca de la tarjeta."), ultimos4: z.string().regex(/^\d{4}$/, "Ingresá exactamente cuatro dígitos."),
    }) }),
    z.strictObject({ forma: z.literal("cuenta_corriente") }),
  ]),
});
export const anulacionSchema = z.strictObject({ motivo: texto(400) });
const day = z.iso.date();
const fechas = { desde: day.optional(), hasta: day.optional() };
const paginacion = {
  page: idQuery.pipe(z.number().max(1_000_000)).optional().default(1),
  pageSize: idQuery.pipe(z.number().max(100)).optional().default(20),
};
const buscar = { ...paginacion, q: z.string().trim().max(200).optional() };
const rangoValido = (v: { desde?: string; hasta?: string }) => !v.desde || !v.hasta || v.desde <= v.hasta;
const rangoError = { path: ["hasta"], message: "La fecha final debe ser igual o posterior a la inicial." };
export const rangoQuery = z.object(fechas).refine(rangoValido, rangoError);
export const productosQuery = z.object({ ...buscar, categoriaId: idQuery.optional(), bajoMinimo: estadistica.optional(), activo: activo.optional() });
export const usuariosQuery = z.object({ ...buscar, activo: activo.optional() });
export const clientesQuery = z.object({ ...buscar, conDeuda: estadistica.optional(), orden: z.enum(["saldo", "nombre"]).optional(), activo: activo.optional() });
export const facturasQuery = z.object({ ...buscar, ...fechas, clienteId: idQuery.optional(), vendedorId: idQuery.optional(), forma: forma.optional(), estado: estado.optional() }).refine(rangoValido, rangoError);
export const stockQuery = z.object({ ...paginacion, ...fechas, productoId: idQuery.optional(), tipo: z.enum(["ingreso", "egreso", "venta", "anulacion"]).optional() }).refine(rangoValido, rangoError);
export const categoriaQuery = z.object({ todas: estadistica.optional() });
export const idRuta = idQuery;
