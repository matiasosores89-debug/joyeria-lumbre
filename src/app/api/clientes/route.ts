import { ruta } from "@/adapters/http";
import { listarClientes, crearCliente } from "@/services/clientes";

export const GET = ruta((usuario, { query }) => listarClientes(usuario, query));
export const POST = ruta((usuario, { body }) => crearCliente(usuario, body), { body: true, status: 201 });
