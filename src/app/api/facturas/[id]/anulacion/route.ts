import { ruta } from "@/adapters/http";
import { anularFactura } from "@/services/facturas";

export const POST = ruta((usuario, { id, body }) => anularFactura(usuario, id, body), { id: true, body: true });
