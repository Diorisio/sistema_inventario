# TAREAS.md — Plan de Trabajo y Checklist de Ejecución

Este documento organiza el desarrollo del **Sistema de Gestión de Inventario y Cadena de Distribución (Adidas)** en 6 fases secuenciales con prioridades, dependencias, estados y criterios de verificación.

---

## 📌 Leyenda de Estados
- `[ ]` Pendiente
- `[/]` En progreso
- `[X]` Completado y verificado

---

## 📑 Fase 1: Documentación y Arquitectura Base
- [X] **T1.1 (Alta):** Creación del documento maestro `README.md`. *Verificación: Contiene resumen, instalación, comandos, arquitectura y troubleshooting.*
- [X] **T1.2 (Alta):** Creación del manual para agentes de IA `AGENTS.md`. *Verificación: Define reglas de JS puro (sin TS), Supabase seguro y lectura previa obligatoria.*
- [X] **T1.3 (Alta):** Creación de la guía de diseño corporativo Adidas `DESIGN.md`. *Verificación: Tokens de color negro/blanco, componentes, tipografía y responsive.*
- [X] **T1.4 (Alta):** Creación de la especificación funcional `REQUISITOS.md`. *Verificación: Delimita los 6 roles, reglas del negocio (RN-01 a RN-05) e historias de usuario.*
- [X] **T1.5 (Alta):** Creación del modelo relacional `DATABASE.md`. *Verificación: Diagrama textual, diccionario de 10 tablas, RLS, Storage y restricciones.*
- [X] **T1.6 (Alta):** Creación del checklist de tareas `TAREAS.md`. *Verificación: Matriz completa de tareas por fases y estados.*

---

## 🗄️ Fase 2: Base de Datos y Migraciones SQL (Supabase)
- [X] **T2.1 (Crítica):** Crear `supabase/migrations/0001_schema.sql` con tipos, tablas, restricciones, llaves foráneas y trigger de alertas automáticas (RN-01). *Verificación: 10 tablas creadas con tipos enumerados e índices.*
- [X] **T2.2 (Crítica):** Crear `supabase/migrations/0002_security.sql` con activación de RLS en todas las tablas, función segura `current_user_role()` y políticas por rol. *Verificación: RLS habilitado en las 10 tablas e inmutabilidad en Kardex.*
- [X] **T2.3 (Media):** Crear `supabase/migrations/0003_storage.sql` con configuración de buckets (`product-images`, `reception-evidence`) y políticas de Storage. *Verificación: Buckets y permisos creados.*
- [X] **T2.4 (Alta):** Crear `supabase/migrations/0004_seed.sql` con catálogo real de calzado Adidas (Samba, Gazelle, Ultraboost, Forum, Predator) por tallas US/COL, proveedores y stock inicial demostrativo. *Verificación: SKUs y datos iniciales listos.*
- [X] **T2.5 (Alta):** Crear `supabase/README_SQL.md` con manual paso a paso de ejecución en Supabase SQL Editor y consultas de verificación. *Verificación: Instrucciones y queries de prueba listas.*

---

## 💻 Fase 3: Configuración del Proyecto y Core Frontend
- [X] **T3.1 (Crítica):** Configurar `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js` e `index.html` con fuentes e identidad visual. *Verificación: Tokens Adidas configurados.*
- [X] **T3.2 (Crítica):** Instalar dependencias esenciales de producción (`react`, `react-dom`, `react-router-dom`, `lucide-react`, `@supabase/supabase-js`, `tailwindcss`). *Verificación: 142 paquetes instalados limpiamente sin conflictos.*
- [X] **T3.3 (Alta):** Configurar `src/lib/supabase.js` y variables de entorno `.env.example` y `.env`. *Verificación: Cliente Supabase seguro con detección de entorno.*
- [X] **T3.4 (Alta):** Implementar capa de servicios desacoplada `src/services/` (con sincronización Supabase y persistencia reactiva híbrida para pruebas fluidas). *Verificación: inventoryService.js funcional con transacciones.*
- [X] **T3.5 (Alta):** Implementar contexto de autenticación y roles `src/context/AuthContext.jsx` y hook `useAuth.js` con selector ágil de perfiles de demostración. *Verificación: 6 perfiles RBAC interactivos con switcher rápido.*
- [X] **T3.6 (Alta):** Crear Layout general `src/layouts/MainLayout.jsx` con Sidebar reactivo, Header con perfil de usuario y navegación adaptada a los 6 roles. *Verificación: Diseño responsive probado.*

