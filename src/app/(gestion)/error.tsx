"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/shared";

export default function ErrorGestion({ reset }: { reset: () => void }) {
  return <Panel className="p-6" titulo="No se pudo cargar la pantalla">
    <p className="px-5 text-sm text-muted-foreground">Revisá los filtros o volvé a intentar.</p>
    <div className="flex flex-wrap gap-2 px-5 pt-4"><Button onClick={reset}>Reintentar</Button><Button asChild variant="outline"><Link href="/">Volver a inicio</Link></Button></div>
  </Panel>;
}
