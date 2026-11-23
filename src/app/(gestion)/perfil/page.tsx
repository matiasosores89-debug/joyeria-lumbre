import { exigirSesion } from "@/auth/session";
import { Encabezado, Panel } from "@/components/shared";
import { CambiarContrasena } from "@/components/usuarios-forms";

export const metadata = { title: "Mi perfil" };

export default async function Perfil() {
  const usuario = await exigirSesion();
  return <>
    <Encabezado titulo="Mi perfil" descripcion={usuario.nombre + " · " + usuario.email} />
    <Panel titulo="Cambiar contraseña"><CambiarContrasena /></Panel>
  </>;
}
