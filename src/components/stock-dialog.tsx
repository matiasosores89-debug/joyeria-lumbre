"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr/ArrowDown";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PackageIcon } from "@phosphor-icons/react/dist/ssr/Package";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import { mutarAction } from "@/app/actions";
import { fechaHoraExacta, tiposStock } from "@/lib/format";
import { motivoAjuste, motivosEgreso, motivosIngreso, stockSchema } from "@/lib/validacion";
import type { obtenerProducto } from "@/services/productos";
import type { listarStock } from "@/services/stock";
import { BusquedaViva } from "./busqueda-viva";
import { Campo, entero, Selector, TextoLargo, valor } from "./fields";
import { EditorProducto, type CategoriaProducto } from "./productos-forms";
import { Aviso } from "./feedback";
import { useFormulario } from "./form-hook";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Modal } from "./ui/dialog";

type Producto = Awaited<ReturnType<typeof obtenerProducto>>;
type Historial = Awaited<ReturnType<typeof listarStock>>;
type Operacion = "ingreso" | "egreso" | "ajuste";

const operaciones = [
  { id: "ingreso", etiqueta: "Ingresar mercadería", icono: PlusIcon },
  { id: "egreso", etiqueta: "Disminuir stock", icono: MinusIcon },
  { id: "ajuste", etiqueta: "Ajustar stock", icono: SlidersHorizontalIcon },
] as const;

