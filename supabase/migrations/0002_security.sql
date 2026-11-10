-- ==============================================================================
-- SISTEMA DE GESTIÓN DE INVENTARIO Y CADENA DE DISTRIBUCIÓN (ADIDAS)
-- MIGRACIÓN 0002: Seguridad, Row Level Security (RLS) y Políticas por Rol
-- ==============================================================================

-- 1. Habilitación obligatoria de RLS en todas las tablas públicas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- 2. Función auxiliar segura para obtener el rol del usuario actual
-- Marcada como SECURITY DEFINER con search_path fijo para evitar privilege escalation
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 3. POLÍTICAS PARA: profiles
-- ==============================================================================
-- Lectura: Cualquier usuario autenticado puede ver los perfiles para trazabilidad
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Inserción: Solo el usuario para su propio registro inicial o el administrador
CREATE POLICY "profiles_insert_self_or_admin"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.uid() = id AND role = 'sector_ventas')
        OR public.current_user_role() = 'admin'
    );

-- Actualización: Cada usuario puede actualizar sus datos de contacto, pero NO cambiar su rol
CREATE POLICY "profiles_update_self_or_admin"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id OR public.current_user_role() = 'admin'
    )
    WITH CHECK (
        -- Si no es admin, el rol propuesto debe coincidir con el rol previo
        public.current_user_role() = 'admin'
        OR (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
    );

-- Eliminación: Solo administradores
CREATE POLICY "profiles_delete_admin"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.current_user_role() = 'admin');

-- ==============================================================================
-- 4. POLÍTICAS PARA: suppliers (Proveedores)
-- ==============================================================================
-- Lectura: Admin, Jefe de Compra, Jefe de Bodega y Coordinador de Despacho
CREATE POLICY "suppliers_select_staff"
    ON public.suppliers FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra', 'jefe_bodega', 'coordinador_despacho')
    );

-- Inserción y Modificación: Solo Admin y Jefe de Compra
CREATE POLICY "suppliers_modify_purchasing_admin"
    ON public.suppliers FOR ALL
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra')
    )
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_compra')
    );

-- ==============================================================================
-- 5. POLÍTICAS PARA: products (Catálogo de Calzado)
-- ==============================================================================
-- Lectura: Todos los roles autenticados (incluyendo Sector de Ventas para consultar catálogo)
CREATE POLICY "products_select_all_roles"
    ON public.products FOR SELECT
    TO authenticated
    USING (is_active = true OR public.current_user_role() IN ('admin', 'jefe_compra', 'jefe_bodega'));

-- Mutaciones: Solo Administrador y Jefe de Bodega / Compra autorizados
CREATE POLICY "products_insert_admin"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_role() IN ('admin', 'jefe_bodega', 'jefe_compra'));

CREATE POLICY "products_update_admin"
    ON public.products FOR UPDATE
    TO authenticated
    USING (public.current_user_role() IN ('admin', 'jefe_bodega', 'jefe_compra'))
    WITH CHECK (public.current_user_role() IN ('admin', 'jefe_bodega', 'jefe_compra'));

-- ==============================================================================
-- 6. POLÍTICAS PARA: inventory_items (Stock por Talla y SKU)
-- ==============================================================================
-- Lectura: Todos los roles autenticados (Sector de Ventas consulta disponibilidad)
CREATE POLICY "inventory_select_all_roles"
    ON public.inventory_items FOR SELECT
    TO authenticated
    USING (true);

-- Actualización y Creación: Admin, Jefe de Bodega y Auxiliar Logístico
CREATE POLICY "inventory_modify_warehouse_admin"
    ON public.inventory_items FOR ALL
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico')
    )
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico')
    );

-- ==============================================================================
-- 7. POLÍTICAS PARA: purchase_orders y purchase_order_items
-- ==============================================================================
-- Lectura: Admin, Jefe de Compra, Jefe de Bodega y Auxiliar Logístico (para verificar en muelle)
CREATE POLICY "po_select_authorized"
    ON public.purchase_orders FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra', 'jefe_bodega', 'auxiliar_logistico')
    );

CREATE POLICY "poi_select_authorized"
    ON public.purchase_order_items FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra', 'jefe_bodega', 'auxiliar_logistico')
    );

-- Inserción / Edición: Solo Admin y Jefe de Compra
CREATE POLICY "po_modify_purchasing_admin"
    ON public.purchase_orders FOR ALL
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra')
    )
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_compra')
    );

CREATE POLICY "poi_modify_purchasing_admin"
    ON public.purchase_order_items FOR ALL
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra')
    )
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_compra')
    );

-- ==============================================================================
-- 8. POLÍTICAS PARA: receptions y reception_items (Recepción en Muelle)
-- ==============================================================================
CREATE POLICY "receptions_select_authorized"
    ON public.receptions FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico', 'jefe_compra')
    );

CREATE POLICY "reception_items_select_authorized"
    ON public.reception_items FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico', 'jefe_compra')
    );

CREATE POLICY "receptions_insert_warehouse"
    ON public.receptions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico')
    );

CREATE POLICY "reception_items_insert_warehouse"
    ON public.reception_items FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico')
    );

-- ==============================================================================
-- 9. POLÍTICAS PARA: inventory_movements (Kardex Inmutable)
-- ==============================================================================
-- Lectura: Roles operativos y gerenciales (Sector Ventas NO accede al Kardex interno)
CREATE POLICY "movements_select_authorized"
    ON public.inventory_movements FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'jefe_compra', 'coordinador_despacho', 'auxiliar_logistico')
    );

-- Inserción: Operaciones de almacén y despacho autorizadas
CREATE POLICY "movements_insert_operations"
    ON public.inventory_movements FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico', 'coordinador_despacho')
    );

-- Inmutabilidad fiscal: PROHIBIDO UPDATE Y DELETE EN EL KARDEX
-- No se crean políticas FOR UPDATE o FOR DELETE, impidiendo cualquier alteración a posteriori

-- ==============================================================================
-- 10. POLÍTICAS PARA: stock_alerts (Alertas por Escasez - RN-01)
-- ==============================================================================
-- Lectura: Jefe de Compra (prioritario), Jefe de Bodega y Admin
CREATE POLICY "alerts_select_management"
    ON public.stock_alerts FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra', 'jefe_bodega')
    );

-- Actualización (cambio a EN_GESTION o RESUELTA): Jefe de Compra y Admin
CREATE POLICY "alerts_update_management"
    ON public.stock_alerts FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'jefe_compra')
    )
    WITH CHECK (
        public.current_user_role() IN ('admin', 'jefe_compra')
    );

