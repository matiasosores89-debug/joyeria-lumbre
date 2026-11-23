import { exigirSesion } from "@/auth/session";
import { listarClientes } from "@/services/clientes";
import type { Query } from "@/services/comun";
import { filtrosPagina } from "@/lib/page-data";
import { Encabezado, Pestanas } from "@/components/shared";
import { EditorCliente } from "@/components/clientes-forms";
import { ListadoClientes } from "@/components/clientes-listado";

export const metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = filtrosPagina(await searchParams);
  const data = await listarClientes(usuario, query);
  return <>
    <Encabezado titulo="Clientes" descripcion="Compradores, contactos y cuentas corrientes." acciones={<EditorCliente />} />
    <Pestanas items={[{ href: "/clientes", nombre: "Directorio", activo: true }, { href: "/clientes/saldos", nombre: "Saldos", activo: false }]} />
    <ListadoClientes clientes={data} query={query} />
  </>;
}