export function StockDialog({ producto, puedeEditar, categorias = [], disparador }: {
  producto?: Producto; puedeEditar: boolean; categorias?: CategoriaProducto[]; disparador?: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [seleccion, setSeleccion] = useState<Producto>();
  const actual = seleccion ?? producto;
  const recepcion = !producto;
  const accion = recepcion ? "Ingreso de mercadería" : puedeEditar ? "Gestionar stock" : "Consultar stock";

  return <Modal open={abierto} onOpenChange={open => {
    if (guardando) return;
    if (!open) setSeleccion(undefined);
    setAbierto(open);
  }}
    title={actual?.descripcion ?? accion} description={actual ? accion + " · " + actual.codigo : "Buscá un producto para registrar las unidades recibidas."}
    encabezadoFijo className={actual ? "max-w-5xl" : "max-w-xl"}
    trigger={disparador ?? <Button type="button" variant={recepcion ? "default" : puedeEditar ? "outline" : "ghost"} size={recepcion ? "default" : "sm"}
      aria-label={producto ? accion + " de " + producto.descripcion : accion}>
      <PackageIcon weight="duotone" aria-hidden />{accion}
    </Button>}>
    {abierto && <>
      {puedeEditar && <fieldset disabled={guardando} className="mb-4 flex min-w-0 flex-wrap items-start gap-2">
        <EditorProducto compacto categorias={categorias} alGuardar={setSeleccion} />
        {actual && <EditorProducto key={actual.id} compacto producto={actual} categorias={categorias} alGuardar={setSeleccion} />}
        {recepcion && actual && <Button type="button" size="sm" variant="ghost" disabled={guardando}
          onClick={() => setSeleccion(undefined)}>Cambiar producto</Button>}
      </fieldset>}
      {actual
        ? <ContenidoStock key={actual.id} producto={actual} puedeEditar={puedeEditar} setGuardando={setGuardando} />
        : <div className="pb-24">
          <BusquedaViva<Producto> endpoint="/api/productos" label="Buscar producto" placeholder="Código o descripción"
            elegir={setSeleccion} render={p => <span className="flex flex-wrap justify-between gap-2">
              <span><strong>{p.descripcion}</strong> <span className="text-xs text-muted-foreground">{p.codigo}</span></span>
              <span className="text-xs text-muted-foreground">{p.existencia} u.</span>
            </span>} />
        </div>}
    </>}
  </Modal>;
}

function ContenidoStock({ producto, puedeEditar, setGuardando }: { producto: Producto; puedeEditar: boolean; setGuardando: (valor: boolean) => void }) {
  const router = useRouter();
  const encabezadoHistorial = useRef<HTMLHeadingElement>(null);
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState<
    { clave: string; historial: Historial; existencia: number } | { clave: string; error: string }
  >();
  const [operacion, setOperacion] = useState<Operacion>("ingreso");
  const [cantidad, setCantidad] = useState("");
  const formulario = useRef<HTMLFormElement>(null);
  const clave = pagina + ":" + revision;
  const respuesta = resultado?.clave === clave ? resultado : undefined;
  const historial = respuesta && "historial" in respuesta ? respuesta.historial : undefined;
  const existencia = resultado && "existencia" in resultado ? resultado.existencia : producto.existencia;
  const base = "/api/productos/" + producto.id;
  const esAjuste = operacion === "ajuste";
  const esEgreso = operacion === "egreso";
  const entrada = cantidad.trim() ? Number(cantidad) : NaN;
  const siguiente = esAjuste ? entrada : existencia + (esEgreso ? -entrada : entrada);
  const valido = Number.isSafeInteger(entrada) && entrada >= (esAjuste ? 0 : 1) && Number.isSafeInteger(siguiente);

  useEffect(() => {
    const control = new AbortController();
    const opciones = { signal: control.signal, cache: "no-store" } as const;
    async function cargar() {
      try {
        const [productoActual, movimientos] = await Promise.all([
          fetch(base, opciones),
          fetch(base + "/movimientos?pageSize=5&page=" + pagina, opciones),
        ]);
        if (!productoActual.ok || !movimientos.ok) throw new Error("No pudimos cargar el stock.");
        const [producto, historial]: [Producto, Historial] = await Promise.all([productoActual.json(), movimientos.json()]);
        if (!control.signal.aborted) setResultado({ clave, historial, existencia: producto.existencia });
      } catch {
        if (!control.signal.aborted) setResultado({ clave, error: "No pudimos cargar el stock ni su historial." });
      }
    }
    void cargar();
    return () => control.abort();
  }, [base, pagina, clave]);

  function actualizar() {
    setRevision(previo => previo + 1);
  }

  const form = useFormulario({
    schema: stockSchema,
    enviar: async body => {
      setGuardando(true);
      try {
        const respuesta = await mutarAction("registrarStock", producto.id, body);
        if (!respuesta.ok && ["STOCK_DESACTUALIZADO", "STOCK_INSUFICIENTE"].includes(respuesta.error.code)) actualizar();
        return respuesta;
      } finally {
        setGuardando(false);
      }
    },
    alGuardar: data => {
      const movimiento = data as Historial["data"][number];
      setResultado(actual => actual && "existencia" in actual ? { ...actual, existencia: movimiento.existenciaResultante } : actual);
      formulario.current?.reset();
      setCantidad("");
      setPagina(1);
      actualizar();
      router.refresh();
    },
    exito: "Movimiento registrado.",
  });

  const modos = puedeEditar ? "lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]" : "";
  return <>
    <dl className="mb-5 flex flex-wrap items-end gap-x-9 gap-y-3 border-y border-gold-ink/40 bg-wine px-4 py-3 text-primary-foreground sm:px-5">
      <div>
        <dt className="text-xs font-semibold text-gold-ink">{historial ? "Existencia actual" : "Última existencia conocida"}</dt>
        <dd className="mt-1 font-display text-4xl leading-none tabular-nums">{existencia} <span className="font-sans text-sm">u.</span></dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-gold-ink">Stock mínimo</dt>
        <dd className="mt-1 text-lg tabular-nums">{producto.stockMinimo} u.</dd>
      </div>
      {existencia < producto.stockMinimo && <Badge tone="amber">Bajo mínimo</Badge>}
    </dl>
    <div className={"grid min-w-0 gap-6 " + modos}>
      {puedeEditar && <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl tracking-tight text-wine">Registrar movimiento</h2>
          <Button type="button" size="sm" variant="ghost" className="lg:hidden" onClick={() => encabezadoHistorial.current?.focus()}><ArrowDownIcon aria-hidden /> Historial</Button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-sm bg-muted p-1" role="group" aria-label="Tipo de movimiento">
          {operaciones.map(({ id, etiqueta, icono: Icono }) => <Button type="button" key={id} size="sm"
            className="h-auto min-h-14 min-w-0 flex-col gap-1 px-1 py-1.5 text-center leading-tight" variant={operacion === id ? "default" : "ghost"} aria-pressed={operacion === id}
            disabled={form.guardando} onClick={() => { if (operacion !== id) { setOperacion(id); setCantidad(""); form.limpiarAvisos(); } }}>
            <Icono aria-hidden />{etiqueta}
          </Button>)}
        </div>
        <form ref={formulario} noValidate className="grid gap-3" onSubmit={form.submit(data => {
          const observacion = valor(data, "observacion");
          return esAjuste
            ? { tipo: operacion, existenciaObjetivo: entero(data, "cantidad"), existenciaEsperada: existencia, observacion }
            : { tipo: operacion, cantidad: entero(data, "cantidad"), motivo: valor(data, "motivo"), observacion: observacion || undefined };
        })}>
          {esAjuste && <p className="text-sm text-muted-foreground">Ingresá cuántas unidades contaste. Se registrará la diferencia con la existencia actual.</p>}
          <Campo name="cantidad" type="number" inputMode="numeric" min={esAjuste ? 0 : 1} step={1} max={esEgreso ? existencia : undefined}
            label={esAjuste ? "Unidades contadas" : "Cantidad de unidades"} value={cantidad} required
            error={form.errores[esAjuste ? "existenciaObjetivo" : "cantidad"] || (valido && siguiente < 0 ? "La cantidad supera la existencia disponible." : undefined)}
            onChange={event => setCantidad(event.target.value)} />
          {!esAjuste && <Selector key={"motivo-" + operacion} name="motivo" label="Motivo" defaultValue={esEgreso ? "" : "Reposición"} error={form.errores.motivo} required>
            <option value="">Seleccioná un motivo</option>
            {(esEgreso ? motivosEgreso : motivosIngreso).map(motivo => <option key={motivo}>{motivo}</option>)}
          </Selector>}
          <TextoLargo name="observacion" label={esAjuste ? "Motivo del ajuste" : "Observación (opcional)"} required={esAjuste} maxLength={400} error={form.errores.observacion} />
          <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-2 text-sm">
            <span>Existencia resultante</span>
            <strong className="flex items-center gap-1.5 text-primary tabular-nums">
              {existencia}<ArrowRightIcon aria-hidden />{valido && siguiente >= 0 ? siguiente + " u." : "—"}
            </strong>
          </div>
          <Aviso aviso={form.aviso} />
          <Button type="submit" disabled={form.guardando || !historial || (valido && siguiente < 0)}>
            {form.guardando ? "Guardando…" : esAjuste ? "Guardar ajuste" : esEgreso ? "Registrar egreso" : "Registrar ingreso"}
          </Button>
        </form>
      </section>}
      <section className="min-w-0 border-t border-border pt-4 lg:border-t-0 lg:pt-0" aria-labelledby="titulo-historial-stock">
        <h2 ref={encabezadoHistorial} id="titulo-historial-stock" tabIndex={-1} className="mb-3 flex items-center gap-2 font-display text-2xl tracking-tight text-wine">
          <ClockCounterClockwiseIcon size={22} weight="duotone" aria-hidden /> Historial de movimientos
        </h2>
        {!respuesta && <p role="status" className="border-y border-border py-4 text-sm text-muted-foreground">Cargando historial…</p>}
        {respuesta && "error" in respuesta && <div className="grid gap-2">
          <Aviso aviso={{ texto: respuesta.error, error: true }} />
          <Button type="button" size="sm" variant="outline" className="w-fit" onClick={actualizar}>Reintentar</Button>
        </div>}
        {historial && <HistorialStock historial={historial} setPagina={setPagina} />}
      </section>
    </div>
  </>;
}

function HistorialStock({ historial, setPagina }: { historial: Historial; setPagina: (pagina: number) => void }) {
  if (!historial.total) return <p className="border-y border-border py-4 text-sm text-muted-foreground">Este producto todavía no tiene movimientos.</p>;
  const paginas = Math.ceil(historial.total / historial.pageSize);
  return <>
    <ol className="divide-y divide-border border-y border-border">
      {historial.data.map(movimiento => {
        const ajuste = movimiento.motivo === motivoAjuste;
        const anterior = movimiento.existenciaResultante - movimiento.cantidad;
        return <li key={movimiento.id} className="grid gap-1.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ajuste ? "amber" : movimiento.cantidad > 0 ? "green" : "neutral"}>{ajuste ? "Ajuste" : tiposStock[movimiento.tipo]}</Badge>
              <span className="text-sm font-semibold text-primary tabular-nums">{movimiento.cantidad > 0 ? "+" : ""}{movimiento.cantidad} u.</span>
            </div>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm tabular-nums" aria-label={"Existencia de " + anterior + " a " + movimiento.existenciaResultante + " unidades"}>
              {anterior}<ArrowRightIcon size={14} aria-hidden /><strong>{movimiento.existenciaResultante} u.</strong>
            </span>
          </div>
          <p className="text-sm [overflow-wrap:anywhere]">{movimiento.motivo}{movimiento.observacion && <span className="text-muted-foreground"> · {movimiento.observacion}</span>}</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <time dateTime={movimiento.fecha} title={movimiento.fecha}>{fechaHoraExacta(movimiento.fecha)}</time>
            <span>· {movimiento.usuario.nombre}</span>
            {movimiento.referencia && <Link href={"/ventas/" + movimiento.referencia.facturaId} className="font-semibold text-primary underline">Factura {movimiento.referencia.numero}</Link>}
          </div>
        </li>;
      })}
    </ol>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">Página {historial.page} de {paginas} · {historial.total} {historial.total === 1 ? "movimiento" : "movimientos"}</p>
      {paginas > 1 && <nav className="flex gap-2" aria-label="Paginación del historial">
        <Button type="button" size="sm" variant="outline" disabled={historial.page === 1} onClick={() => setPagina(historial.page - 1)}>Anterior</Button>
        <Button type="button" size="sm" variant="outline" disabled={historial.page >= paginas} onClick={() => setPagina(historial.page + 1)}>Siguiente</Button>
      </nav>}
    </div>
  </>;
}
