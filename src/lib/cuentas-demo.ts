export const cuentasDemo = {
  admin: { email: "admin@lumbre.test", password: "LumbreAdmin2026!" },
  vendedor: { email: "ventas@lumbre.test", password: "LumbreVentas2026!" },
} as const;

export type RolDemo = keyof typeof cuentasDemo;
