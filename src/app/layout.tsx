import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Lumbre Joyas", template: "%s · Lumbre Joyas" }, description: "Gestión comercial de Lumbre Joyas" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
