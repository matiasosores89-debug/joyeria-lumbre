"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ZodType } from "zod";
import { mutarAction } from "@/app/actions";
import { Aviso, type AvisoTipo } from "./feedback";
import { useFormulario } from "./form-hook";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";

export type Operacion = Parameters<typeof mutarAction>[0];
type Props = {
  titulo: string; descripcion?: string; trigger: ReactNode; schema: ZodType; operacion: Operacion; id?: number;
  armar: (data: FormData) => unknown; campos?: (errores: Record<string, string>) => ReactNode;
  alGuardar?: (data: unknown) => void; boton?: string; exito?: string; peligro?: boolean;
};

export function FormModal({ titulo, descripcion, trigger, schema, operacion, id, armar, campos, alGuardar, boton = "Guardar", exito = "Cambios guardados.", peligro }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<AvisoTipo>();
  const router = useRouter();
  return <div className="grid gap-2">
    <Modal open={abierto} onOpenChange={setAbierto} title={titulo} description={descripcion} trigger={trigger}>
      {abierto && <FormularioModal schema={schema} operacion={operacion} id={id} armar={armar} campos={campos} boton={boton} peligro={peligro}
        alGuardar={data => {
          setAbierto(false);
          setAviso({ texto: exito });
          alGuardar?.(data);
          router.refresh();
        }} cancelar={() => setAbierto(false)} />}
    </Modal>
    <Aviso aviso={aviso} cerrar={() => setAviso(undefined)} />
  </div>;
}

function FormularioModal({ schema, operacion, id, armar, campos, alGuardar, boton, peligro, cancelar }: Omit<Props, "titulo" | "trigger"> & { cancelar: () => void }) {
  const form = useFormulario({ schema, enviar: body => mutarAction(operacion, id ?? null, body), alGuardar });
  return <form noValidate className="grid gap-4" onSubmit={form.submit(armar)}>
    {campos?.(form.errores)}
    <Aviso aviso={form.aviso} />
    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
      <Button type="button" variant="outline" onClick={cancelar} disabled={form.guardando}>Cancelar</Button>
      <Button type="submit" variant={peligro ? "destructive" : "default"} disabled={form.guardando}>{form.guardando ? "Guardando…" : boton}</Button>
    </div>
  </form>;
}
