"use client";

import { useRef, useState, type FormEvent } from "react";
import type { ZodType } from "zod";
import type { AvisoTipo } from "./feedback";

type Resultado = { ok: true; data: unknown } | { ok: false; error: { message: string; details?: unknown } };
type Config = { schema: ZodType; enviar: (body: unknown) => Promise<Resultado>; alGuardar?: (data: unknown) => void; exito?: string };

export function useFormulario({ schema, enviar, alGuardar, exito = "Cambios guardados." }: Config) {
  const ocupado = useRef(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<AvisoTipo>();

  function limpiarAvisos() {
    setErrores({});
    setAviso(undefined);
  }

  async function enviarDatos(body: unknown) {
    if (ocupado.current) return;
    limpiarAvisos();
    const validado = schema.safeParse(body);
    if (!validado.success) {
      setErrores(Object.fromEntries(validado.error.issues.map(issue => [issue.path.join("."), issue.message])));
      setAviso({ texto: "Revisá los campos indicados.", error: true });
      return;
    }
    ocupado.current = true;
    setGuardando(true);
    try {
      const respuesta = await enviar(validado.data);
      if (respuesta.ok) {
        setAviso({ texto: exito });
        alGuardar?.(respuesta.data);
      } else {
        const details = respuesta.error.details;
        if (Array.isArray(details)) {
          setErrores(Object.fromEntries(details.filter(fila => fila && typeof fila.campo === "string" && typeof fila.mensaje === "string")
            .map(fila => [fila.campo, fila.mensaje])));
        }
        setAviso({ texto: respuesta.error.message, error: true });
      }
    } catch {
      setAviso({ texto: "No pudimos obtener una respuesta. Verificá el resultado antes de repetir la operación.", error: true });
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  }

  function submit(armar: (data: FormData) => unknown) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void enviarDatos(armar(new FormData(event.currentTarget)));
    };
  }

  return { submit, enviarDatos, guardando, errores, aviso, limpiarAvisos };
}
