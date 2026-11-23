import "dotenv/config";
import { randomBytes } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db, urlBaseDeDatos } from "../src/db";

async function main() {
  const conexion = db();
  try {
    const local = urlBaseDeDatos().startsWith("file:");
    if (local) await conexion.$client.execute("PRAGMA journal_mode = WAL");
    await migrate(conexion, { migrationsFolder: "drizzle" });

    if (local && !process.env.AUTH_SECRET) {
      const entorno = await readFile(".env.local", "utf8").catch(error => {
        if (error.code === "ENOENT") return "";
        throw error;
      });
      if (!/^AUTH_SECRET=.+$/m.test(entorno)) {
        await appendFile(".env.local", "\nAUTH_SECRET=" + randomBytes(32).toString("hex") + "\n", { mode: 0o600 });
      }
    }
    console.log("Migraciones aplicadas.");
  } finally {
    conexion.$client.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
