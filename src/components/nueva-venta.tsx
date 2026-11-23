"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CornerDownLeft, PackagePlus, Trash2 } from "lucide-react";
import { facturaSchema } from "@/lib/validacion";
import { formas, pesos } from "@/lib/format";
import type { crearCliente } from "@/services/clientes";
import type { obtenerProducto } from "@/services/productos";
import type { emitirFactura } from "@/services/facturas";
import { BusquedaViva } from "./busqueda-viva";
import { EditorCliente } from "./clientes-forms";
import { Campo, CampoDinero, centavos, Selector } from "./fields";
import { Aviso, type AvisoTipo } from "./feedback";
import { useFormulario } from "./form-hook";
import { Panel, Tabla } from "./shared";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type Cliente = Awaited<ReturnType<typeof crearCliente>>;
type Producto = Awaited<ReturnType<typeof obtenerProducto>>;
type Factura = Awaited<ReturnType<typeof emitirFactura>>;
type Linea = { producto: Producto; cantidad: number };

async function confirmar(body: unknown) {
  const res = await fetch("/api/facturas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const datos = await res.json();
  return res.ok ? { ok: true as const, data: datos } : { ok: false as const, error: datos.error };
}

export function NuevaVenta({ numero }: { numero: string }) {
  const router = useRouter();
  const productoInput = useRef<HTMLInputElement>(null);
  const pagoInput = useRef<HTMLSelectElement>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [forma, setForma] = useState<keyof typeof formas>("contado");
  const [recibido, setRecibido] = useState("");
  const [aviso, setAviso] = useState<AvisoTipo>();
  const [emitida, setEmitida] = useState(false);
  const total = lineas.reduce((suma, { producto, cantidad }) => suma + producto.precio * cantidad, 0);
  const puedeCuenta = !!cliente?.cuentaCorriente;
  const excedeCredito = forma === "cuenta_corriente" && cliente?.disponible != null && total > cliente.disponible;
  const vuelto = recibido ? centavos(recibido) - total : 0;
  const form = useFormulario({ schema: facturaSchema, enviar: confirmar, alGuardar: data => {
    setEmitida(true);
    router.push("/ventas/" + (data as Factura).id + "?nueva=1");
  } });

  function comprador(persona: Cliente | null) {
    setCliente(persona);
    if (!persona?.cuentaCorriente && forma === "cuenta_corriente") setForma("contado");
    productoInput.current?.focus();
  }

  function agregar(producto: Producto) {
    const actual = lineas.find(linea => linea.producto.id === producto.id);
    const cantidad = (actual?.cantidad ?? 0) + 1;
    if (cantidad > producto.existencia) {
      setAviso({ texto: "No hay más unidades disponibles de " + producto.descripcion + ".", error: true });
      return;
    }
    setLineas(prev => actual ? prev.map(linea => linea.producto.id === producto.id ? { producto, cantidad } : linea) : [...prev, { producto, cantidad }]);
    setAviso({ texto: producto.descripcion + " agregado." });
    productoInput.current?.focus();
  }

  function editarCantidad(id: number, cantidad: number) {
    const linea = lineas.find(item => item.producto.id === id);
    if (!linea || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > linea.producto.existencia) {
      setAviso({ texto: "Ingresá una cantidad entre 1 y " + (linea?.producto.existencia ?? 0) + ".", error: true });
      return;
    }
    setLineas(prev => prev.map(item => id === item.producto.id ? { ...item, cantidad } : item));
    setAviso(undefined);
  }

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)]">
    <div className="grid min-w-0 gap-5">
      <Panel titulo="Comprador" className="overflow-visible">
        <div className="grid gap-3 px-5 pb-5">
          {cliente ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <div><strong>{cliente.nombre}</strong><span className="ml-2 text-muted-foreground">{cliente.tipoDoc} {cliente.nroDoc}</span></div>
            <Button size="sm" variant="ghost" type="button" onClick={() => comprador(null)}>Usar consumidor final</Button>
          </div> : <p className="w-fit rounded-md bg-muted px-3 py-2 text-sm font-semibold">Consumidor final</p>}
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <BusquedaViva<Cliente> endpoint="/api/clientes?activo=true" label="Buscar cliente" placeholder="Nombre o documento" elegir={comprador}
              render={c => <span className="flex flex-wrap justify-between gap-2"><strong>{c.nombre}</strong><span className="text-xs text-muted-foreground">{c.tipoDoc} {c.nroDoc}</span></span>} />
            <EditorCliente alGuardar={comprador} />
          </div>
        </div>
      </Panel>
      <Panel titulo="Productos de la venta" className="overflow-visible">
        <div className="grid gap-3 px-5 pb-4">
          <BusquedaViva<Producto> inputRef={productoInput} endpoint="/api/productos" label="Agregar producto" placeholder="Código o descripción" elegir={agregar}
            deshabilitado={producto => producto.existencia === 0}
            render={p => <span className="flex flex-wrap items-center justify-between gap-2">
              <span><strong>{p.descripcion}</strong><span className="ml-2 font-mono text-xs text-muted-foreground">{p.codigo}</span></span>
              <span className="flex items-center gap-2"><Badge tone={p.bajoMinimo ? "amber" : "neutral"}>Stock {p.existencia}</Badge>{pesos(p.precio)}</span>
            </span>} />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CornerDownLeft size={14} /> Usá Enter para agregar el resultado seleccionado.</p>
          <Aviso aviso={aviso} cerrar={() => setAviso(undefined)} />
        </div>
        <Tabla columnas={["Producto", "Cantidad", "Precio unitario", "Subtotal", ""]} vacia={!lineas.length} mensaje="Todavía no agregaste productos.">
          {lineas.map(({ producto, cantidad }) => <tr key={producto.id}>
            <td className="min-w-36"><strong>{producto.descripcion}</strong><span className="block text-xs text-muted-foreground">{producto.codigo}</span></td>
            <td><Campo label={"Cantidad de " + producto.descripcion} className="w-20 [&>span:first-child]:sr-only"
              type="number" min={1} max={producto.existencia} value={cantidad}
              onChange={event => editarCantidad(producto.id, Number(event.target.value))} />
              <span className="mt-1 block whitespace-nowrap text-xs text-muted-foreground">Stock: {producto.existencia}</span></td>
            <td className="whitespace-nowrap">{pesos(producto.precio)}</td>
            <td className="font-semibold whitespace-nowrap">{pesos(producto.precio * cantidad)}</td>
            <td><Button type="button" variant="ghost" size="sm" aria-label={"Quitar " + producto.descripcion} onClick={() => {
              setLineas(prev => prev.filter(item => item.producto.id !== producto.id)); setAviso({ texto: "Producto retirado de la venta." });
            }}><Trash2 /></Button></td>
          </tr>)}
        </Tabla>
        {!!lineas.length && <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><PackagePlus size={16} /> {lineas.reduce((suma, linea) => suma + linea.cantidad, 0)} unidades</span>
          <Button type="button" variant="outline" size="sm" onClick={() => pagoInput.current?.focus()}>Ir al pago <ArrowRight /></Button>
        </div>}
      </Panel>
    </div>
    <Panel titulo="Pago" detalle={"Próximo comprobante: " + numero} className="xl:sticky xl:top-[87px]">
      <form noValidate className="grid gap-4 px-5 pb-5" onSubmit={form.submit(data => ({
        clienteId: cliente?.id ?? null,
        items: lineas.map(({ producto, cantidad }) => ({ productoId: producto.id, cantidad })),
        pago: forma === "contado" ? { forma, ...(recibido ? { montoRecibido: centavos(recibido) } : {}) }
          : forma === "tarjeta" ? { forma, tarjeta: { tipo: data.get("tipo"), marca: data.get("marca"), ultimos4: data.get("ultimos4") } } : { forma },
      }))}>
        <Selector ref={pagoInput} label="Forma de pago" value={forma} onChange={event => setForma(event.target.value as keyof typeof formas)}>
          {Object.entries(formas).map(([key, nombre]) => <option key={key} value={key} disabled={key === "cuenta_corriente" && !puedeCuenta}>{nombre}</option>)}
        </Selector>
        {forma === "contado" && <>
          <CampoDinero label="Monto recibido ($)" value={recibido} onChange={event => setRecibido(event.target.value)}
            error={form.errores["pago.montoRecibido"] || (recibido && Number.isFinite(vuelto) && vuelto < 0 ? "El monto recibido no cubre el total." : undefined)} />
          <div className="flex justify-between gap-2 text-sm text-muted-foreground"><span>Vuelto</span><strong className="text-foreground">{pesos(Math.max(0, vuelto || 0))}</strong></div>
        </>}
        {forma === "tarjeta" && <>
          <Selector label="Tipo de tarjeta" name="tipo" error={form.errores["pago.tarjeta.tipo"]}><option value="debito">Débito</option><option value="credito">Crédito</option></Selector>
          <Campo label="Marca" name="marca" placeholder="Visa, Mastercard…" error={form.errores["pago.tarjeta.marca"]} />
          <Campo label="Últimos 4 dígitos" name="ultimos4" inputMode="numeric" autoComplete="off" maxLength={4} error={form.errores["pago.tarjeta.ultimos4"]} />
        </>}
        {forma === "cuenta_corriente" && cliente && <div className="grid gap-2 rounded-lg bg-muted p-3 text-sm">
          <span>Saldo actual <strong>{pesos(cliente.saldo)}</strong></span>
          <span>Crédito disponible <strong>{cliente.disponible === null ? "Sin límite" : pesos(cliente.disponible)}</strong></span>
          <span>Saldo tras la venta <strong>{pesos(cliente.saldo + total)}</strong></span>
          {excedeCredito && <span role="alert" className="text-destructive">La venta supera el límite de crédito.</span>}
        </div>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4"><span className="text-sm font-semibold">Total</span><strong className="text-2xl tracking-tight tabular-nums">{pesos(total)}</strong></div>
        <Aviso aviso={form.aviso} />
        {form.errores.items && <p className="text-sm text-destructive" role="alert">{form.errores.items}</p>}
        <Button size="lg" type="submit" disabled={!lineas.length || form.guardando || emitida || excedeCredito || (!!recibido && forma === "contado" && vuelto < 0)}><Check />{emitida ? "Venta emitida" : form.guardando ? "Emitiendo…" : "Confirmar venta"}</Button>
      </form>
    </Panel>
  </div>;
}
