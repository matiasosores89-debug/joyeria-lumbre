import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { accesoDemoSchema, loginSchema } from "@/lib/validacion";

const configSchema = z.object({
  clave: accesoDemoSchema.shape.claveDemo,
  cuentas: z.object({ admin: loginSchema, vendedor: loginSchema }),
});

export function configuracionDemo() {
  const valor = process.env.LUMBRE_DEMO_ACCESS;
  if (!valor) return undefined;
  try {
    return configSchema.safeParse(JSON.parse(valor)).data;
  } catch {
    return undefined;
  }
}

export function credencialesDemo({ rol, claveDemo }: z.infer<typeof accesoDemoSchema>) {
  const config = configuracionDemo();
  if (!config || !timingSafeEqual(Buffer.from(claveDemo), Buffer.from(config.clave))) return undefined;
  return config.cuentas[rol];
}
