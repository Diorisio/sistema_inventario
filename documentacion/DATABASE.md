# DATABASE.md — Modelo de Datos, Esquema Relacional y Seguridad

Este documento describe la arquitectura de datos, el diagrama entidad-relación textual, el diccionario de tablas, restricciones, índices, políticas de seguridad RLS y la configuración de almacenamiento en PostgreSQL / Supabase para el **Sistema de Gestión de Inventario y Cadena de Distribución (Adidas)**.

---

## 🗺️ 1. Diagrama Entidad-Relación Textual

```
+------------------+         1:1         +------------------+
|    auth.users    | ------------------- |     profiles     |
+------------------+                     +------------------+
                                                   |
                                                   | 1:N (creado_por / asignado_a)
                                                   v
+------------------+         1:N         +------------------+
|    suppliers     | ------------------- | purchase_orders  |
+------------------+                     +------------------+
                                                   |
                                                   | 1:N
                                                   v
+------------------+         1:N         +-----------------------+
|     products     | ------------------- | purchase_order_items  |
+------------------+                     +-----------------------+
        |                                          |
        | 1:N                                      | 1:N (referencia de orden)
        v                                          v
+------------------+         1:N         +-----------------------+
| inventory_items  | <------------------ |      receptions       |
| (SKU x Talla)    |                     +-----------------------+
+------------------+                               |
        |                                          | 1:N
        | 1:N                                      v
        |                                +-----------------------+
        | -----------------------------> |    reception_items    |
        |                                +-----------------------+
        | 1:N
        +------------------------------> +-----------------------+
        |                                |  inventory_movements  |
        |                                |  (Kardex inmutable)   |
        |                                +-----------------------+
        |
        | 1:N
        +------------------------------> +-----------------------+
                                         |     stock_alerts      |
                                         | (Alertas automáticas) |
                                         +-----------------------+
```

---

## 📊 2. Diccionario de Datos y Tablas

### 2.1 Enumeraciones (ENUMs)

- `user_role`: `'admin'`, `'jefe_compra'`, `'jefe_bodega'`, `'auxiliar_logistico'`, `'coordinador_despacho'`, `'sector_ventas'`.
- `product_category`: `'Originales'`, `'Corredor'`, `'Futbol'`, `'Training'`, `'Basketball'`, `'Outdoor'`.
- `order_status`: `'borrador'`, `'pendiente_aprobacion'`, `'aprobada'`, `'enviada'`, `'recibida_parcial'`, `'recibida_total'`, `'cancelada'`.
- `movement_type`: `'ENTRADA'`, `'SALIDA'`, `'AJUSTE_POSITIVO'`, `'AJUSTE_NEGATIVO'`, `'DESPACHO'`.
- `alert_severity`: `'BAJA'`, `'MEDIA'`, `'ALTA'`, `'CRITICA'`.
- `alert_status`: `'PENDIENTE'`, `'EN_GESTION'`, `'RESUELTA'`.

---

### 2.2 Tablas Principales

#### 1. `profiles`
Extensión de `auth.users` que almacena los datos de identidad y el rol operativo dentro de la organización.
- `id` (UUID, PK, FK -> `auth.users.id` ON DELETE CASCADE)
- `email` (TEXT, NOT NULL, UNIQUE)
- `full_name` (TEXT, NOT NULL)
- `role` (user_role, NOT NULL DEFAULT `'sector_ventas'`)
- `phone` (TEXT)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

