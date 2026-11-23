"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({ open, onOpenChange, trigger, title, description, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; trigger: ReactNode;
  title: string; description?: string; children: ReactNode;
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[#211813]/55" />
      <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <Dialog.Title className="text-xl font-semibold tracking-tight pr-8">{title}</Dialog.Title>
        <Dialog.Description className={description ? "mt-1 text-sm text-muted-foreground" : "sr-only"}>{description ?? title}</Dialog.Description>
        <Dialog.Close className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Cerrar"><X size={18} /></Dialog.Close>
        <div className="mt-5">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
