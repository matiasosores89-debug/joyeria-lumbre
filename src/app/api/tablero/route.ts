import { ruta } from "@/adapters/http";
import { cargarTablero } from "@/services/tablero";

export const GET = ruta(cargarTablero);
