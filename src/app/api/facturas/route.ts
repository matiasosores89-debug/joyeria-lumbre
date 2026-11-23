import { ruta } from "@/adapters/http";
import { listarFacturas, emitirFactura } from "@/services/facturas";

export const GET = ruta((usuario, { query }) => listarFacturas(usuario, query));
export const POST = ruta((usuario, { body }) => emitirFactura(usuario, body), { body: true, status: 201 });
