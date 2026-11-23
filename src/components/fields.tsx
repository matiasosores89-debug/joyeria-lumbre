import type { ComponentProps, ReactNode } from "react";
import { Input, inputStyle } from "./ui/input";
import { cn } from "@/lib/utils";

type Etiqueta = { label: string; error?: string };
type FieldProps = ComponentProps<"input"> & Etiqueta;

export function Campo({ label, error, className, ...props }: FieldProps) {
  return <label className={cn("grid min-w-0 gap-1.5 text-sm font-medium", className)}>
    <span>{label}</span><Input {...props} aria-invalid={!!error} />
    {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
  </label>;
}

export function Selector({ label, error, className, children, ...props }: ComponentProps<"select"> & Etiqueta) {
  return <label className={cn("grid min-w-0 gap-1.5 text-sm font-medium", className)}>
    <span>{label}</span><select {...props} aria-invalid={!!error} className={inputStyle}>{children}</select>
    {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
  </label>;
}

export function TextoLargo({ label, error, ...props }: ComponentProps<"textarea"> & Etiqueta) {
  return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>
    <textarea {...props} aria-invalid={!!error} className={cn(inputStyle, "min-h-20 py-2")} />
    {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
  </label>;
}

export function Check({ children, ...props }: ComponentProps<"input"> & { children: ReactNode }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" {...props} />{children}</label>;
}

export function CampoDinero(props: FieldProps) {
  return <Campo placeholder="0,00" inputMode="decimal" {...props} />;
}

export function centavos(texto: string) {
  const valor = texto.trim().replace(/\s/g, "");
  if (!/^(?:\d+(?:[.,]\d{1,2})?|\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)$/.test(valor)) return NaN;
  const normalizado = valor.includes(",") || /^\d{1,3}(?:\.\d{3})+$/.test(valor) ? valor.replace(/\./g, "").replace(",", ".") : valor;
  const [entero, decimal = ""] = normalizado.split(".");
  return Number(entero) * 100 + Number(decimal.padEnd(2, "0"));
}

export const dineroEditable = (importe: number) => (importe / 100).toFixed(2).replace(".", ",");
export const valor = (form: FormData, nombre: string) => String(form.get(nombre) ?? "").trim();
export const entero = (form: FormData, nombre: string) => valor(form, nombre) ? Number(valor(form, nombre)) : NaN;
