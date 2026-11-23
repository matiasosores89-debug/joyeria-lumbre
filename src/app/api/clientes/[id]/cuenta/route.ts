import { ruta } from "@/adapters/http";
import { cuentaCliente } from "@/services/clientes";

export const GET = ruta((usuario, { id, query }) => cuentaCliente(usuario, id, query), { id: true });
