-- ==============================================================================
-- SISTEMA DE GESTIÓN DE INVENTARIO Y CADENA DE DISTRIBUCIÓN (ADIDAS)
-- MIGRACIÓN 0001: Esquema Base, Tipos, Tablas, Restricciones e Índices
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Creación de Tipos ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'jefe_compra',
            'jefe_bodega',
            'auxiliar_logistico',
            'coordinador_despacho',
            'sector_ventas'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
        CREATE TYPE product_category AS ENUM (
            'Originales',
            'Corredor',
            'Futbol',
            'Training',
            'Basketball',
            'Outdoor'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'borrador',
            'pendiente_aprobacion',
            'aprobada',
            'enviada',
            'recibida_parcial',
            'recibida_total',
            'cancelada'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
        CREATE TYPE movement_type AS ENUM (
            'ENTRADA',
            'SALIDA',
            'AJUSTE_POSITIVO',
            'AJUSTE_NEGATIVO',
            'DESPACHO'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
        CREATE TYPE alert_severity AS ENUM (
            'BAJA',
            'MEDIA',
            'ALTA',
            'CRITICA'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
        CREATE TYPE alert_status AS ENUM (
            'PENDIENTE',
            'EN_GESTION',
            'RESUELTA'
        );
    END IF;
END$$;

-- 3. Función auxiliar para actualización de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Tabla: profiles (extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'sector_ventas',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at para profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Tabla: suppliers (Proveedores de Calzado)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nit TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Bogotá',
    country TEXT NOT NULL DEFAULT 'Colombia',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Tabla: products (Catálogo de Calzado Deportivo Matriz)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code TEXT NOT NULL UNIQUE, -- ej: B75806
    name TEXT NOT NULL,                  -- ej: Samba OG Shoes
    category product_category NOT NULL,
    gender TEXT NOT NULL DEFAULT 'Unisex', -- Unisex, Hombre, Mujer, Kids
    colorway TEXT NOT NULL,              -- ej: Cloud White / Core Black / Clear Granite
    base_cost NUMERIC(12,2) NOT NULL CHECK (base_cost >= 0),
    retail_price NUMERIC(12,2) NOT NULL CHECK (retail_price >= base_cost),
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Tabla: inventory_items (Stock por SKU y Talla COL/US)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL UNIQUE,
    size_us TEXT NOT NULL,
    size_col TEXT NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    stock_maximo INTEGER NOT NULL DEFAULT 50 CHECK (stock_maximo >= stock_minimo),
    warehouse_location TEXT NOT NULL DEFAULT 'BOD-CENTRAL-A01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_size UNIQUE (product_id, size_col)
);

DROP TRIGGER IF EXISTS trg_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Tabla: purchase_orders (Órdenes de Compra)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE, -- ej: PO-2026-0001
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'borrador',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'COP',
    estimated_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER trg_purchase_orders_updated_at
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Tabla: purchase_order_items (Detalle de la Orden por Producto y Talla)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    size_col TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Tabla: receptions (Verificación y Recepción en Muelle)
CREATE TABLE IF NOT EXISTS public.receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_number TEXT NOT NULL UNIQUE, -- ej: REC-2026-0001
    order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    received_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    carrier_name TEXT,
    waybill_number TEXT, -- Guía de transporte
    has_discrepancies BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    reception_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Tabla: reception_items (Verificación por Ítem)
CREATE TABLE IF NOT EXISTS public.reception_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID NOT NULL REFERENCES public.receptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    size_col TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INTEGER NOT NULL CHECK (quantity_received >= 0),
    quantity_damaged INTEGER NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0),
    discrepancy_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Tabla: inventory_movements (Kardex Inmutable)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    movement_type movement_type NOT NULL,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    product_reference TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    size_col TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    user_name TEXT NOT NULL,
    support_document TEXT, -- ej: PO-2026-001, REC-2026-001, DESP-882
    notes TEXT
);

-- 13. Tabla: stock_alerts (Alertas Automáticas de Escasez - RN-01)
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL,
    stock_minimo INTEGER NOT NULL,
    deficit INTEGER NOT NULL,
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 14. Índices para Optimización de Consultas Frecuentes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_reference ON public.products(reference_code);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_product_size ON public.inventory_items(product_id, size_col);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_min ON public.inventory_items(current_stock, stock_minimo);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.inventory_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON public.stock_alerts(status, severity);

-- 15. Trigger de Alerta Automática por Escasez (RN-01)
CREATE OR REPLACE FUNCTION trg_check_stock_alert_func()
RETURNS TRIGGER AS $$
DECLARE
    v_deficit INTEGER;
    v_severity alert_severity;
BEGIN
    IF NEW.current_stock <= NEW.stock_minimo THEN
        v_deficit := NEW.stock_minimo - NEW.current_stock;
        
        IF NEW.current_stock = 0 THEN
            v_severity := 'CRITICA';
        ELSIF NEW.current_stock <= (NEW.stock_minimo / 2) THEN
            v_severity := 'ALTA';
        ELSE
            v_severity := 'MEDIA';
        END IF;

        -- Insertar o actualizar alerta pendiente
        INSERT INTO public.stock_alerts (
            inventory_item_id,
            current_stock,
            stock_minimo,
            deficit,
            severity,
            status,
            created_at
        ) VALUES (
            NEW.id,
            NEW.current_stock,
            NEW.stock_minimo,
            v_deficit,
            v_severity,
            'PENDIENTE',
            NOW()
        );
    ELSE
        -- Si el stock se regularizó por encima del mínimo, marcar alertas activas como RESUELTAS
        UPDATE public.stock_alerts
        SET status = 'RESUELTA',
            resolved_at = NOW()
        WHERE inventory_item_id = NEW.id
          AND status = 'PENDIENTE';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_stock_alert ON public.inventory_items;
CREATE TRIGGER trg_check_stock_alert
    AFTER INSERT OR UPDATE OF current_stock, stock_minimo ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION trg_check_stock_alert_func();

