"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { XIcon as X } from "@phosphor-icons/react/dist/ssr/X";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({ open, onOpenChange, trigger, title, description, children, className, encabezadoFijo = false }: {
  open: boolean; onOpenChange: (open: boolean) => void; trigger: ReactNode;
  title: string; description?: string; children: ReactNode; className?: string; encabezadoFijo?: boolean;
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-wine-dark/60" />
      <Dialog.Content className={cn("fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border border-primary/30 bg-card shadow-[0_16px_50px_#33102235]", !encabezadoFijo && "p-6 sm:p-7", className)}>
        <div className={encabezadoFijo ? "sticky top-0 z-20 border-b border-border bg-card px-4 pt-4 pb-3 sm:px-7 sm:pt-5" : undefined}>
          <Dialog.Title className="pr-10 font-display text-[2rem] leading-tight font-medium tracking-[-.045em] text-wine [overflow-wrap:anywhere]">{title}</Dialog.Title>
          <Dialog.Description className={description ? "mt-1 pr-8 text-sm text-muted-foreground" : "sr-only"}>{description ?? title}</Dialog.Description>
          <Dialog.Close className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Cerrar"><X size={18} /></Dialog.Close>
        </div>
        <div className={encabezadoFijo ? "p-4 sm:p-7" : "mt-5"}>{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
