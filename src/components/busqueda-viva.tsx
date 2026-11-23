"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";
import { MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Input } from "./ui/input";

type Identificable = { id: number };
type Consulta<T> = { clave: string; datos: T[]; error?: string };

export function BusquedaViva<T extends Identificable>({ endpoint, label, placeholder, elegir, render, deshabilitado, inputRef }: {
  endpoint: string; label: string; placeholder: string; elegir: (item: T) => void; render: (item: T) => ReactNode;
  deshabilitado?: (item: T) => boolean; inputRef?: ComponentProps<"input">["ref"];
}) {
  const id = useId();
  const [texto, setTexto] = useState("");
  const [indice, setIndice] = useState(-1);
  const [abierta, setAbierta] = useState(false);
  const [resultado, setResultado] = useState<Consulta<T>>();
  const q = texto.trim();
  const clave = endpoint + "|" + q;
  const actual = resultado?.clave === clave ? resultado : undefined;
  const opciones = actual?.datos ?? [];
  const visible = abierta && !!q;

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("q", q);
    url.searchParams.set("pageSize", "8");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo buscar.");
        const body = await res.json() as { data: T[] };
        if (!controller.signal.aborted) setResultado({ clave, datos: body.data });
      } catch {
        if (!controller.signal.aborted) setResultado({ clave, datos: [], error: "La búsqueda falló. Cambiá el texto para reintentar." });
      }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [endpoint, q, clave]);

  function seleccionar(item: T) {
    if (deshabilitado?.(item)) return;
    elegir(item);
    setTexto("");
    setIndice(-1);
    setAbierta(false);
    setResultado(undefined);
  }

  return <div className="relative min-w-0">
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
    <div className="relative">
      <Search size={15} aria-hidden className="pointer-events-none absolute top-3.5 left-3 text-muted-foreground" />
      <Input ref={inputRef} id={id} className="pl-9" role="combobox" aria-expanded={visible} aria-autocomplete="list" aria-controls={visible ? id + "-opciones" : undefined}
        aria-activedescendant={visible && indice >= 0 && opciones[indice] ? id + "-" + opciones[indice].id : undefined}
        placeholder={placeholder} value={texto} onFocus={() => setAbierta(true)} onBlur={() => setAbierta(false)}
        onChange={event => { setTexto(event.target.value); setIndice(-1); setAbierta(true); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setAbierta(false); return; }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setAbierta(true);
            if (opciones.length) setIndice(i => event.key === "ArrowDown" ? (i + 1) % opciones.length : (i < 0 ? opciones.length - 1 : (i + opciones.length - 1) % opciones.length));
          }
          if (event.key === "Enter" && visible) {
            event.preventDefault();
            const opcion = indice >= 0 ? opciones[indice] : opciones.find(item => !deshabilitado?.(item));
            if (opcion) seleccionar(opcion);
          }
        }} />
    </div>
    {visible && <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
      {!opciones.length && <p role="status" className="px-3 py-3 text-sm text-muted-foreground">{!actual ? "Buscando…" : actual.error ?? "No encontramos coincidencias."}</p>}
      <ul id={id + "-opciones"} role="listbox" aria-label={label}>
        {opciones.map((item, i) => <li key={item.id} id={id + "-" + item.id} role="option" aria-selected={i === indice} aria-disabled={!!deshabilitado?.(item)}
          className={"border-b border-border px-3 py-2 text-sm last:border-0 " + (deshabilitado?.(item) ? "opacity-55" : "cursor-pointer hover:bg-muted ") + (i === indice ? " bg-muted" : "")}
          onPointerDown={event => event.preventDefault()} onClick={() => seleccionar(item)}>{render(item)}</li>)}
      </ul>
    </div>}
  </div>;
}
