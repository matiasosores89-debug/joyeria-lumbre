"use client";

import { useState } from "react";
import { CopySimpleIcon as Copy } from "@phosphor-icons/react/dist/ssr/CopySimple";
import { KeyIcon as KeyRound } from "@phosphor-icons/react/dist/ssr/Key";
import { PencilSimpleLineIcon as Pencil } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { UserPlusIcon as UserPlus } from "@phosphor-icons/react/dist/ssr/UserPlus";
import { z } from "zod";
import { mutarAction } from "@/app/actions";
import { claveSchema, usuarioPatch, usuarioSchema } from "@/lib/validacion";
import type { listarUsuarios } from "@/services/usuarios";
import { Campo, Selector, valor } from "./fields";
import { Aviso } from "./feedback";
import { FormModal } from "./form-modal";
import { useFormulario } from "./form-hook";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";

type Usuario = Awaited<ReturnType<typeof listarUsuarios>>["data"][number];

export function EditorUsuario({ usuario, esPropio = false }: { usuario?: Usuario; esPropio?: boolean }) {
  return <FormModal titulo={usuario ? "Editar usuario" : "Nuevo usuario"} operacion={usuario ? "editarUsuario" : "crearUsuario"}
    id={usuario?.id} schema={usuario ? usuarioPatch : usuarioSchema} exito={usuario ? "Usuario actualizado." : "Usuario creado."}
    trigger={<Button variant={usuario ? "outline" : "default"} size={usuario ? "sm" : "default"}>{usuario ? <Pencil /> : <UserPlus />}{usuario ? "Editar" : "Nuevo usuario"}</Button>}
    armar={data => ({
      nombre: valor(data, "nombre"), email: valor(data, "email"),
      ...(!esPropio ? { rol: valor(data, "rol") } : {}),
      ...(!usuario ? { password: String(data.get("password") ?? "") } : {}),
    })}
    campos={errores => <>
      <Campo label="Nombre" name="nombre" defaultValue={usuario?.nombre} error={errores.nombre} required />
      <Campo label="Email" name="email" type="email" defaultValue={usuario?.email} error={errores.email} required />
      <Selector label="Rol" name="rol" disabled={esPropio} defaultValue={usuario?.rol ?? "vendedor"} error={errores.rol}><option value="vendedor">Vendedor</option><option value="admin">Administrador</option></Selector>
      {!usuario && <Campo label="Contraseña temporal" name="password" type="password" autoComplete="new-password" error={errores.password} required />}
    </>} />;
}

export function EstadoUsuario({ usuario }: { usuario: Usuario }) {
  const activar = !usuario.activo;
  const texto = activar ? "Reactivar" : "Desactivar";
  return <FormModal titulo={texto + " usuario"} descripcion={activar ? "El usuario podrá iniciar sesión nuevamente." : "El usuario perderá acceso al sistema y su historial seguirá vinculado a su cuenta."}
    trigger={<Button variant="ghost" size="sm">{texto}</Button>} boton={texto} peligro={!activar}
    schema={usuarioPatch} operacion="editarUsuario" id={usuario.id} armar={() => ({ activo: activar })} />;
}

export function RestablecerUsuario({ usuario }: { usuario: Usuario }) {
  const [abierto, setAbierto] = useState(false);
  const [clave, setClave] = useState("");
  const [copiado, setCopiado] = useState(false);
  const form = useFormulario({ schema: z.null(), enviar: data => mutarAction("restablecerClave", usuario.id, data), alGuardar: data => {
    setClave((data as { passwordTemporal: string }).passwordTemporal);
  } });
  return <Modal open={abierto} onOpenChange={value => {
    if (form.guardando) return;
    setAbierto(value);
    if (!value) { setClave(""); setCopiado(false); }
  }} title="Restablecer contraseña" description={clave ? "Copiá la contraseña temporal antes de cerrar esta ventana." : "Se invalidarán las sesiones abiertas de " + usuario.nombre + "."}
    trigger={<Button variant="ghost" size="sm" aria-label={"Restablecer contraseña de " + usuario.nombre}><KeyRound /> Contraseña</Button>}>
    {clave ? <div className="grid gap-3">
      <code className="select-all break-all rounded-lg bg-muted p-3">{clave}</code>
      <Button type="button" variant="outline" onClick={() => { void navigator.clipboard?.writeText(clave).then(() => setCopiado(true)).catch(() => undefined); }}><Copy />{copiado ? "Copiada" : "Copiar contraseña"}</Button>
    </div> : <div className="grid gap-3">
      {form.aviso?.error && <Aviso aviso={form.aviso} />}
      <Button type="button" disabled={form.guardando} onClick={() => form.enviarDatos(null)}>{form.guardando ? "Generando…" : "Generar contraseña temporal"}</Button>
    </div>}
  </Modal>;
}

export function CambiarContrasena() {
  const form = useFormulario({ schema: claveSchema, enviar: body => mutarAction("clave", null, body), exito: "Contraseña actualizada." });
  return <form noValidate className="grid w-full max-w-md gap-4 px-5 pb-5" onSubmit={form.submit(data => ({ actual: String(data.get("actual") ?? ""), nueva: String(data.get("nueva") ?? "") }))}>
    <Campo label="Contraseña actual" name="actual" type="password" autoComplete="current-password" error={form.errores.actual} required />
    <Campo label="Nueva contraseña" name="nueva" type="password" autoComplete="new-password" error={form.errores.nueva} required />
    <Aviso aviso={form.aviso} />
    <Button className="w-fit" disabled={form.guardando}>{form.guardando ? "Guardando…" : "Actualizar contraseña"}</Button>
  </form>;
}
