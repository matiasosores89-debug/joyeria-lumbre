export const zonaArgentina = "America/Argentina/Buenos_Aires";
const moneda = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaLocal = new Intl.DateTimeFormat("es-AR", { timeZone: zonaArgentina, dateStyle: "short", timeStyle: "short" });
const fechaISO = new Intl.DateTimeFormat("sv-SE", { timeZone: zonaArgentina, year: "numeric", month: "2-digit", day: "2-digit" });
export const pesos = (centavos: number) => "$ " + moneda.format(centavos / 100);
export const fechaHora = (iso: string) => fechaLocal.format(new Date(iso));
export const fechaArgentina = (fecha = new Date()) => fechaISO.format(fecha);
export const inicioDia = (dia: string) => new Date(dia + "T00:00:00-03:00").toISOString();
export const diaSiguiente = (dia: string) => new Date(Date.parse(inicioDia(dia)) + 86_400_000).toISOString();
export const documento = (tipo: string, nro: string) => tipo === "CUIT"
  ? nro.replace(/^(\d{2})(\d{8})(\d)$/, "$1-$2-$3")
  : nro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const numeroFactura = (numero: number, punto = 1) => String(punto).padStart(4, "0") + "-" + String(numero).padStart(8, "0");
export const numeroRecibo = (numero: number) => "R " + numeroFactura(numero);

export const formas = { contado: "Contado", tarjeta: "Tarjeta", cuenta_corriente: "Cuenta corriente" };
export const medios = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta_debito: "Tarjeta de débito" };
export const tiposStock = { ingreso: "Ingreso", egreso: "Egreso", venta: "Venta", anulacion: "Anulación" };
