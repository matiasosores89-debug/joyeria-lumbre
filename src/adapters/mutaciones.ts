import { cambiarClave, ingresar } from "@/services/auth";
import { crearUsuario, editarUsuario, restablecerClave } from "@/services/usuarios";
import { crearCategoria, editarCategoria } from "@/services/categorias";
import { crearProducto, editarProducto } from "@/services/productos";
import { registrarStock } from "@/services/stock";
import { crearCliente, editarCliente } from "@/services/clientes";
import { registrarPago } from "@/services/pagos";
import { anularFactura } from "@/services/facturas";
import { abrirSesion, cerrarSesion } from "@/auth/session";
import type { Usuario } from "@/services/comun";

export async function iniciar(body: unknown) {
  const resultado = await ingresar(body);
  await abrirSesion(resultado.usuario.id, resultado.version);
  return resultado.usuario;
}

export async function guardarClave(usuario: Usuario, body: unknown) {
  const version = await cambiarClave(usuario, body);
  await abrirSesion(usuario.id, version);
}

export const mutaciones = {
  salir: (_u: Usuario) => cerrarSesion(),
  clave: (u: Usuario, _id: number, body: unknown) => guardarClave(u, body),
  crearUsuario: (u: Usuario, _id: number, body: unknown) => crearUsuario(u, body),
  editarUsuario,
  restablecerClave,
  crearCategoria: (u: Usuario, _id: number, body: unknown) => crearCategoria(u, body),
  editarCategoria,
  crearProducto: (u: Usuario, _id: number, body: unknown) => crearProducto(u, body),
  editarProducto,
  registrarStock,
  crearCliente: (u: Usuario, _id: number, body: unknown) => crearCliente(u, body),
  editarCliente,
  registrarPago,
  anularFactura,
} satisfies Record<string, (usuario: Usuario, id: number, body: unknown) => Promise<unknown>>;
