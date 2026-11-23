import type { ReactNode } from "react";
import { fechaHora } from "@/lib/format";
import { Marca } from "./layout";
import { Card } from "./ui/card";

export function Comprobante({ tipo, numero, fecha, children }: { tipo: string; numero: string; fecha: string; children: ReactNode }) {
  return <Card className="print-area mx-auto max-w-3xl overflow-hidden px-5 py-6 sm:px-8 sm:py-7">
    <div className="flex flex-wrap justify-between gap-5 border-b border-border pb-5">
      <div><Marca /><p className="mt-2 text-xs text-muted-foreground">Lumbre Joyas · San Miguel de Tucumán, Argentina</p></div>
      <div className="sm:text-right"><h2 className="font-display text-2xl">{tipo}</h2><p className="mt-1 font-mono text-sm font-semibold">{numero}</p><p className="mt-0.5 text-xs text-muted-foreground">{fechaHora(fecha)}</p></div>
    </div>
    {children}
    <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">Comprobante interno sin validez fiscal.</p>
  </Card>;
}
