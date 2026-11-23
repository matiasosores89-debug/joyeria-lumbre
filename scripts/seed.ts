import "dotenv/config";
import { and, eq, count } from "drizzle-orm";
import { db, escribir, urlBaseDeDatos, type Base } from "../src/db";
import { usuarios, categorias, productos, clientes, facturas, pagos } from "../src/db/schema";
import { hashClave } from "../src/services/auth";
import { crearCategoria } from "../src/services/categorias";
import { crearProducto } from "../src/services/productos";
import { crearCliente, obtenerCliente } from "../src/services/clientes";
import { emitirFactura } from "../src/services/facturas";
import { registrarPago } from "../src/services/pagos";
import { fechaArgentina, inicioDia } from "../src/lib/format";
import { usuarioSchema } from "../src/lib/validacion";

import { cuentasDemo } from "../src/lib/cuentas-demo";

const colecciones = [
  ["Anillos", "AN", "Solitaire de plata", "Alianza de oro rosa", "Sello ónix", "Eternidad con circones", "Aro martillado", "Perla de río"],
  ["Collares", "CO", "Cadena veneciana", "Dije de luna", "Corazón de nácar", "Gargantilla Aura", "Medalla solar", "Cadena eslabón fino"],
  ["Aros", "AR", "Argollas pequeñas", "Gotas de cristal", "Perlas clásicas", "Abridores estrella", "Argollas doradas", "Aros de amatista"],
  ["Pulseras", "PU", "Esclava de plata", "Pulsera Toscana", "Hilo rojo y oro", "Pulsera de ámbar", "Eslabones de plata", "Pulsera de turmalina"],
  ["Relojes", "RE", "Reloj Origen", "Reloj Nacarado", "Reloj Palermo", "Reloj Cuarzo Rosa", "Reloj Atenas", "Reloj Clásico"],
];
const nombres = ["Valentina Ruiz", "Camila Torres", "Lucía Herrera", "Mariana López", "Julia Navarro", "Martín Acosta", "Ana Serrano", "Sofía Méndez", "Pedro Sosa", "Florencia Vega"];

async function usuarioDemo(nombre: string, email: string, clave: string, rol: "admin" | "vendedor") {
  const { password, ...datos } = usuarioSchema.parse({ nombre, email, rol, password: clave });
  const base = db();
  const previo = await base.select().from(usuarios).where(eq(usuarios.email, datos.email)).get();
  if (previo) return previo;
  const passwordHash = await hashClave(password);
  return escribir(tx => tx.insert(usuarios).values({ ...datos, passwordHash }).returning().get());
}

