# Guía de Ejecución y Verificación de Migraciones SQL en Supabase

Este documento describe el orden estricto, los métodos de ejecución y las consultas de validación para las migraciones de base de datos del **Sistema de Gestión de Inventario y Cadena de Distribución (Adidas)**.

---

## 🚀 1. Orden de Ejecución en Supabase SQL Editor

Ingresa a tu consola en [supabase.com](https://supabase.com), selecciona tu proyecto y abre el **SQL Editor** en la barra lateral izquierda. Ejecuta los archivos de la carpeta `supabase/migrations/` en el siguiente orden:

| Orden | Archivo de Migración | Propósito |
|---|---|---|
| **1°** | `0001_schema.sql` | Tipos ENUM, extensiones, creación de 10 tablas, claves foráneas, índices de rendimiento y trigger de alertas automáticas (RN-01). |
| **2°** | `0002_security.sql` | Activación de Row Level Security (RLS) en todas las tablas y políticas granulares para los 6 roles. |
| **3°** | `0003_storage.sql` | Configuración de buckets de almacenamiento (`product-images`, `reception-evidence`) y políticas de subida/lectura. |
| **4°** | `0004_seed.sql` | Catálogo icónico de calzado Adidas (Samba, Gazelle, Ultraboost, etc.), proveedores en Colombia e inventario inicial por tallas. |

---

## 🔍 2. Consultas de Verificación de Integridad

Una vez ejecutados los scripts, copia y corre estas consultas en el SQL Editor para confirmar que todo está operativo:

### 2.1 Verificar que las 10 tablas existen y tienen RLS activo
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_activo
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
*Resultado esperado:* 10 filas con `rls_activo = true`.

### 2.2 Verificar que el trigger de alertas por escasez (RN-01) se ejecutó con el Seed
```sql
SELECT 
    p.name AS modelo,
    i.sku,
    i.size_col AS talla,
    a.current_stock AS stock_actual,
    a.stock_minimo,
    a.deficit,
    a.severity,
    a.status
FROM public.stock_alerts a
JOIN public.inventory_items i ON a.inventory_item_id = i.id
JOIN public.products p ON i.product_id = p.id
WHERE a.status = 'PENDIENTE'
ORDER BY a.severity DESC;
```
*Resultado esperado:* Visualización de las alertas automáticas para los SKUs configurados intencionalmente en punto crítico (ej. Samba Talla 40 y 41, Gazelle Talla 40, Ultraboost Talla 41).

### 2.3 Verificar políticas de seguridad RLS creadas
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

---

## 👤 3. Creación de Usuarios de Demostración con Supabase Auth

Para conectar usuarios reales desde Supabase Authentication:

1. Ve a **Authentication -> Users** en Supabase.
2. Pulsa en **Add User -> Create User**.
3. Ingresa correo y contraseña (ej: `compras@adidas.com`, `admin@adidas.com`, `ventas@adidas.com`).
4. Una vez creado el usuario, copia su `User UID` y asígnale su rol en la tabla `public.profiles` con la siguiente consulta:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES 
    ('<UID_DE_SUPABASE>', 'compras@adidas.com', 'Jefe de Compras Adidas', 'jefe_compra')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
```

> 💡 **Nota:** La aplicación frontend incluye además un simulador de sesión rápido en la pantalla de login para realizar pruebas inmediatas entre los 6 roles sin necesidad de registrar cuentas manuales.

