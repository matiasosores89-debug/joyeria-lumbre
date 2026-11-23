import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Lumbre Joyas", template: "%s · Lumbre Joyas" }, description: "Gestión comercial de Lumbre Joyas" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
