import { exigirSesion } from "@/auth/session";
import { AppFrame } from "@/components/layout";

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame usuario={await exigirSesion()}>{children}</AppFrame>;
}
