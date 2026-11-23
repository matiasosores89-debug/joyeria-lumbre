"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Gem, LayoutDashboard, LogOut, Menu, Package, Receipt, Shield, Users, X } from "lucide-react";
import { mutarAction } from "@/app/actions";
import type { Usuario } from "@/services/comun";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const modulos = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/usuarios", label: "Usuarios", icon: Shield, admin: true },
];

export function Marca({ dark = false }: { dark?: boolean }) {
  return <span className="flex items-center gap-3">
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", dark ? "border-white/20 bg-white/6 text-[#edc797]" : "border-[#e8d6c0] bg-[#f3e9dc] text-primary")}><Gem size={20} strokeWidth={1.4} /></span>
    <span><span className="block font-display text-[23px] leading-none tracking-tight">Lumbre</span><span className={cn("mt-1 block text-[10px] font-semibold uppercase tracking-[.23em]", dark ? "text-[#d9bea6]" : "text-muted-foreground")}>Joyas</span></span>
  </span>;
}

export function AppFrame({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState("");
  const activo = modulos.find(({ href }) => href === "/" ? pathname === "/" : pathname.startsWith(href))?.label ?? (pathname.startsWith("/pagos") ? "Clientes" : "Mi perfil");
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
    {abierto && <button className="no-print fixed inset-0 z-30 bg-black/45 lg:hidden" onClick={() => setAbierto(false)} aria-label="Cerrar menú" />}
    <aside aria-label="Módulos" className={cn("no-print fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-[#4b392c] bg-[#302319] p-4 text-[#fff8ed] transition-transform lg:translate-x-0", abierto ? "translate-x-0" : "-translate-x-full max-lg:invisible")}>
      <div className="flex items-center justify-between px-2 pt-4 pb-10">
        <Link href="/" onClick={() => setAbierto(false)} aria-label="Inicio de Lumbre"><Marca dark /></Link>
        <Button variant="ghost" size="icon" className="lg:hidden text-[#e5cdb7] hover:bg-white/10" onClick={() => setAbierto(false)} aria-label="Cerrar menú"><X /></Button>
      </div>
      <nav className="grid gap-1.5">{modulos.filter(m => !m.admin || usuario.rol === "admin").map(({ href, label, icon: Icon }) => <Link
        key={href} href={href} onClick={() => setAbierto(false)} aria-current={activo === label ? "page" : undefined}
        className={cn("flex min-h-11 items-center gap-3 rounded-lg border px-3.5 text-sm font-medium transition-colors", activo === label
          ? "border-[#6a4a32] bg-[#523a28] text-[#fff2de]" : "border-transparent text-[#decebd] hover:bg-white/7 hover:text-white")}>
        <Icon size={17} strokeWidth={1.6} />{label}
      </Link>)}</nav>
      <div className="mt-auto border-t border-white/12 px-2 pt-4 pb-2">
        <Link href="/perfil" onClick={() => setAbierto(false)} className="flex items-center gap-2 rounded-md py-1 text-xs font-medium text-[#dfc8b1] hover:text-white">Mi perfil <ArrowUpRight size={13} /></Link>
      </div>
    </aside>
    <div className="min-h-dvh lg:pl-[232px] print:pl-0">
      <header className="no-print sticky top-0 z-20 flex min-h-[66px] items-center justify-between gap-2 border-b border-border bg-card px-4 sm:px-7 lg:px-9">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setAbierto(true)} aria-label="Abrir menú" aria-expanded={abierto}><Menu /></Button>
          <span className="truncate text-sm font-semibold">{activo}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/perfil" className="flex min-w-0 items-center gap-2.5 rounded-md">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f2e7d9] text-xs font-bold text-primary">{usuario.nombre.split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase()}</span>
            <span className="hidden sm:block"><span className="block max-w-40 truncate text-xs font-bold">{usuario.nombre}</span><span className="block text-xs text-muted-foreground">{usuario.rol === "admin" ? "Administración" : "Ventas"}</span></span>
          </Link>
          <Button variant="ghost" size="sm" disabled={saliendo} onClick={salir} aria-label="Cerrar sesión"><LogOut /><span className="hidden sm:inline">Salir</span></Button>
        </div>
      </header>
      {error && <p className="px-5 pt-3 text-sm text-destructive" role="alert">{error}</p>}
      <main className="mx-auto max-w-[1520px] px-4 pt-6 pb-12 sm:px-7 lg:px-9 lg:pt-8 print:max-w-none print:p-0">{children}</main>
    </div>
  </>;
}
