"use client";

import { Ban } from "lucide-react";
import { anulacionSchema } from "@/lib/validacion";
import { TextoLargo, valor } from "./fields";
import { FormModal } from "./form-modal";
import { Button } from "./ui/button";

export function Anular({ id }: { id: number }) {
  return <FormModal titulo="Anular factura" descripcion="Se repondrá el stock y se revertirá el débito de la cuenta corriente. Si queda dinero cobrado de más, se indicará el importe a reintegrar."
    schema={anulacionSchema} operacion="anularFactura" id={id} peligro boton="Confirmar anulación" exito="Factura anulada."
    trigger={<Button variant="outline" className="text-destructive"><Ban /> Anular factura</Button>}
    armar={data => ({ motivo: valor(data, "motivo") })}
    campos={errores => <TextoLargo label="Motivo de anulación" name="motivo" error={errores.motivo} required />} />;
}
