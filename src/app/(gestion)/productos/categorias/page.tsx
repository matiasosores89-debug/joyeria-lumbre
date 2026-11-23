import { exigirSesion } from "@/auth/session";
import { listarCategorias } from "@/services/categorias";
import { CategoriasTabla } from "@/components/categorias-tabla";
import { Encabezado } from "@/components/shared";
import { EditorCategoria } from "@/components/productos-forms";

export const metadata = { title: "Categorías" };

export default async function Categorias() {
  const usuario = await exigirSesion();
  const esAdmin = usuario.rol === "admin";
  const categorias = await listarCategorias(usuario, esAdmin ? { todas: "true" } : {});
  return <>
    <Encabezado titulo="Categorías" volver={{ href: "/productos", label: "Productos" }} acciones={esAdmin && <EditorCategoria />} />
    <CategoriasTabla categorias={categorias} editable={esAdmin} />
  </>;
}
