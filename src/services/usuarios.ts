import { randomBytes } from "node:crypto";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { db, escribir } from "../db";
import { usuarios } from "../db/schema";
import { usuarioPatch, usuarioSchema, usuariosQuery } from "../lib/validacion";
import { hashClave, publicUser } from "./auth";
import { admin, ApiError, count, existe, pagina, validar, type Usuario } from "./comun";

const seleccion = { ...publicUser, activo: usuarios.activo };

// RF-U4: listado administrativo sin hashes.
export async function listarUsuarios(usuario: Usuario, input: unknown) {
  const p = validar(usuariosQuery, input);
  admin(usuario);
  const q = p.q?.toLowerCase();
  const filtro = and(
    p.activo && p.activo !== "todos" ? eq(usuarios.activo, p.activo === "true") : undefined,
    q ? or(sql`instr(lower(${usuarios.nombre}), ${q}) > 0`, sql`instr(lower(${usuarios.email}), ${q}) > 0`) : undefined,
  );
  const [data, [resultado]] = await Promise.all([
    db().select(seleccion).from(usuarios).where(filtro).orderBy(asc(usuarios.nombre)).limit(p.pageSize).offset((p.page - 1) * p.pageSize),
    db().select({ total: count() }).from(usuarios).where(filtro),
  ]);
  return pagina(data, p, resultado.total);
}

// RF-U4: alta con email único.
export async function crearUsuario(usuario: Usuario, input: unknown) {
  const { password, ...datos } = validar(usuarioSchema, input);
  admin(usuario);
  const passwordHash = await hashClave(password);
  return escribir(async tx => {
    if (await tx.select().from(usuarios).where(eq(usuarios.email, datos.email)).get()) {
      throw new ApiError(409, "EMAIL_DUPLICADO", "Ese email ya está registrado.");
    }
    return tx.insert(usuarios).values({ ...datos, passwordHash }).returning(seleccion).get();
  });
}

// RF-U4: edición y desactivación, con protección de la cuenta propia.
export async function editarUsuario(usuario: Usuario, id: number, input: unknown) {
  const datos = validar(usuarioPatch, input);
  admin(usuario);
  if (usuario.id === id && (datos.activo === false || datos.rol === "vendedor")) {
    throw new ApiError(422, "OPERACION_SOBRE_SI_MISMO", "No podés quitarte el rol de administrador ni desactivar tu cuenta.");
  }
  return escribir(async tx => {
    const actual = existe(await tx.select().from(usuarios).where(eq(usuarios.id, id)).get(), "El usuario");
    if (datos.email && datos.email !== actual.email && await tx.select().from(usuarios).where(eq(usuarios.email, datos.email)).get()) {
      throw new ApiError(409, "EMAIL_DUPLICADO", "Ese email ya está registrado.");
    }
    const revocar = datos.activo === false || (datos.rol && datos.rol !== actual.rol);
    return tx.update(usuarios).set({ ...datos, versionSesion: actual.versionSesion + Number(Boolean(revocar)) })
      .where(eq(usuarios.id, id)).returning(seleccion).get();
  });
}

// RF-U5: contraseña temporal generada en el servidor.
export async function restablecerClave(usuario: Usuario, id: number) {
  admin(usuario);
  const passwordTemporal = randomBytes(12).toString("base64url");
  const passwordHash = await hashClave(passwordTemporal);
  await escribir(async tx => {
    existe(await tx.update(usuarios).set({ passwordHash, versionSesion: sql`${usuarios.versionSesion} + 1` })
      .where(eq(usuarios.id, id)).returning({ id: usuarios.id }).get(), "El usuario");
  });
  return { passwordTemporal };
}