async function cargar(base: Base) {
  const remoto = !urlBaseDeDatos().startsWith("file:");
  if (remoto && !["SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD", "SEED_VENDEDOR_EMAIL", "SEED_VENDEDOR_PASSWORD"].every(key => process.env[key])) {
    throw new Error("Configurá ambos usuarios de prueba antes de cargar los datos de Turso.");
  }
  const adminClave = process.env.SEED_ADMIN_PASSWORD || cuentasDemo.admin.password;
  const vendedorClave = process.env.SEED_VENDEDOR_PASSWORD || cuentasDemo.vendedor.password;
  if (remoto && [adminClave, vendedorClave].some(clave => clave === cuentasDemo.admin.password || clave === cuentasDemo.vendedor.password)) {
    throw new Error("Elegí contraseñas para Turso distintas de las cuentas de prueba locales.");
  }
  const adminEmail = process.env.SEED_ADMIN_EMAIL || cuentasDemo.admin.email;
  const vendedorEmail = process.env.SEED_VENDEDOR_EMAIL || cuentasDemo.vendedor.email;
  if (adminEmail.toLowerCase() === vendedorEmail.toLowerCase()) throw new Error("Los dos usuarios necesitan emails diferentes.");
  const admin = await usuarioDemo("Laura Méndez", adminEmail, adminClave, "admin");
  const vendedor = await usuarioDemo("Pablo Ruiz", vendedorEmail, vendedorClave, "vendedor");
  if (admin.rol !== "admin" || vendedor.rol !== "vendedor" || !admin.activo || !vendedor.activo) {
    throw new Error("La carga inicial requiere una cuenta activa por rol.");
  }
  const ahora = new Date();
  const codigos: number[] = [];
  for (const [indice, [nombre, prefijo, ...piezas]] of colecciones.entries()) {
    const categoria = await base.select().from(categorias).where(eq(categorias.nombre, nombre)).get() ?? await crearCategoria(admin, { nombre });
    for (const [i, descripcion] of piezas.entries()) {
      const codigo = prefijo + "-" + String(i + 1).padStart(3, "0");
      const producto = await base.select().from(productos).where(eq(productos.codigo, codigo)).get() ?? await crearProducto(admin, {
        codigo, descripcion, categoriaId: categoria.id, precio: 1_250_000 + indice * 570_000 + i * 440_000,
        stockMinimo: 5, stockInicial: i === 5 ? 3 : 18 + (indice + i) * 2,
      }, new Date(ahora.getTime() - 31 * 86_400_000).toISOString());
      codigos.push(producto.id);
    }
  }
  const compradores: number[] = [];
  for (const [i, nombre] of nombres.entries()) {
    const nroDoc = String(28344200 + i * 10723);
    const cliente = await base.select().from(clientes).where(eq(clientes.nroDoc, nroDoc)).get() ?? await crearCliente(admin, {
      tipoDoc: "DNI", nroDoc, nombre, cuentaCorriente: i < 7, limiteCredito: i < 7 ? 100_000_000 : null,
      domicilio: "San Martín " + (410 + i * 17), telefono: "381 555-" + String(1400 + i),
      email: "cliente" + (i + 1) + "@lumbre.test",
    });
    compradores.push(cliente.id);
  }
  const [{ total }] = await base.select({ total: count() }).from(facturas);
  const vender = codigos.filter((_, i) => i % 6 !== 5);
  for (let i = total; i < 50; i++) {
    const atraso = Math.floor((49 - i) * 29 / 49);
    const dia = fechaArgentina(new Date(ahora.getTime() - atraso * 86_400_000));
    const hora = Date.parse(inicioDia(dia)) + (10 * 60 + i % 2) * 60_000;
    const fecha = new Date(Math.min(ahora.getTime(), hora)).toISOString();
    const forma = i % 5;
    await emitirFactura(i % 3 ? vendedor : admin, {
      clienteId: forma === 2 ? compradores[i % 7] : i % 4 ? null : compradores[i % 10],
      items: [{ productoId: vender[(i * 7 + i % 3) % vender.length], cantidad: i % 6 === 2 ? 2 : 1 }],
      pago: forma === 2 ? { forma: "cuenta_corriente" }
        : forma >= 3 ? { forma: "tarjeta", tarjeta: { tipo: forma === 3 ? "debito" : "credito", marca: "Visa", ultimos4: "2048" } }
        : { forma: "contado" },
    }, fecha);
  }
  const observacion = "Pago parcial de demostración";
  for (const id of [compradores[0], compradores[2], compradores[4]]) {
    const previo = await base.select({ id: pagos.id }).from(pagos).where(and(eq(pagos.clienteId, id), eq(pagos.observacion, observacion))).get();
    if (previo) continue;
    const cliente = await obtenerCliente(vendedor, id);
    if (cliente.activo && cliente.cuentaCorriente && cliente.saldo > 0) {
      await registrarPago(vendedor, id, { importe: Math.min(cliente.saldo, 300_000), medio: "transferencia", observacion });
    }
  }
  console.log("Datos de prueba listos al " + fechaArgentina(ahora) + ".");
}

async function main() {
  const base = db();
  try { await cargar(base); }
  finally { base.$client.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
