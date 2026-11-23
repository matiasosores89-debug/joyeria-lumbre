"use client";

import { Pencil, Plus } from "lucide-react";
import { categoriaPatch, categoriaSchema, motivosEgreso, motivosIngreso, productoPatch, productoSchema, stockSchema } from "@/lib/validacion";
import type { obtenerProducto } from "@/services/productos";
import { Button } from "./ui/button";
import { Campo, CampoDinero, centavos, dineroEditable, entero, Selector, TextoLargo, valor } from "./fields";
import { FormModal } from "./form-modal";

type Producto = Awaited<ReturnType<typeof obtenerProducto>>;
type Categoria = { id: number; nombre: string; activa: boolean };

export function EditorProducto({ producto, categorias }: { producto?: Producto; categorias: Categoria[] }) {
  return <FormModal titulo={producto ? "Editar producto" : "Nuevo producto"} operacion={producto ? "editarProducto" : "crearProducto"}
    id={producto?.id} schema={producto ? productoPatch : productoSchema} exito={producto ? "Producto actualizado." : "Producto creado."}
    trigger={<Button variant={producto ? "outline" : "default"}>{producto ? <Pencil /> : <Plus />}{producto ? "Editar" : "Nuevo producto"}</Button>}
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

export function MovimientoManual({ producto, tipo }: { producto: Producto; tipo: "ingreso" | "egreso" }) {
  const ingreso = tipo === "ingreso";
  const titulo = ingreso ? "Registrar ingreso" : "Registrar egreso";
  const motivos = ingreso ? motivosIngreso : motivosEgreso;
  return <FormModal titulo={titulo} descripcion={producto.descripcion + " · Existencia actual: " + producto.existencia}
    trigger={<Button variant="outline" size="sm">{ingreso ? "Ingreso" : "Egreso"}</Button>}
    operacion="registrarStock" schema={stockSchema} id={producto.id} exito="Movimiento registrado."
    armar={data => ({ tipo, cantidad: entero(data, "cantidad"), motivo: valor(data, "motivo"), observacion: valor(data, "observacion") || undefined })}
    campos={errores => <>
      <Campo name="cantidad" label="Cantidad" type="number" min={1} max={ingreso ? undefined : producto.existencia} error={errores.cantidad} required />
      <Selector name="motivo" label="Motivo" error={errores.motivo} required><option value="">Seleccioná un motivo</option>{motivos.map(m => <option key={m}>{m}</option>)}</Selector>
      <TextoLargo name="observacion" label="Observación (opcional)" error={errores.observacion} />
    </>} />;
}

export function EditorCategoria({ categoria }: { categoria?: Categoria }) {
  return <FormModal titulo={categoria ? "Editar categoría" : "Nueva categoría"} trigger={<Button size={categoria ? "sm" : "default"} variant={categoria ? "outline" : "default"}>{categoria ? <Pencil /> : <Plus />}{categoria ? "Editar" : "Nueva categoría"}</Button>}
    operacion={categoria ? "editarCategoria" : "crearCategoria"} id={categoria?.id} schema={categoria ? categoriaPatch : categoriaSchema}
    armar={data => ({ nombre: valor(data, "nombre") })} campos={errores => <Campo name="nombre" label="Nombre" defaultValue={categoria?.nombre} error={errores.nombre} required />} />;
}

export function EstadoCategoria({ categoria }: { categoria: Categoria }) {
  const titulo = categoria.activa ? "Dar de baja" : "Reactivar";
  return <FormModal titulo={titulo + " categoría"} descripcion={categoria.activa ? "La categoría se puede dar de baja cuando no tiene productos activos." : "La categoría volverá a estar disponible."}
    trigger={<Button size="sm" variant="ghost">{titulo}</Button>} boton={titulo} peligro={categoria.activa}
    operacion="editarCategoria" id={categoria.id} schema={categoriaPatch} armar={() => ({ activa: !categoria.activa })} />;
}
