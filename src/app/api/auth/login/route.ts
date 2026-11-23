import { iniciar } from "@/adapters/mutaciones";
import { rutaPublica } from "@/adapters/http";
export const POST = rutaPublica(iniciar);
