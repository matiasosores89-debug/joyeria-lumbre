"use client";

import { useState } from "react";
import { Aviso } from "./feedback";
import { IconoDeCategoria } from "./icono-categoria";
import { EditorCategoria, EliminarCategoria, EstadoCategoria, type CategoriaProducto } from "./productos-forms";
import { Panel, Tabla } from "./shared";
import { Badge } from "./ui/badge";

export function CategoriasTabla({ categorias, editable }: { categorias: CategoriaProducto[]; editable: boolean }) {
  const [eliminada, setEliminada] = useState<string>();
  return <Panel>
    {eliminada && <div className="px-4 py-3">
      <Aviso aviso={{ texto: "Se eliminó la categoría «" + eliminada + "»." }} cerrar={() => setEliminada(undefined)} />
    </div>}
    <Tabla columnas={["Nombre", "Estado", ...(editable ? [""] : [])]} vacia={!categorias.length}>
      {categorias.map(categoria => <tr key={categoria.id}>
        <td><span className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-8 shrink-0 place-items-center rounded-sm border border-primary/15 bg-rose-paper/60 text-primary">
            <IconoDeCategoria icono={categoria.icono} nombre={categoria.nombre} size={17} />
          </span>
          {categoria.nombre}
        </span></td>
        <td><Badge tone={categoria.activa ? "green" : "neutral"}>{categoria.activa ? "Activa" : "Inactiva"}</Badge></td>
        {editable && <td><div className="flex flex-wrap justify-end gap-2">
          <EditorCategoria categoria={categoria} />
          <EstadoCategoria categoria={categoria} />
          <EliminarCategoria categoria={categoria} alEliminar={() => setEliminada(categoria.nombre)} />
        </div></td>}
      </tr>)}
    </Tabla>
  </Panel>;
}
