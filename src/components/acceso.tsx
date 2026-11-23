"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { KeyIcon } from "@phosphor-icons/react/dist/ssr/Key";
import { StorefrontIcon } from "@phosphor-icons/react/dist/ssr/Storefront";
import { iniciarAction } from "@/app/actions";
import { loginSchema } from "@/lib/validacion";
import type { RolDemo } from "@/lib/cuentas-demo";
import { Marca } from "./layout";
import { Campo, valor } from "./fields";
import { Aviso } from "./feedback";
import { useFormulario } from "./form-hook";
import { Button } from "./ui/button";

const accesos = [
  { rol: "admin", etiqueta: "Administración", icono: KeyIcon },
  { rol: "vendedor", etiqueta: "Ventas", icono: StorefrontIcon },
] as const;

export function Acceso({ cuentas }: { cuentas?: Partial<Record<RolDemo, { email: string; password: string }>> }) {
  const router = useRouter();
  const [elegido, setElegido] = useState<RolDemo | null>(null);
  const form = useFormulario({ schema: loginSchema, enviar: iniciarAction, exito: "Sesión iniciada.", alGuardar: () => {
    router.replace("/");
    router.refresh();
  } });
  const disponibles = accesos.filter(({ rol }) => cuentas?.[rol]);
  return <main className="acceso-ventana grid h-dvh grid-rows-[minmax(0,1fr)_auto] overflow-hidden md:grid-cols-[1.18fr_1fr] md:grid-rows-1">
    <section className="acceso-foto relative isolate order-2 flex h-[clamp(3rem,11dvh,8.5rem)] items-end overflow-hidden bg-wine-dark text-primary-foreground md:order-1 md:h-full">
      <Image src="/fotos/acceso.webp" alt="Joyería dorada de filigrana sobre tela" fill preload sizes="(min-width: 768px) 55vw, 100vw" className="object-cover object-[center_54%]" />
      <div className="absolute inset-0 hidden bg-linear-to-t from-wine-dark/95 via-wine-dark/20 to-transparent md:block" />
      <div className="relative m-8 mb-10 hidden w-full border-b border-gold-ink/60 pb-6 md:block lg:m-12 lg:mb-14">
        <span className="block font-display text-[clamp(5.4rem,11vw,11rem)] leading-[.8] tracking-[-.085em]">Lumbre</span>
        <span className="mt-6 block text-sm font-semibold uppercase tracking-[.35em] text-gold-ink">Joyas</span>
      </div>
    </section>
    <section className="order-1 flex min-h-0 flex-col overflow-y-auto overscroll-contain px-5 py-4 sm:px-10 sm:py-6 md:order-2 lg:px-14">
      <div className="mx-auto my-auto w-full max-w-[420px]">
        <div className="mb-5 text-wine md:hidden"><Marca /></div>
        <h1 className="font-display text-[clamp(2.6rem,5vw,5rem)] leading-[.94] font-medium tracking-[-.07em] text-wine">Iniciar <em className="font-normal">sesión</em></h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">Ingresá con tu cuenta de Lumbre Joyas.</p>
        <form noValidate className="mt-5 grid gap-3.5 border-t border-border pt-4" onSubmit={form.submit(data => {
          setElegido(null);
          return { email: valor(data, "email"), password: String(data.get("password") ?? "") };
        })}>
          <Campo label="Correo electrónico" name="email" autoComplete="username" type="email" placeholder="nombre@ejemplo.com" error={form.errores.email} required />
          <Campo label="Contraseña" name="password" autoComplete="current-password" type="password" error={form.errores.password} required />
          {!elegido && <Aviso aviso={form.aviso} />}
          <Button type="submit" size="lg" className="mt-0.5 w-full justify-between" disabled={form.guardando}>{form.guardando && !elegido ? "Ingresando…" : "Ingresar"}<ArrowRightIcon aria-hidden /></Button>
        </form>
        {disponibles.length > 0 && <section aria-labelledby="accesos-demo" className="mt-5 border-t border-primary/25 pt-3">
          <h2 id="accesos-demo" className="font-display text-xl font-medium tracking-tight text-wine">Acceso de prueba</h2>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {disponibles.map(({ rol, etiqueta, icono: Icono }) => <Button key={rol} type="button" variant="outline" size="lg"
              aria-label={"Ingresar como " + etiqueta}
              className="min-h-12 min-w-0 justify-start gap-1.5 bg-card px-2.5 text-xs min-[390px]:gap-2 min-[390px]:px-3 min-[390px]:text-sm"
              disabled={form.guardando} onClick={() => {
                if (form.guardando) return;
                setElegido(rol);
                void form.enviarDatos(cuentas?.[rol]);
              }}>
              <Icono weight="duotone" className="shrink-0" aria-hidden />
              <span className="min-w-0">{form.guardando && elegido === rol ? "Ingresando…" : etiqueta}</span>
              <ArrowUpRightIcon className="ml-auto shrink-0 max-[389px]:hidden" aria-hidden />
            </Button>)}
          </div>
          {elegido && form.aviso && <div className="mt-3"><Aviso aviso={form.aviso} /></div>}
        </section>}
      </div>
    </section>
  </main>;
}
