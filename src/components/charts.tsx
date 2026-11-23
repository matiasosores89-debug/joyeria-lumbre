"use client";

import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { formas, pesos, pesosCompactos } from "@/lib/format";
import type { cargarTablero } from "@/services/tablero";
import { Vacio } from "./shared";

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);

type Datos = Awaited<ReturnType<typeof cargarTablero>>;
const colores = ["#642541", "#456b5d", "#c58a59"];

export function VentasDiarias({ data }: { data: Datos["ventasDiarias"] }) {
  return <div className="relative h-[250px] px-4 pb-4">
    <Line role="img" aria-label="Importe de ventas diarias de los últimos 30 días" data={{
      labels: data.map(d => d.fecha.slice(8, 10) + "/" + d.fecha.slice(5, 7)),
      datasets: [{ data: data.map(d => d.importe), borderColor: colores[0], backgroundColor: "#64254119",
        borderWidth: 2, pointRadius: 1.5, pointHoverRadius: 4, tension: .28, fill: true }],
    }} options={{
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => pesos(Number(context.raw)) } } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 7, color: "#6c5554" }, border: { display: false } },
        y: { beginAtZero: true, ticks: { maxTicksLimit: 5, color: "#6c5554", callback: value => pesosCompactos(Number(value)) },
          grid: { color: "#e7d7ca" }, border: { display: false } },
      },
    }} />
  </div>;
}

export function VentasPorPago({ data }: { data: Datos["porFormaDePago"] }) {
  const total = data.reduce((suma, fila) => suma + fila.importe, 0);
  if (!total) return <Vacio mensaje="Todavía no hay ventas este mes." />;
  return <div className="grid items-center gap-4 px-5 pb-5 sm:grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr]">
    <div className="relative mx-auto h-[150px] w-[150px]">
      <Doughnut role="img" aria-label="Distribución de ventas por forma de pago" data={{
        labels: data.map(fila => formas[fila.forma]),
        datasets: [{ data: data.map(fila => fila.importe), backgroundColor: colores, borderWidth: 2, borderColor: "#f3e8df" }],
      }} options={{ cutout: "73%", animation: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => formas[data[context.dataIndex].forma] + " · " + pesos(Number(context.raw)) } } } }} />
      <span className="pointer-events-none absolute inset-0 grid place-content-center text-center text-xs text-muted-foreground">Total<span className="font-bold text-foreground">{pesos(total)}</span></span>
    </div>
    <ul className="grid gap-2 text-xs">
      {data.map((fila, i) => <li key={fila.forma} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
        <span className="flex items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: colores[i] }} />{formas[fila.forma]}</span>
        <span className="font-semibold whitespace-nowrap">{pesos(fila.importe)}</span>
      </li>)}
    </ul>
  </div>;
}
