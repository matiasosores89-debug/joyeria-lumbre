import { ruta } from "@/adapters/http";
import { listarStock } from "@/services/stock";

export const GET = ruta((usuario, { query }) => listarStock(usuario, query));
