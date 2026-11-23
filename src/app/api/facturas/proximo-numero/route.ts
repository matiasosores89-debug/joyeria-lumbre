import { ruta } from "@/adapters/http";
import { proximoNumero } from "@/services/facturas";

export const GET = ruta(proximoNumero);
