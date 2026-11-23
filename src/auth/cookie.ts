import { jwtVerify, SignJWT } from "jose";

export const cookieSesion = "lumbre_sesion";
const vigencia = 60 * 60 * 8;
const emisor = "joyeria-lumbre";

function clave() {
  const valor = process.env.AUTH_SECRET;
  if (!valor || valor.length < 32) throw new Error("Configurá AUTH_SECRET con 32 caracteres o más.");
  return new TextEncoder().encode(valor);
}

export async function firmarSesion(id: number, version: number) {
  return new SignJWT({ version }).setProtectedHeader({ alg: "HS256" }).setSubject(String(id))
    .setIssuer(emisor).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1000) + vigencia).sign(clave());
}

export async function verificarSesion(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { issuer: emisor, algorithms: ["HS256"] });
    const id = Number(payload.sub);
    const version = payload.version;
    if (id > 0 && Number.isSafeInteger(id) && typeof version === "number" && Number.isSafeInteger(version)) return { id, version };
  } catch {
    return null;
  }
  return null;
}

export const opcionesCookie = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: vigencia } as const;
