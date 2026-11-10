-- ==============================================================================
-- SISTEMA DE GESTIÓN DE INVENTARIO Y CADENA DE DISTRIBUCIÓN (ADIDAS)
-- MIGRACIÓN 0003: Almacenamiento (Supabase Storage) y Políticas de Acceso
-- ==============================================================================

-- 1. Creación de Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'product-images',
        'product-images',
        true,
        5242880, -- 5 MB máximo
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'reception-evidence',
        'reception-evidence',
        false,
        10485760, -- 10 MB máximo
        ARRAY['image/jpeg', 'image/png', 'application/pdf']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Políticas de Acceso para 'product-images' (Público para lectura)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Staff can upload product images" ON storage.objects;
CREATE POLICY "Staff can upload product images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'product-images'
        AND public.current_user_role() IN ('admin', 'jefe_bodega', 'jefe_compra')
    );

-- 3. Políticas de Acceso para 'reception-evidence' (Privado)
DROP POLICY IF EXISTS "Logistics can view reception evidence" ON storage.objects;
CREATE POLICY "Logistics can view reception evidence"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'reception-evidence'
        AND public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico', 'jefe_compra')
    );

DROP POLICY IF EXISTS "Logistics can upload reception evidence" ON storage.objects;
CREATE POLICY "Logistics can upload reception evidence"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'reception-evidence'
        AND public.current_user_role() IN ('admin', 'jefe_bodega', 'auxiliar_logistico')
    );

