import { redirect } from "next/navigation";
import { configuracionDemo } from "@/auth/demo";
import { sesion } from "@/auth/session";
import { Acceso } from "@/components/acceso";
import { urlBaseDeDatos } from "@/db";
import { cuentasDemo } from "@/lib/cuentas-demo";

export const metadata = { title: "Ingresar" };

export default async function Login() {
  if (await sesion()) redirect("/");
  const habilitado = process.env.NODE_ENV === "development" &&
    !process.env.VERCEL && urlBaseDeDatos().startsWith("file:");
  const cuentas = habilitado ? {
    admin: cuentaLocal(cuentasDemo.admin, process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD),
    vendedor: cuentaLocal(cuentasDemo.vendedor, process.env.SEED_VENDEDOR_EMAIL, process.env.SEED_VENDEDOR_PASSWORD),
  } : undefined;
  return <Acceso cuentas={cuentas} demoHabilitada={!!configuracionDemo()} />;
}

function cuentaLocal(cuenta: { email: string; password: string }, email?: string, password?: string) {
  return (!email || email === cuenta.email) && (!password || password === cuenta.password) ? cuenta : undefined;
}
