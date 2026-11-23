"use client";

import { Printer } from "lucide-react";
import { Button } from "./ui/button";

export function Imprimir() {
  return <Button type="button" variant="outline" onClick={() => window.print()}><Printer /> Imprimir</Button>;
}