#### 2. `suppliers`
Proveedores de calzado autorizados nacionales e internacionales.
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `nit` (TEXT, UNIQUE, NOT NULL)
- `company_name` (TEXT, NOT NULL)
- `contact_name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL)
- `phone` (TEXT, NOT NULL)
- `address` (TEXT)
- `city` (TEXT DEFAULT `'Bogotá'`)
- `country` (TEXT DEFAULT `'Colombia'`)
- `is_active` (BOOLEAN DEFAULT true)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

#### 3. `products`
Modelos de calzado matriz (sin discriminar por talla).
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `reference_code` (TEXT, NOT NULL, UNIQUE) — ej: `B75806` (Samba OG)
- `name` (TEXT, NOT NULL) — ej: `Samba OG Shoes`
- `category` (product_category, NOT NULL)
- `gender` (TEXT NOT NULL) — `Unisex`, `Hombre`, `Mujer`, `Niños`
- `colorway` (TEXT NOT NULL) — ej: `Cloud White / Core Black / Clear Granite`
- `base_cost` (NUMERIC(12,2) NOT NULL CHECK (base_cost >= 0))
- `retail_price` (NUMERIC(12,2) NOT NULL CHECK (retail_price >= base_cost))
- `image_url` (TEXT)
- `is_active` (BOOLEAN DEFAULT true)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

#### 4. `inventory_items`
Existencias específicas por combinación de Producto + Talla (SKU único).
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `product_id` (UUID, NOT NULL, FK -> `products.id` ON DELETE RESTRICT)
- `sku` (TEXT, NOT NULL, UNIQUE) — ej: `SAM-OG-WHT-40`
- `size_us` (TEXT NOT NULL) — ej: `8.5`
- `size_col` (TEXT NOT NULL) — ej: `40`
- `current_stock` (INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0))
- `stock_minimo` (INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0))
- `stock_maximo` (INTEGER NOT NULL DEFAULT 50 CHECK (stock_maximo >= stock_minimo))
- `warehouse_location` (TEXT NOT NULL DEFAULT `'A-01-01'`)
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

#### 5. `purchase_orders`
Órdenes de compra generadas para abastecimiento.
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_number` (TEXT, NOT NULL, UNIQUE) — ej: `PO-2026-001`
- `supplier_id` (UUID, NOT NULL, FK -> `suppliers.id`)
- `created_by` (UUID, NOT NULL, FK -> `profiles.id`)
- `approved_by` (UUID, FK -> `profiles.id`)
- `status` (order_status, DEFAULT `'borrador'`)
- `total_amount` (NUMERIC(14,2) DEFAULT 0 CHECK (total_amount >= 0))
- `currency` (TEXT DEFAULT `'COP'`)
- `estimated_delivery_date` (DATE)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())

#### 6. `purchase_order_items`
Detalle de productos y tallas en cada orden de compra.
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `order_id` (UUID, NOT NULL, FK -> `purchase_orders.id` ON DELETE CASCADE)
- `product_id` (UUID, NOT NULL, FK -> `products.id`)
- `size_col` (TEXT NOT NULL)
- `quantity_ordered` (INTEGER NOT NULL CHECK (quantity_ordered > 0))
- `unit_cost` (NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0))
- `subtotal` (NUMERIC(14,2) NOT NULL)

#### 7. `receptions`
Actas de recepción y verificación en muelle de bodega.
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `reception_number` (TEXT, NOT NULL, UNIQUE) — ej: `REC-2026-001`
- `order_id` (UUID, NOT NULL, FK -> `purchase_orders.id`)
- `received_by` (UUID, NOT NULL, FK -> `profiles.id`)
- `carrier_name` (TEXT)
- `waybill_number` (TEXT) — Número de guía de transporte
- `has_discrepancies` (BOOLEAN DEFAULT false)
- `notes` (TEXT)
- `reception_date` (TIMESTAMPTZ DEFAULT now())

#### 8. `reception_items`
Conteo físico verificado por línea y talla recibida.
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `reception_id` (UUID, NOT NULL, FK -> `receptions.id` ON DELETE CASCADE)
- `product_id` (UUID, NOT NULL, FK -> `products.id`)
- `size_col` (TEXT NOT NULL)
- `quantity_ordered` (INTEGER NOT NULL)
- `quantity_received` (INTEGER NOT NULL CHECK (quantity_received >= 0))
- `quantity_damaged` (INTEGER NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0))

