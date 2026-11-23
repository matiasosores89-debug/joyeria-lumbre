import { CircleDashedIcon } from "@phosphor-icons/react/dist/ssr/CircleDashed";
import { CirclesThreeIcon } from "@phosphor-icons/react/dist/ssr/CirclesThree";
import { DiamondIcon } from "@phosphor-icons/react/dist/ssr/Diamond";
import { GiftIcon } from "@phosphor-icons/react/dist/ssr/Gift";
import { HeartIcon } from "@phosphor-icons/react/dist/ssr/Heart";
import { LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr/LinkSimple";
import { MoonStarsIcon } from "@phosphor-icons/react/dist/ssr/MoonStars";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { WatchIcon } from "@phosphor-icons/react/dist/ssr/Watch";
import { iconosCategoria, type IconoCategoria as ClaveIcono } from "@/lib/iconos-categoria";

const glifos = {
  diamante: { nombre: "Diamante", figura: DiamondIcon },
  anillo: { nombre: "Anillo", figura: CircleDashedIcon },
  aros: { nombre: "Aros", figura: CirclesThreeIcon },
  cadena: { nombre: "Cadena", figura: LinkSimpleIcon },
  destello: { nombre: "Destello", figura: SparkleIcon },
  reloj: { nombre: "Reloj", figura: WatchIcon },
  corazon: { nombre: "Corazón", figura: HeartIcon },
  regalo: { nombre: "Regalo", figura: GiftIcon },
  luna: { nombre: "Luna", figura: MoonStarsIcon },
} satisfies Record<ClaveIcono, { nombre: string; figura: typeof DiamondIcon }>;

const porNombre = new Map<string, ClaveIcono>([
  ["anillos", "anillo"], ["aros", "aros"], ["collares", "cadena"], ["pulseras", "destello"], ["relojes", "reloj"],
]);

export function IconoDeCategoria({ icono, nombre = "", size = 22 }: { icono?: ClaveIcono | null; nombre?: string; size?: number }) {
  const clave = icono ?? porNombre.get(nombre.trim().toLocaleLowerCase("es-AR")) ?? "diamante";
  const Figura = glifos[clave].figura;
  return <Figura data-icono-categoria={clave} size={size} weight="duotone" aria-hidden />;
}

export function GaleriaIconosCategoria({ icono, nombre, error }: { icono?: ClaveIcono | null; nombre?: string; error?: string }) {
  return <fieldset className="grid min-w-0 gap-2.5">
    <legend className="mb-2 text-sm font-medium">Ícono de la categoría</legend>
    <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-5">
      <OpcionIcono etiqueta="Automático" nombre={nombre} predeterminada={!icono} />
      {iconosCategoria.map(clave =>
        <OpcionIcono key={clave} etiqueta={glifos[clave].nombre} icono={clave} predeterminada={icono === clave} />)}
    </div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </fieldset>;
}

function OpcionIcono({ etiqueta, icono, nombre, predeterminada }: { etiqueta: string; icono?: ClaveIcono; nombre?: string; predeterminada: boolean }) {
  return <label className="min-w-0 cursor-pointer">
    <input className="peer sr-only" type="radio" name="icono" value={icono ?? ""} defaultChecked={predeterminada} />
    <span className="grid h-full min-h-14 place-content-center justify-items-center gap-1 rounded-sm border border-border bg-card px-1 py-1.5 text-center text-[.68rem] leading-tight font-semibold text-primary hover:border-primary/50 peer-checked:border-primary peer-checked:bg-rose-paper/60 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
      <IconoDeCategoria icono={icono} nombre={nombre} size={20} />
      {etiqueta}
    </span>
  </label>;
}
