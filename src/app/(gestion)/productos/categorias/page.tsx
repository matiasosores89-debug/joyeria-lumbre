import { exigirSesion } from "@/auth/session";
import { listarCategorias } from "@/services/categorias";
import { Encabezado, Panel, Tabla } from "@/components/shared";
import { EditorCategoria, EstadoCategoria } from "@/components/productos-forms";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Categorías" };

export default async function Categorias() {
  const usuario = await exigirSesion();
  const esAdmin = usuario.rol === "admin";
  const categorias = await listarCategorias(usuario, esAdmin ? { todas: "true" } : {});
  return <>
    <Encabezado titulo="Categorías" volver={{ href: "/productos", label: "Productos" }} acciones={esAdmin && <EditorCategoria />} />
    <Panel><Tabla columnas={["Nombre", "Estado", ...(esAdmin ? [""] : [])]} vacia={!categorias.length}>
      {categorias.map(c => <tr key={c.id}><td className="font-semibold">{c.nombre}</td><td><Badge tone={c.activa ? "green" : "neutral"}>{c.activa ? "Activa" : "Inactiva"}</Badge></td>
        {esAdmin && <td><div className="flex flex-wrap justify-end gap-2"><EditorCategoria categoria={c} /><EstadoCategoria categoria={c} /></div></td>}
      </tr>)}
    </Tabla></Panel>
  </>;
}
