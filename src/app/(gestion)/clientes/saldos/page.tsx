import { exigirSesion } from "@/auth/session";
import { listarClientes } from "@/services/clientes";
import type { Query } from "@/services/comun";
import { filtrosPagina } from "@/lib/page-data";
import { Encabezado, Pestanas } from "@/components/shared";
import { ListadoClientes } from "@/components/clientes-listado";

export const metadata = { title: "Saldos" };

export default async function Saldos({ searchParams }: { searchParams: Promise<Query> }) {
  const usuario = await exigirSesion();
  const query = filtrosPagina(await searchParams);
  const data = await listarClientes(usuario, { ...query, conDeuda: "true", orden: "saldo" });
  return <>
    <Encabezado titulo="Saldos pendientes" descripcion="Deuda de clientes, de mayor a menor." />
    <Pestanas items={[{ href: "/clientes", nombre: "Directorio", activo: false }, { href: "/clientes/saldos", nombre: "Saldos", activo: true }]} />
    <ListadoClientes clientes={data} query={query} saldo />
  </>;
}
