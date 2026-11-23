import { redirect } from "next/navigation";
import { sesion } from "@/auth/session";
import { Acceso } from "@/components/acceso";

export const metadata = { title: "Ingresar" };

export default async function Login() {
  if (await sesion()) redirect("/");
  return <Acceso />;
}
