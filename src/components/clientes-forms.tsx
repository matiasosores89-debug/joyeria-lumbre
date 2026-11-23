"use client";

import { useRouter } from "next/navigation";
import { CircleDollarSign, Pencil, UserPlus } from "lucide-react";
import { clientePatch, clienteSchema, pagoSchema } from "@/lib/validacion";
import { medios, pesos } from "@/lib/format";
import type { crearCliente, obtenerCliente } from "@/services/clientes";
import { Button } from "./ui/button";
import { Campo, CampoDinero, centavos, Check, dineroEditable, Selector, TextoLargo, valor } from "./fields";
import { FormModal } from "./form-modal";

type Cliente = Awaited<ReturnType<typeof crearCliente>>;

export function EditorCliente({ cliente, alGuardar }: { cliente?: Cliente; alGuardar?: (c: Cliente) => void }) {
  const editando = !!cliente;
  return <FormModal titulo={editando ? "Editar cliente" : "Nuevo cliente"} operacion={editando ? "editarCliente" : "crearCliente"}
    id={cliente?.id} schema={editando ? clientePatch : clienteSchema} exito={editando ? "Cliente actualizado." : "Cliente registrado."}
    trigger={<Button variant={editando || alGuardar ? "outline" : "default"}>{editando ? <Pencil /> : <UserPlus />}{editando ? "Editar" : "Nuevo cliente"}</Button>}
    alGuardar={alGuardar ? data => alGuardar(data as Cliente) : undefined}
    armar={data => ({
      nombre: valor(data, "nombre"), tipoDoc: valor(data, "tipoDoc"), nroDoc: valor(data, "nroDoc"),
      domicilio: valor(data, "domicilio") || null, telefono: valor(data, "telefono") || null, email: valor(data, "email") || null,
      cuentaCorriente: data.has("cuentaCorriente"), limiteCredito: valor(data, "limiteCredito") ? centavos(valor(data, "limiteCredito")) : null,
    })}
    campos={errores => <>
      <Campo label="Nombre o razón social" name="nombre" defaultValue={cliente?.nombre} error={errores.nombre} required />
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <Selector name="tipoDoc" label="Tipo" defaultValue={cliente?.tipoDoc ?? "DNI"} error={errores.tipoDoc}><option>DNI</option><option>CUIT</option></Selector>
        <Campo label="Documento" name="nroDoc" defaultValue={cliente?.nroDoc} inputMode="numeric" error={errores.nroDoc} required />
      </div>
      <Campo label="Domicilio" name="domicilio" defaultValue={cliente?.domicilio ?? ""} error={errores.domicilio} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Teléfono" name="telefono" type="tel" defaultValue={cliente?.telefono ?? ""} error={errores.telefono} />
        <Campo label="Email" name="email" type="email" defaultValue={cliente?.email ?? ""} error={errores.email} />
      </div>
      <div className="grid gap-3 border-t border-border pt-3">
        <Check name="cuentaCorriente" defaultChecked={cliente?.cuentaCorriente}>Habilitar cuenta corriente</Check>
        <CampoDinero label="Límite de crédito ($), opcional" name="limiteCredito" defaultValue={cliente?.limiteCredito != null ? dineroEditable(cliente.limiteCredito) : ""} error={errores.limiteCredito} />
      </div>
    </>} />;
}

export function EstadoCliente({ cliente }: { cliente: Cliente }) {
  const activar = !cliente.activo;
  const texto = activar ? "Reactivar cliente" : "Dar de baja";
  return <FormModal titulo={texto} descripcion={activar ? "El cliente volverá a estar disponible para ventas." : "El cliente conservará sus facturas y movimientos."}
    trigger={<Button variant="outline">{texto}</Button>} boton={texto} peligro={!activar} exito={activar ? "Cliente reactivado." : "Cliente dado de baja."}
    schema={clientePatch} operacion="editarCliente" id={cliente.id} armar={() => ({ activo: activar })} />;
}

export function EditorPago({ cliente }: { cliente: Awaited<ReturnType<typeof obtenerCliente>> }) {
  const router = useRouter();
  const habilitado = cliente.activo && cliente.cuentaCorriente && cliente.saldo > 0;
  if (!habilitado) return null;
  return <FormModal titulo="Registrar pago" descripcion={"Deuda actual de " + cliente.nombre + ": " + pesos(cliente.saldo)}
    trigger={<Button><CircleDollarSign /> Registrar pago</Button>} boton="Registrar y ver recibo" exito="Pago registrado."
    schema={pagoSchema} operacion="registrarPago" id={cliente.id}
    armar={data => ({ importe: centavos(valor(data, "importe")), medio: valor(data, "medio"), observacion: valor(data, "observacion") || undefined })}
    alGuardar={data => router.push("/pagos/" + (data as { id: number }).id + "?nuevo=1")}
    campos={errores => <>
      <CampoDinero name="importe" label="Importe recibido ($)" error={errores.importe} required />
      <Selector name="medio" label="Medio de pago" error={errores.medio}>{Object.entries(medios).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</Selector>
      <TextoLargo name="observacion" label="Observación (opcional)" error={errores.observacion} />
    </>} />;
}
