CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`nombre` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorias_nombre_unique` ON `categorias` (`nombre`);--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`tipo_doc` text NOT NULL,
	`nro_doc` text NOT NULL,
	`nombre` text NOT NULL,
	`domicilio` text,
	`telefono` text,
	`email` text,
	`cuenta_corriente` integer DEFAULT false NOT NULL,
	`limite_credito` integer,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_nro_doc_unique` ON `clientes` (`nro_doc`);--> statement-breakpoint
CREATE TABLE `factura_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`factura_id` integer NOT NULL,
	`producto_id` integer NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unitario` integer NOT NULL,
	`subtotal` integer NOT NULL,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `factura_producto` ON `factura_items` (`factura_id`,`producto_id`);--> statement-breakpoint
CREATE TABLE `facturas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`punto_venta` integer DEFAULT 1 NOT NULL,
	`numero` integer NOT NULL,
	`fecha` text NOT NULL,
	`total` integer NOT NULL,
	`cliente_id` integer,
	`comprador` text,
	`usuario_id` integer NOT NULL,
	`vendedor_nombre` text NOT NULL,
	`forma` text NOT NULL,
	`tarjeta` text,
	`monto_recibido` integer,
	`estado` text DEFAULT 'emitida' NOT NULL,
	`motivo_anulacion` text,
	`fecha_anulacion` text,
	`anulador_id` integer,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulador_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facturas_numeracion` ON `facturas` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `facturas_fecha` ON `facturas` (`fecha`);--> statement-breakpoint
CREATE INDEX `facturas_cliente` ON `facturas` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `movimientos_cuenta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`fecha` text NOT NULL,
	`cliente_id` integer NOT NULL,
	`factura_id` integer,
	`pago_id` integer,
	`tipo` text NOT NULL,
	`importe` integer NOT NULL,
	`descripcion` text NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mov_cuenta_cliente_fecha` ON `movimientos_cuenta` (`cliente_id`,`fecha`);--> statement-breakpoint
CREATE TABLE `movimientos_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`fecha` text NOT NULL,
	`producto_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`factura_id` integer,
	`tipo` text NOT NULL,
	`cantidad` integer NOT NULL,
	`existencia_resultante` integer NOT NULL,
	`motivo` text NOT NULL,
	`observacion` text,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mov_stock_producto_fecha` ON `movimientos_stock` (`producto_id`,`fecha`);--> statement-breakpoint
CREATE TABLE `pagos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`numero` integer NOT NULL,
	`fecha` text NOT NULL,
	`cliente_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`importe` integer NOT NULL,
	`medio` text NOT NULL,
	`observacion` text,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pagos_numero_unique` ON `pagos` (`numero`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`categoria_id` integer NOT NULL,
	`precio` integer NOT NULL,
	`existencia` integer DEFAULT 0 NOT NULL,
	`stock_minimo` integer NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "stock_no_negativo" CHECK("productos"."existencia" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productos_codigo_unique` ON `productos` (`codigo`);--> statement-breakpoint
CREATE INDEX `productos_categoria` ON `productos` (`categoria_id`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`creado_en` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`email` text NOT NULL,
	`nombre` text NOT NULL,
	`password_hash` text NOT NULL,
	`rol` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`version_sesion` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);