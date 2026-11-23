"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Gem } from "lucide-react";
import { iniciarAction } from "@/app/actions";
import { loginSchema } from "@/lib/validacion";
import { Marca } from "./layout";
import { Campo, valor } from "./fields";
import { Aviso } from "./feedback";
import { useFormulario } from "./form-hook";
import { Button } from "./ui/button";

export function Acceso() {
  const router = useRouter();
  const form = useFormulario({ schema: loginSchema, enviar: iniciarAction, alGuardar: () => {
    router.replace("/");
    router.refresh();
  } });
  return <main className="grid min-h-dvh md:grid-cols-[.85fr_1.15fr]">
    <section className="relative hidden overflow-hidden bg-[#302319] px-12 py-11 text-[#fff5e7] md:flex md:flex-col md:justify-between lg:px-16">
      <Marca dark />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-[#ac7c55]/25">
        <div className="absolute size-80 rotate-45 rounded-[2.5rem] border border-[#c59566]/20 lg:size-[25rem]" />
        <div className="absolute size-64 rotate-45 rounded-[2.25rem] border border-[#c59566]/26 lg:size-80" />
        <Gem size={180} strokeWidth={.55} />
      </div>
      <div className="relative"><p className="font-display text-4xl leading-tight lg:text-5xl">Gestión de joyería</p><p className="mt-3 text-sm text-[#e0c4ab]">Ventas, existencias y cuentas corrientes.</p></div>
    </section>
    <section className="flex flex-col justify-center px-6 py-10 sm:px-12">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="mb-9 md:hidden"><Marca /></div>
        <h1 className="font-display text-[2.65rem] leading-tight tracking-tight">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ingresá con tu cuenta de Lumbre Joyas.</p>
        <form noValidate className="mt-8 grid gap-4" onSubmit={form.submit(data => ({ email: valor(data, "email"), password: String(data.get("password") ?? "") }))}>
          <Campo label="Correo electrónico" name="email" autoComplete="username" type="email" placeholder="nombre@ejemplo.com" error={form.errores.email} required />
          <Campo label="Contraseña" name="password" autoComplete="current-password" type="password" error={form.errores.password} required />
          <Aviso aviso={form.aviso} />
          <Button type="submit" size="lg" className="mt-1 w-full justify-between" disabled={form.guardando}>{form.guardando ? "Ingresando…" : "Ingresar"}<ArrowRight /></Button>
        </form>
      </div>
    </section>
  </main>;
}