#### 9. `inventory_movements` (Kardex Inmutable)
Registro estricto y auditable de cada entrada, salida y ajuste.
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `movement_date` (TIMESTAMPTZ NOT NULL DEFAULT now())
- `movement_type` (movement_type NOT NULL)
- `inventory_item_id` (UUID, NOT NULL, FK -> `inventory_items.id`)
- `product_reference` (TEXT NOT NULL)
- `product_name` (TEXT NOT NULL)
- `product_category` (TEXT NOT NULL)
- `size_col` (TEXT NOT NULL)
- `quantity` (INTEGER NOT NULL CHECK (quantity > 0))
- `previous_stock` (INTEGER NOT NULL)
- `new_stock` (INTEGER NOT NULL)
- `user_id` (UUID, NOT NULL, FK -> `profiles.id`)
- `user_name` (TEXT NOT NULL)
- `support_document` (TEXT) — ej: `PO-2026-001`, `DESP-1044`
- `notes` (TEXT)

#### 10. `stock_alerts`
Alertas automáticas por falta o proximidad a cero en inventario.
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `inventory_item_id` (UUID, NOT NULL, FK -> `inventory_items.id`)
- `current_stock` (INTEGER NOT NULL)
- `stock_minimo` (INTEGER NOT NULL)
- `deficit` (INTEGER NOT NULL)
- `severity` (alert_severity NOT NULL)
- `status` (alert_status NOT NULL DEFAULT `'PENDIENTE'`)
- `created_at` (TIMESTAMPTZ DEFAULT now())
- `resolved_at` (TIMESTAMPTZ)
- `resolved_by` (UUID, FK -> `profiles.id`)

---

## ⚡ 3. Índices de Rendimiento y Búsqueda

```sql
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_reference ON products(reference_code);
CREATE INDEX idx_inventory_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_product_size ON inventory_items(product_id, size_col);
CREATE INDEX idx_inventory_stock_min ON inventory_items(current_stock, stock_minimo);
CREATE INDEX idx_movements_date ON inventory_movements(movement_date DESC);
CREATE INDEX idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_orders_status ON purchase_orders(status);
CREATE INDEX idx_alerts_status_severity ON stock_alerts(status, severity);
```

---

## 🔒 4. Políticas de Seguridad (Row Level Security - RLS)

Todas las tablas cuentan con RLS habilitado. La función segura `public.current_user_role()` consulta el rol del usuario conectado en la tabla `profiles`:

1. **`profiles`:**
   - Lectura: Cualquier usuario autenticado puede ver los perfiles para identificar responsables.
   - Modificación: Solo el `admin` puede modificar roles; los usuarios solo pueden actualizar su propio teléfono o avatar.
2. **`products` e `inventory_items`:**
   - Lectura: Acceso de lectura para **todos** los roles autenticados (necesario para ventas, bodega y compras).
   - Escritura: Restringida a `admin`, `jefe_bodega` y `auxiliar_logistico` mediante triggers transaccionales.
3. **`purchase_orders` y `purchase_order_items`:**
   - Lectura: `admin`, `jefe_compra`, `jefe_bodega`.
   - Inserción / Edición: `admin` y `jefe_compra`.
4. **`receptions` y `reception_items`:**
   - Lectura: `admin`, `jefe_bodega`, `auxiliar_logistico`, `jefe_compra`.
   - Inserción: `auxiliar_logistico`, `jefe_bodega`, `admin`.
5. **`inventory_movements` (Kardex):**
   - Lectura: `admin`, `jefe_bodega`, `jefe_compra`, `coordinador_despacho`.
   - Inserción: Procedimientos controlados de bodega y despacho. Inmutable: **PROHIBIDO el `UPDATE` o `DELETE` para preservar la trazabilidad fiscal.**
6. **`stock_alerts`:**
   - Lectura: `admin`, `jefe_compra`, `jefe_bodega`.
   - Actualización de estado: `jefe_compra` y `admin`.

---

## 🗄️ 5. Supabase Storage

- **Bucket `product-images`:** Público para lectura, restringido para escritura a roles administrativos.
- **Bucket `reception-evidence`:** Privado, destinado a fotos de guías de transporte o calzado averiado en muelle; accesible para bodega, compras y administración.