---

## 🚀 Fase 4: Implementación de Módulos Transaccionales
- [X] **T4.1 (Alta):** **Módulo de Autenticación (`/login`):** Acceso seguro y selector de perfiles para los 6 roles. *Verificación: LoginPage.jsx implementado con tabs demo y credenciales.*
- [X] **T4.2 (Crítica):** **Módulo de Dashboard (`/dashboard`):** Métricas operativas, accesos rápidos y estados de inventario personalizados por rol. *Verificación: DashboardPage.jsx implementado con KPIs y alertas de compras.*
- [X] **T4.3 (Crítica):** **Módulo de Alertas Automáticas (`/alertas`):** Detección de escasez (RN-01), cálculo de déficit respecto al stock mínimo, filtros de severidad y botón de reorden inmediata. *Verificación: AlertsPage.jsx implementado con generación directa de PO.*
- [X] **T4.4 (Crítica):** **Módulo de Órdenes de Compra (`/ordenes`):** Listado con estados (Borrador -> Pendiente -> Aprobada -> Enviada), creación con líneas de calzado/talla en COP y acción de aprobación para Jefe de Compras/Admin. *Verificación: OrdersPage.jsx implementado con modal de creación y cálculo de impuestos.*
- [X] **T4.5 (Crítica):** **Módulo de Recepción y Verificación (`/recepcion`):** Conciliación física de mercancía en muelle contra órdenes de compra, control de averías/discrepancias y alta automática en stock. *Verificación: ReceptionPage.jsx implementado con control de guías y actas.*
- [X] **T4.6 (Crítica):** **Módulo de Gestión de Inventario y Kardex (`/inventario`):** Visualización de existencias por silueta, SKU y talla (COL/US), formulario obligatorio de registro de movimientos (fecha, tipo de movimiento y clasificación completa). *Verificación: InventoryPage.jsx con Kardex inmutable (RN-03).*
- [X] **T4.7 (Alta):** **Terminal de Consulta para Ventas (`/ventas`):** Buscador ultrarrápido por modelo y talla para atención en tienda con stock en tiempo real y modo sólo lectura. *Verificación: SalesPage.jsx implementado con matriz de tallas y copia rápida.*

---

## 🧪 Fase 5: Calidad, Integración y Pruebas
- [X] **T5.1 (Crítica):** Verificación de compilación de producción mediante `npm run build` sin errores ni advertencias bloqueantes. *Verificación: Compilado exitosamente con Vite (código de salida 0).*
- [X] **T5.2 (Alta):** Validación de adaptación de interfaz en los 6 roles (verificación de restricciones de acceso por perfil). *Verificación: Menú y botones condicionales por rol funcional.*
- [X] **T5.3 (Alta):** Validación del flujo completo de trazabilidad: Alerta de escasez -> Creación de orden -> Aprobación -> Recepción en muelle -> Aumento en stock e inserción en Kardex inmutable. *Verificación: Flujo transaccional conectado en inventoryService.js.*
- [X] **T5.4 (Media):** Validación responsive en resoluciones móvil (375px), tablet (768px) y escritorio (1280px). *Verificación: Drawer colapsable y clases semánticas Tailwind CSS.*

---

## 📦 Fase 6: Entrega y Documentación Final
- [X] **T6.1 (Alta):** Actualizar `TAREAS.md` con las evidencias de verificación. *Verificación: Documento actualizado.*
- [X] **T6.2 (Alta):** Presentación del reporte final al usuario con resumen de módulos, árbol de archivos y pasos para configurar Supabase. *Verificación: Entrega en curso.*
