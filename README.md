# Lumbre Joyas

Sistema de gestión comercial para una joyería de un local. El personal puede emitir comprobantes internos, registrar ingresos y egresos de stock y llevar la cuenta corriente de los clientes. El tablero resume ventas, deuda y reposición en pesos argentinos.

Trabajo del segundo parcial de Programación IV. [Enunciado](https://github.com/AlejandroDiBattista/tup26-p4/blob/main/enunciados/tp5/enunciado.md) · [Requerimientos y API REST](https://github.com/AlejandroDiBattista/tup26-p4/blob/main/enunciados/tp5/requerimientos.md).

**Integrantes** · Pendiente de completar con los tres nombres y legajos.

**URL pública** · [Lumbre Joyas en Vercel](https://lumbre-joyas.vercel.app).

## Puesta en marcha local

Requisitos. Node.js 22 o superior y pnpm.

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). En PowerShell se puede usar `Copy-Item .env.example .env`. Si pnpm se administra con Corepack, usar `corepack pnpm` en lugar de `pnpm`. La migración crea el secreto local en `.env.local` si todavía falta.

| Rol | Email local | Contraseña local |
| --- | --- | --- |
| Administrador | `admin@lumbre.test` | `LumbreAdmin2026!` |
| Vendedor | `ventas@lumbre.test` | `LumbreVentas2026!` |

La carga crea 5 categorías, 30 productos, 10 clientes, 50 facturas distribuidas en los últimos 30 días y recibos de ejemplo. Los movimientos de inventario y cuenta se generan con los servicios de la aplicación.

## Qué cubre el sistema

| Requerimientos | Funcionalidad |
| --- | --- |
| RF-V1 a RF-V9 | Venta de contado con vuelto, tarjeta o cuenta corriente. Alta rápida de clientes, comprobante imprimible, historial con filtros y anulación. |
| RF-P1 a RF-P7 | Catálogo, categorías, bajas lógicas, alerta de stock mínimo, movimientos manuales e historial. |
| RF-C1 a RF-C7 | Ficha de clientes, límites de crédito, libro de movimientos, pagos con recibo y resumen de deuda. |
| RF-U1 a RF-U5 | Inicio y cierre de sesión, roles, gestión de usuarios, revocación y contraseñas. |
| RF-T1 a RF-T3 | Indicadores diarios y mensuales, dos gráficos con Chart.js y los cinco productos más vendidos. |

## Organización del código

- [src/db/schema.ts](src/db/schema.ts) define las tablas con Drizzle. Las migraciones de Drizzle Kit se guardan en [drizzle](drizzle) y [src/db/index.ts](src/db/index.ts) abre SQLite local o libSQL de Turso.
- [src/services](src/services) concentra validación, permisos, consultas y reglas del negocio. Los importes se guardan en centavos enteros.
- [src/services/facturas.ts](src/services/facturas.ts) confirma y anula facturas en transacciones de escritura. En la emisión se congela el precio y se asigna el correlativo después de validar la operación. [moverStock](src/services/stock.ts) actualiza la existencia con una condición y registra el movimiento en la misma transacción.
- [src/services/clientes.ts](src/services/clientes.ts) deriva el saldo de los débitos y créditos. Una anulación acredita el total de la factura. Si el crédito excede la deuda, el ajuste deja la cuenta en cero y el comprobante identifica el importe pendiente de reintegrar por fuera del sistema.
- [src/app/api](src/app/api) implementa los 31 métodos de la consigna con Route Handlers. [src/adapters/http.ts](src/adapters/http.ts) centraliza sesión, parámetros, cuerpo y errores. [src/app/actions.ts](src/app/actions.ts) llama a los mismos servicios en las mutaciones de pantalla.
- [src/auth](src/auth) firma la cookie `httpOnly` y comprueba el usuario contra la base en cada pedido. La contraseña se guarda con bcrypt y el cambio, el restablecimiento, la desactivación y el cambio de rol invalidan las sesiones previas.
- [src/app/(gestion)](src/app/(gestion)) contiene las páginas privadas del App Router. Las pantallas de lectura usan Server Components y filtros en la URL. La interfaz usa Tailwind, componentes shadcn/ui adaptados y esquemas Zod compartidos.

## Pruebas

```bash
pnpm test
pnpm run typecheck
pnpm run build
```

Las pruebas usan SQLite en memoria. Cubren permisos, campos estrictos, ventas simultáneas con una sola unidad, reversión ante una falla intermedia, numeración, precios históricos, límites de crédito, pagos y anulación.

Para la defensa, iniciar sesión como administrador y probar una venta a consumidor final, una venta a cuenta corriente con un cliente dado de alta en el momento, un pago con recibo y una anulación. Revisar los movimientos de stock y cuenta después de cada paso. Con el vendedor, verificar que la API devuelve `403` al intentar cambiar el precio o anular.

## Publicación en Vercel y Turso

| Variable | Local | Producción |
| --- | --- | --- |
| `DATABASE_URL` | `file:lumbre.db` | URL de Turso que empieza con `libsql://`. Si falta, se usa `TURSO_DATABASE_URL`. |
| `TURSO_DATABASE_URL` | Vacía | URL que configura la integración de Turso del Marketplace de Vercel. |
| `TURSO_AUTH_TOKEN` | Vacía | Token con acceso de escritura a la base. |
| `AUTH_SECRET` | Se genera en la primera migración | Secreto aleatorio de al menos 32 caracteres. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Valores de demostración | Credenciales de prueba configuradas para la carga. |
| `SEED_VENDEDOR_EMAIL`, `SEED_VENDEDOR_PASSWORD` | Valores de demostración | Credenciales de prueba configuradas para la carga. |

1. Crear una base de Turso. Obtener su URL y generar un token con permisos de escritura en el panel. La CLI permite usar `turso db create lumbre-joyas`, `turso db show lumbre-joyas --url` y `turso db tokens create lumbre-joyas`. [Documentación de Turso](https://docs.turso.tech/cli/db/create) · [Tokens de Turso](https://docs.turso.tech/cli/db/tokens/create).
2. En una terminal nueva, configurar las variables de Turso y de los dos usuarios de prueba antes de correr `pnpm run db:migrate` y `pnpm run db:seed`. En PowerShell se usa `$env:NOMBRE = "valor"`. Las variables de la terminal tienen prioridad sobre `.env`.
3. Subir la rama `main` al repositorio del grupo. Importar ese repositorio desde Vercel con el preset Next.js. En el proyecto de Vercel configurar `DATABASE_URL`, `TURSO_AUTH_TOKEN` y `AUTH_SECRET` para Production. Para generar este último se puede usar `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. [Next.js en Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) · [Variables de entorno](https://vercel.com/docs/environment-variables).
4. Abrir la URL con los dos roles. Registrar una venta de prueba y comprobar que aparece en Turso. Completar la sección de integrantes, anotar la URL pública en este README y compartir los accesos de evaluación con el docente.

Si usás [Turso desde el Marketplace de Vercel](https://vercel.com/marketplace/tursocloud/database), podés vincular la base al entorno Production. La integración configura `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. Para migrar y cargar esa base desde un entorno con `.env` local, pasá su URL de Turso como `DATABASE_URL` en la terminal antes de ejecutar los comandos.

## Créditos fotográficos

- Acceso. [Planet Volumes en Unsplash](https://unsplash.com/photos/a-close-up-of-a-womans-gold-jewelry--lpL_EoKMyI).
- Tablero. [Focal Insight Photography en Unsplash](https://unsplash.com/photos/a-close-up-of-a-gold-chain-with-rings-on-it-_7CfuX0S92o).
- Catálogo. [Oscar Ramirez en Unsplash](https://unsplash.com/photos/a-pair-of-gold-rings-sitting-on-top-of-a-white-box-cFY0oVaxN3g).

## Uso de IA

Se usó Codex para implementar y probar el sistema. Durante la verificación se corrigió un desborde móvil de las tablas y se comprobó la reversión de una factura ante una falla provocada luego de actualizar el stock de uno de sus productos.
