import Link from "next/link";
import { Encabezado } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function NoEncontrado() {
  return <><Encabezado titulo="No encontramos ese registro" /><Button asChild><Link href="/">Volver a inicio</Link></Button></>;
}
