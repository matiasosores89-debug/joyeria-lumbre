export const iconosCategoria = [
  "diamante", "anillo", "aros", "cadena", "destello", "reloj", "corazon", "regalo", "luna",
] as const;

export type IconoCategoria = (typeof iconosCategoria)[number];
