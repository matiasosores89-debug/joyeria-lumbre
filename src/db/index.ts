import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

let conexion: (LibSQLDatabase<typeof schema> & { $client: Client }) | undefined;

export function db() {
  if (conexion) return conexion;
  const url = process.env.DATABASE_URL || "file:lumbre.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  if ((process.env.VERCEL || !url.startsWith("file:")) && (!authToken || url.startsWith("file:"))) {
    throw new Error("La conexión remota requiere DATABASE_URL de Turso y TURSO_AUTH_TOKEN.");
  }
  conexion = drizzle(createClient({ url, authToken }), { schema });
  return conexion;
}

export type Base = ReturnType<typeof db>;
export type Tx = Parameters<Parameters<Base["transaction"]>[0]>[0];
export type Consulta = Base | Tx;

let turno = Promise.resolve();

function bloqueo(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if ("code" in error && typeof error.code === "string" && error.code.startsWith("SQLITE_BUSY")) return true;
  return bloqueo(error.cause);
}

// libSQL inicia en modo write. Un bloqueo explícito permite reintentar la transacción.
async function transaccion<T>(operacion: (tx: Tx) => Promise<T>): Promise<T> {
  for (const demora of [25, 70, 160]) {
    try { return await db().transaction(operacion); }
    catch (error) {
      if (!bloqueo(error)) throw error;
      await new Promise(resolve => setTimeout(resolve, demora));
    }
  }
  return db().transaction(operacion);
}

// La cola evita competir por el mismo archivo desde solicitudes locales.
export async function escribir<T>(operacion: (tx: Tx) => Promise<T>): Promise<T> {
  if (!(process.env.DATABASE_URL || "file:lumbre.db").startsWith("file:")) return transaccion(operacion);

  const anterior = turno;
  let liberar!: () => void;
  turno = new Promise<void>(resolve => { liberar = resolve; });
  await anterior;
  try {
    return await transaccion(operacion);
  } finally {
    liberar();
  }
}
