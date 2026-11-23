import Link from "next/link";
import { exigirSesion } from "@/auth/session";
import { listarUsuarios } from "@/services/usuarios";
import type { Query } from "@/services/comun";
import { filtro, filtrosPagina } from "@/lib/page-data";
import { Encabezado, Filtros, Paginador, Panel, Tabla } from "@/components/shared";
import { EditorUsuario, EstadoUsuario, RestablecerUsuario } from "@/components/usuarios-forms";
import { Campo, Selector } from "@/components/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Usuarios" };

export default async function Usuarios({ searchParams }: { searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  if (usuario.rol !== "admin") return <><Encabezado titulo="Acceso restringido" descripcion="La administración de usuarios requiere el rol de administrador." /><Button asChild><Link href="/">Volver a inicio</Link></Button></>;
  const query = filtrosPagina(await searchParams);
  const usuarios = await listarUsuarios(usuario, query);
  return <>
    <Encabezado titulo="Usuarios" descripcion="Administrá las cuentas del personal y sus permisos." acciones={<EditorUsuario />} />
    <Panel listado key={usuarios.page + JSON.stringify(query)}>
      <Filtros ruta="/usuarios">
        <Campo name="q" label="Buscar" placeholder="Nombre o email" defaultValue={filtro(query, "q")} className="w-full sm:w-60" />
        <Selector name="activo" label="Estado" defaultValue={filtro(query, "activo") ?? "todos"}><option value="todos">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></Selector>
      </Filtros>
      <Tabla columnas={["Nombre", "Rol", "Estado", ""]} vacia={!usuarios.data.length}>
        {usuarios.data.map(u => <tr key={u.id}>
          <td><strong>{u.nombre}</strong><span className="block text-xs text-muted-foreground">{u.email}</span></td>
          <td><Badge>{u.rol === "admin" ? "Administrador" : "Vendedor"}</Badge></td>
          <td><Badge tone={u.activo ? "green" : "neutral"}>{u.activo ? "Activo" : "Inactivo"}</Badge></td>
          <td><div className="flex flex-wrap justify-end gap-1.5"><EditorUsuario usuario={u} esPropio={u.id === usuario.id} />
            {u.id !== usuario.id && <><RestablecerUsuario usuario={u} /><EstadoUsuario usuario={u} /></>}</div></td>
        </tr>)}
      </Tabla>
      <Paginador data={usuarios} query={query} ruta="/usuarios" />
    </Panel>
  </>;
}
