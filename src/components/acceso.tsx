"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
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
  return <main className="grid min-h-dvh grid-rows-[1fr_auto] md:grid-cols-[1.18fr_1fr] md:grid-rows-1">
    <section className="relative isolate order-2 flex h-40 items-end overflow-hidden bg-wine-dark text-primary-foreground md:order-1 md:h-full">
      <Image src="/fotos/acceso.webp" alt="Joyería dorada de filigrana sobre tela" fill preload sizes="(min-width: 768px) 55vw, 100vw" className="object-cover object-[center_54%]" />
      <div className="absolute inset-0 hidden bg-linear-to-t from-wine-dark/95 via-wine-dark/20 to-transparent md:block" />
      <div className="relative m-8 mb-10 hidden w-full border-b border-gold-ink/60 pb-6 md:block lg:m-12 lg:mb-14">
        <span className="block font-display text-[clamp(5.4rem,11vw,11rem)] leading-[.8] tracking-[-.085em]">Lumbre</span>
        <span className="mt-6 block text-sm font-semibold uppercase tracking-[.35em] text-gold-ink">Joyas</span>
      </div>
    </section>
    <section className="order-1 flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-14 md:order-2 lg:px-16">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="mb-10 text-wine md:hidden"><Marca /></div>
        <h1 className="font-display text-[clamp(3.2rem,5.3vw,5.5rem)] leading-[.94] font-medium tracking-[-.07em] text-wine">Iniciar <em className="font-normal">sesión</em></h1>
        <p className="mt-5 text-base text-muted-foreground">Ingresá con tu cuenta de Lumbre Joyas.</p>
        <form noValidate className="mt-8 grid gap-5 border-t border-border pt-7" onSubmit={form.submit(data => ({ email: valor(data, "email"), password: String(data.get("password") ?? "") }))}>
          <Campo label="Correo electrónico" name="email" autoComplete="username" type="email" placeholder="nombre@ejemplo.com" error={form.errores.email} required />
          <Campo label="Contraseña" name="password" autoComplete="current-password" type="password" error={form.errores.password} required />
          <Aviso aviso={form.aviso} />
          <Button type="submit" size="lg" className="mt-2 w-full justify-between" disabled={form.guardando}>{form.guardando ? "Ingresando…" : "Ingresar"}<ArrowRightIcon aria-hidden /></Button>
        </form>
      </div>
    </section>
  </main>;
}
