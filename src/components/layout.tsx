"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { DoorOpenIcon } from "@phosphor-icons/react/dist/ssr/DoorOpen";
import { FlowerLotusIcon } from "@phosphor-icons/react/dist/ssr/FlowerLotus";
import { HandbagIcon } from "@phosphor-icons/react/dist/ssr/Handbag";
import { HouseLineIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { UserListIcon } from "@phosphor-icons/react/dist/ssr/UserList";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { mutarAction } from "@/app/actions";
import type { Usuario } from "@/services/comun";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const modulos = [
  { href: "/", label: "Inicio", icon: HouseLineIcon },
  { href: "/ventas", label: "Ventas", icon: ReceiptIcon },
  { href: "/productos", label: "Productos", icon: HandbagIcon },
  { href: "/clientes", label: "Clientes", icon: UsersThreeIcon },
  { href: "/usuarios", label: "Usuarios", icon: UserListIcon, admin: true },
];

export function Marca({ dark = false }: { dark?: boolean }) {
  return <span className="inline-flex items-center gap-3">
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full border", dark ? "border-gold-ink/50 text-gold-ink" : "border-primary/35 text-primary")}>
      <FlowerLotusIcon size={22} weight="duotone" aria-hidden />
    </span>
    <span className="text-left">
      <span className="block font-display text-[2rem] leading-[.9] tracking-[-.055em]">Lumbre</span>
      <span className={cn("mt-2 block text-[.63rem] font-semibold uppercase tracking-[.29em]", dark ? "text-gold-ink" : "text-primary")}>Joyas</span>
    </span>
  </span>;
}

export function AppFrame({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const abrir = useRef<HTMLButtonElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState("");
  const activo = modulos.find(({ href }) => href === "/" ? pathname === "/" : pathname.startsWith(href))?.label ?? (pathname.startsWith("/pagos") ? "Clientes" : "Mi perfil");

  function cerrarMenu() {
    setAbierto(false);
    abrir.current?.focus();
  }

  useEffect(() => {
    if (!abierto) return;
    cerrar.current?.focus();
    function tecla(event: KeyboardEvent) {
      if (event.key === "Escape") cerrarMenu();
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto]);

  async function salir() {
    setSaliendo(true);
    setError("");
    const resultado = await mutarAction("salir", null, null).catch(() => null);
    if (resultado?.ok || (resultado && !resultado.ok && resultado.error.code === "NO_AUTENTICADO")) {
      router.replace("/login");
      router.refresh();
    } else {
      setError("No se pudo cerrar la sesión.");
      setSaliendo(false);
    }
  }

  return <>
    <a href="#contenido" className="no-print sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-card focus:p-3">Saltar al contenido</a>
    {abierto && <button className="no-print fixed inset-0 z-30 bg-wine-dark/55 lg:hidden" onClick={cerrarMenu} aria-label="Cerrar menú lateral" tabIndex={-1} />}
    <aside id="modulos" aria-label="Módulos" className={cn("no-print fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col overflow-y-auto border-r border-gold-ink/25 bg-wine-dark px-5 py-5 text-primary-foreground motion-safe:transition-transform lg:translate-x-0", abierto ? "translate-x-0" : "-translate-x-full max-lg:invisible")}>
      <div className="flex items-center justify-between border-b border-gold-ink/25 px-1 pt-3 pb-7">
        <Link href="/" onClick={() => setAbierto(false)} aria-label="Inicio de Lumbre"><Marca dark /></Link>
        <Button ref={cerrar} variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 lg:hidden" onClick={cerrarMenu} aria-label="Cerrar menú"><XIcon aria-hidden /></Button>
      </div>
      <nav aria-label="Navegación principal" className="mt-7 grid gap-1.5">{modulos.filter(m => !m.admin || usuario.rol === "admin").map(({ href, label, icon: Icon }) => <Link
        key={href} href={href} onClick={() => setAbierto(false)} aria-current={activo === label ? "page" : undefined}
        className={cn("relative flex min-h-12 items-center gap-3 border-l-2 px-3.5 text-[.94rem] font-medium transition-colors", activo === label
          ? "border-gold-ink bg-[#622a46] font-semibold text-primary-foreground" : "border-transparent text-[#e9d3da] hover:bg-white/8 hover:text-white")}>
        <Icon size={21} weight={activo === label ? "duotone" : "regular"} aria-hidden />{label}
      </Link>)}</nav>
      <div className="mt-auto border-t border-gold-ink/25 px-2 pt-4 pb-2">
        <Link href="/perfil" onClick={() => setAbierto(false)} className="flex w-fit items-center gap-2 py-1 text-sm font-medium text-[#ead6db] hover:text-white">Mi perfil <ArrowUpRightIcon size={14} aria-hidden /></Link>
      </div>
    </aside>
    <div className="min-h-dvh lg:pl-[244px] print:pl-0">
      <header className="no-print sticky top-0 z-20 flex min-h-[68px] items-center justify-between gap-2 border-b border-border bg-background px-4 sm:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <Button ref={abrir} variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setAbierto(true)} aria-label="Abrir menú" aria-expanded={abierto} aria-controls="modulos"><ListIcon aria-hidden /></Button>
          <span className="truncate text-xs font-bold uppercase tracking-[.16em] text-primary">{activo}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/perfil" className="flex min-w-0 items-center gap-2.5" aria-label={"Perfil de " + usuario.nombre}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-rose-paper text-xs font-bold text-primary">{usuario.nombre.split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase()}</span>
            <span className="hidden sm:block"><span className="block max-w-40 truncate text-sm font-bold">{usuario.nombre}</span><span className="block text-xs text-muted-foreground">{usuario.rol === "admin" ? "Administración" : "Ventas"}</span></span>
          </Link>
          <Button variant="ghost" size="sm" disabled={saliendo} onClick={salir} aria-label="Cerrar sesión"><DoorOpenIcon aria-hidden /><span className="hidden sm:inline">Salir</span></Button>
        </div>
      </header>
      {error && <p className="px-5 pt-3 text-sm text-destructive" role="alert">{error}</p>}
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-[1530px] px-4 pt-6 pb-14 outline-none sm:px-8 lg:pt-8 xl:px-10 print:max-w-none print:p-0">{children}</main>
    </div>
  </>;
}
