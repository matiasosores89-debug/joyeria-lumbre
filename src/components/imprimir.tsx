"use client";

import { PrinterIcon as Printer } from "@phosphor-icons/react/dist/ssr/Printer";
import { Button } from "./ui/button";

export function Imprimir() {
  return <Button type="button" variant="outline" onClick={() => window.print()}><Printer /> Imprimir</Button>;
}
