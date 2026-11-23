"use client";

import { PencilSimpleLineIcon as Pencil } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { categoriaPatch, categoriaSchema, productoPatch, productoSchema } from "@/lib/validacion";
import type { obtenerProducto } from "@/services/productos";
import { Button } from "./ui/button";
import { Campo, CampoDinero, centavos, dineroEditable, entero, Selector, valor } from "./fields";
import { FormModal } from "./form-modal";

type Producto = Awaited<ReturnType<typeof obtenerProducto>>;
export type CategoriaProducto = { id: number; nombre: string; activa: boolean };

export function EditorProducto({ producto, categorias, alGuardar, compacto = false }: {
  producto?: Producto; categorias: CategoriaProducto[]; alGuardar?: (producto: Producto) => void; compacto?: boolean;
}) {
  return <FormModal titulo={producto?.descripcion ?? "Nuevo producto"} descripcion={producto ? "Editar producto · " + producto.codigo : undefined}
    operacion={producto ? "editarProducto" : "crearProducto"}
    id={producto?.id} schema={producto ? productoPatch : productoSchema} exito={producto ? "Producto actualizado." : "Producto creado."}
    alGuardar={alGuardar ? data => alGuardar(data as Producto) : undefined}
    trigger={<Button type="button" variant={producto || compacto ? "outline" : "default"} size={compacto ? "sm" : "default"}>
      {producto ? <Pencil aria-hidden /> : <Plus aria-hidden />}{producto ? "Editar producto" : "Nuevo producto"}
    </Button>}
    armar={data => ({
      codigo: valor(data, "codigo"), descripcion: valor(data, "descripcion"),
      categoriaId: entero(data, "categoriaId"), precio: centavos(valor(data, "precio")), stockMinimo: entero(data, "stockMinimo"),
      ...(!producto && valor(data, "stockInicial") ? { stockInicial: entero(data, "stockInicial") } : {}),
    })}
    campos={errores => <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo name="codigo" label="Código" defaultValue={producto?.codigo} error={errores.codigo} required />
        <Selector name="categoriaId" label="Categoría" defaultValue={producto?.categoria.id ?? ""} error={errores.categoriaId} required>
          <option value="">Seleccioná una categoría</option>
          {!categorias.some(c => c.id === producto?.categoria.id) && producto && <option value={producto.categoria.id}>{producto.categoria.nombre}</option>}
          {categorias.map(c => <option value={c.id} key={c.id}>{c.nombre}</option>)}
        </Selector>
      </div>
      <Campo name="descripcion" label="Descripción" defaultValue={producto?.descripcion} error={errores.descripcion} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <CampoDinero name="precio" label="Precio de venta ($)" defaultValue={producto ? dineroEditable(producto.precio) : ""} error={errores.precio} required />
        <Campo name="stockMinimo" label="Stock mínimo" type="number" min={0} defaultValue={producto?.stockMinimo ?? 0} error={errores.stockMinimo} required />
      </div>
      {!producto && <Campo name="stockInicial" label="Stock inicial (opcional)" type="number" min={0} error={errores.stockInicial} />}
    </>} />;
}

export function EstadoProducto({ producto }: { producto: Producto }) {
  const activar = !producto.activo;
  const texto = activar ? "Reactivar producto" : "Dar de baja";
  return <FormModal titulo={texto} descripcion={activar ? "El producto volverá a ofrecerse en ventas." : "El producto dejará de ofrecerse en ventas y conservará su historial."}
    trigger={<Button variant="outline">{texto}</Button>} boton={texto} peligro={!activar} exito={activar ? "Producto reactivado." : "Producto dado de baja."}
    schema={productoPatch} operacion="editarProducto" id={producto.id} armar={() => ({ activo: activar })} />;
}

export function EditorCategoria({ categoria }: { categoria?: CategoriaProducto }) {
  return <FormModal titulo={categoria ? "Editar categoría" : "Nueva categoría"} trigger={<Button size={categoria ? "sm" : "default"} variant={categoria ? "outline" : "default"}>{categoria ? <Pencil /> : <Plus />}{categoria ? "Editar" : "Nueva categoría"}</Button>}
    operacion={categoria ? "editarCategoria" : "crearCategoria"} id={categoria?.id} schema={categoria ? categoriaPatch : categoriaSchema}
    armar={data => ({ nombre: valor(data, "nombre") })} campos={errores => <Campo name="nombre" label="Nombre" defaultValue={categoria?.nombre} error={errores.nombre} required />} />;
}

export function EstadoCategoria({ categoria }: { categoria: CategoriaProducto }) {
  const titulo = categoria.activa ? "Dar de baja" : "Reactivar";
  return <FormModal titulo={titulo + " categoría"} descripcion={categoria.activa ? "La categoría se puede dar de baja cuando no tiene productos activos." : "La categoría volverá a estar disponible."}
    trigger={<Button size="sm" variant="ghost">{titulo}</Button>} boton={titulo} peligro={categoria.activa}
    operacion="editarCategoria" id={categoria.id} schema={categoriaPatch} armar={() => ({ activa: !categoria.activa })} />;
}
