import { compare, hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, escribir } from "../db";
import { usuarios } from "../db/schema";
import { claveSchema, loginSchema } from "../lib/validacion";
import { ApiError, existe, validar, type Usuario } from "./comun";

const hashVacio = "$2b$12$qH7bqKgsN0zbkVLePVaXGuCyQoWxZGJxDpkB4UTlqCbiYvn.nk6n2";
export const publicUser = { id: usuarios.id, nombre: usuarios.nombre, email: usuarios.email, rol: usuarios.rol };
export const hashClave = (clave: string) => hash(clave, 12);

// RF-U1: el mismo mensaje para cuentas inexistentes, inactivas o con clave incorrecta.
export async function ingresar(input: unknown) {
  const { email, password } = validar(loginSchema, input);
  const [fila] = await db().select({ ...publicUser, activo: usuarios.activo, hash: usuarios.passwordHash, version: usuarios.versionSesion })
    .from(usuarios).where(eq(usuarios.email, email));
  const coincide = await compare(password, fila?.hash ?? hashVacio);
  if (!coincide || !fila?.activo) throw new ApiError(401, "CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.");
  const { id, nombre, rol, version } = fila;
  return { usuario: { id, nombre, email, rol }, version };
}

// RF-U2: una cookie válida debe corresponder a un usuario activo y a su versión vigente.
export async function usuarioSesion(id: number, version: number) {
  const [usuario] = await db().select(publicUser).from(usuarios).where(and(
    eq(usuarios.id, id), eq(usuarios.activo, true), eq(usuarios.versionSesion, version),
  ));
  return usuario;
}

// RF-U5: el cambio invalida las sesiones anteriores.
export async function cambiarClave(usuario: Usuario, input: unknown) {
  const { actual, nueva } = validar(claveSchema, input);
  const [fila] = await db().select().from(usuarios).where(eq(usuarios.id, usuario.id));
  const dato = existe(fila, "El usuario");
  if (!await compare(actual, dato.passwordHash)) throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual es incorrecta.", [{ campo: "actual", mensaje: "La contraseña actual es incorrecta." }]);
  const passwordHash = await hashClave(nueva);
  return escribir(async tx => {
    const version = dato.versionSesion + 1;
    const [resultado] = await tx.update(usuarios).set({ passwordHash, versionSesion: version })
      .where(and(eq(usuarios.id, usuario.id), eq(usuarios.versionSesion, dato.versionSesion))).returning({ id: usuarios.id });
    if (!resultado) throw new ApiError(401, "NO_AUTENTICADO", "Volvé a iniciar sesión.");
    return version;
  });
}
