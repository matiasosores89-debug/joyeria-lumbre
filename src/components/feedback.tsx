"use client";

import { CheckCircleIcon as CheckCircle2 } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { WarningCircleIcon as CircleAlert } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { XIcon as X } from "@phosphor-icons/react/dist/ssr/X";
import { Button } from "./ui/button";

export type AvisoTipo = { texto: string; error?: boolean };

export function Aviso({ aviso, cerrar }: { aviso?: AvisoTipo; cerrar?: () => void }) {
  if (!aviso) return null;
  const Icon = aviso.error ? CircleAlert : CheckCircle2;
  return <div role={aviso.error ? "alert" : "status"} className={aviso.error ? "flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-900" : "flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"}>
    <Icon size={17} className="mt-0.5 shrink-0" /><span className="grow">{aviso.texto}</span>
    {cerrar && <Button type="button" variant="ghost" size="sm" className="h-6 px-1" aria-label="Cerrar aviso" onClick={cerrar}><X /></Button>}
  </div>;
}
