import { ruta } from "@/adapters/http";
import { listarStock, registrarStock } from "@/services/stock";

export const GET = ruta((usuario, { query, id }) => listarStock(usuario, query, id), { id: true });
export const POST = ruta((usuario, { id, body }) => registrarStock(usuario, id, body), { id: true, body: true, status: 201 });
