# Sistema de Gestión de Inventario y Cadena de Distribución (Adidas)

Aplicación Web Transaccional empresarial de alto rendimiento diseñada para digitalizar, controlar y automatizar la trazabilidad completa del calzado: desde el pedido inicial a proveedores internacionales y locales, hasta la recepción en centros de distribución, control de stock por SKU/talla, despacho y consulta de disponibilidad comercial en tiempo real.

---

## 📌 Tabla de Contenidos

1. [Características Principales](#características-principales)
2. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
3. [Perfiles y Roles de Usuario](#perfiles-y-roles-de-usuario)
4. [Requisitos Previos](#requisitos-previos)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Variables de Entorno](#variables-de-entorno)
7. [Configuración de Base de Datos en Supabase](#configuración-de-base-de-datos-en-supabase)
8. [Comandos del Proyecto](#comandos-del-proyecto)
9. [Estructura del Proyecto](#estructura-del-proyecto)
10. [Resolución de Problemas (Troubleshooting)](#resolución-de-problemas-troubleshooting)

---

## ⚡ Características Principales

- **Control de Acceso Basado en Roles (RBAC):** Interfaces dedicadas y adaptativas para Administrador, Jefe de Compra, Jefe de Bodega, Auxiliares Logísticos, Coordinador de Despacho y Sector de Ventas.
- **Alertas Automáticas de Escasez:** Algoritmo de detección de punto de reorden por SKU, talla y categoría con notificaciones prioritarias para el Jefe de Compras.
- **Ciclo Completo de Órdenes de Compra (PO):** Registro detallado, aprobación jerárquica, envío a proveedor y control de costos en pesos colombianos (COP).
- **Módulo de Recepción y Verificación:** Conciliación ciega y controlada de mercancía física entrante vs. órdenes de compra, control de discrepancias y altas de stock automatizadas.
- **Trazabilidad y Kardex Obligatorio:** Registro estricto de cada movimiento con fecha, usuario responsable, tipo (Entrada, Salida, Ajuste, Devolución), clasificación del calzado (Originales, Corredor, Futbol, Training, etc.) y número de lote/guía.
- **Terminal de Consulta Comercial (Ventas):** Búsqueda instantánea de disponibilidad por modelo, silueta, talla y bodega sin acceso a funciones operativas de almacén.
- **Diseño Corporativo Adidas:** Estética minimalista monocromática de alto contraste (negro `#000000`, blanco `#FFFFFF`, grises técnicos `#111111`, `#F5F5F5` y acento de advertencia de stock), responsiva y ergonómica para terminales móviles y estaciones de escritorio.

---

## 🛠️ Arquitectura y Tecnologías

- **Frontend:** React 18+ (Single Page Application con JavaScript ES Modules sin TypeScript).
- **Enrutamiento:** React Router DOM v6 con guardias de ruta y redirección condicional por rol.
- **Herramienta de Construcción:** Vite 5+.
- **Estilos:** Tailwind CSS con componentes UI modulares inspirados en el diseño deportivo y corporativo de Adidas.
- **Iconografía:** Lucide React.
- **Backend as a Service (BaaS):** Supabase (PostgreSQL 15+, Row Level Security, Supabase Auth y Supabase Storage).
- **Persistencia y Tolerancia a Fallos:** Capa de servicios `src/services/` con conexión nativa a Supabase y modo híbrido resiliente para demostraciones operativas continuas.

---

## 👥 Perfiles y Roles de Usuario

| Rol | Código del Sistema | Responsabilidades Principales |
|---|---|---|
| **Administrador** | `admin` | Control total del sistema, auditoría global, configuración de parámetros y gestión de usuarios. |
| **Jefe de Compra** | `jefe_compra` | Gestión de proveedores, emisión y aprobación de órdenes de compra, monitoreo de alertas de escasez. |
| **Jefe de Bodega** | `jefe_bodega` | Supervisión de inventario físico, asignación de ubicaciones, control de discrepancias y autorización de ajustes. |
| **Auxiliar Logístico** | `auxiliar_logistico` | Conteo físico de mercancía en muelle, escaneo de remisiones, verificación de averías y acomodo en estanterías. |
| **Coordinador de Despacho** | `coordinador_despacho` | Programación de salidas, verificación de listas de empaque y confirmación de entregas a tiendas o clientes. |
| **Sector de Ventas** | `sector_ventas` | Consulta de disponibilidad en tiempo real por SKU/talla, catálogo de referencias y reserva informativa. |

---

## 📋 Requisitos Previos

- **Node.js:** Versión 18.0.0 o superior (recomendado Node.js 20 LTS).
- **Gestor de Paquetes:** `npm` (v9+) o `pnpm`.
- **Cuenta de Supabase:** Proyecto creado en [supabase.com](https://supabase.com) (gratuito o de pago).

---

## 🚀 Instalación y Configuración

1. **Clonar o situarse en el repositorio:**
   ```bash
   cd c:\Users\r578\Documents\programacion\compuestudio\diseño_de_app_y_software\Inventario
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el archivo de variables de entorno:**
   Copie el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Completar las variables en `.env`:**
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

## 🔐 Variables de Entorno

| Variable | Descripción | Obligatorio |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del endpoint de tu proyecto Supabase. | Sí (para persistencia en nube) |
| `VITE_SUPABASE_ANON_KEY` | Llave pública `anon` de Supabase (nunca uses la `service_role`). | Sí (para persistencia en nube) |

> ⚠️ **Seguridad:** Nunca agregues `service_role` o contraseñas en variables con prefijo `VITE_`, ya que se exponen públicamente en el bundle cliente del navegador.

---

## 🗄️ Configuración de Base de Datos en Supabase

El proyecto incluye migraciones SQL completas, ordenadas y listas para su ejecución en la consola de Supabase:

1. Ingresa al panel de administración de tu proyecto en Supabase.
2. Ve a la sección **SQL Editor**.
3. Ejecuta los siguientes scripts en orden secuencial estricto:
   - `supabase/migrations/0001_schema.sql`: Creación de tipos ENUM, tablas base (`profiles`, `products`, `inventory_items`, `purchase_orders`, `receptions`, `inventory_movements`, `alerts`), índices y triggers de auditoría.
   - `supabase/migrations/0002_security.sql`: Activación de Row Level Security (RLS) en todas las tablas y políticas granulares por rol.
   - `supabase/migrations/0003_storage.sql`: Creación de buckets (`product-images`, `reception-evidence`) y políticas de almacenamiento.
   - `supabase/migrations/0004_seed.sql`: Carga de catálogo real de calzado Adidas (Samba, Gazelle, Ultraboost, Predator, Forum), proveedores y stock inicial de demostración.
4. Consulta `supabase/README_SQL.md` para más detalles y pruebas de validación de integridad.

---

## 💻 Comandos del Proyecto

```bash
# Iniciar servidor local de desarrollo (HMR activo)
npm run dev

# Compilar proyecto optimizado para producción
npm run build

# Previsualizar build de producción localmente
npm run preview

# Ejecutar validaciones de código (linter)
npm run lint
```

---

## 📂 Estructura del Proyecto

```
Inventario/
├── README.md               # Documento maestro del proyecto
├── AGENTS.md               # Directrices operativas para asistentes de IA
├── DESIGN.md               # Especificaciones del Design System Adidas
├── REQUISITOS.md           # Requerimientos, reglas de negocio y criterios de aceptación
├── DATABASE.md             # Modelo relacional, diccionario de datos y RLS
├── TAREAS.md               # Plan de trabajo, checklist y estados de ejecución
├── index.html              # Entrypoint HTML5 con fuentes corporativas
├── package.json            # Dependencias y scripts de ejecución
├── vite.config.js          # Configuración de compilación Vite
├── tailwind.config.js      # Configuración de tokens de diseño Adidas
├── postcss.config.js       # Pipeline PostCSS
├── .env.example            # Plantilla de variables de entorno seguras
├── .gitignore              # Exclusiones de Git (node_modules, .env, dist)
├── supabase/
│   ├── README_SQL.md       # Guía de despliegue SQL y validación
│   └── migrations/
│       ├── 0001_schema.sql    # Tablas, relaciones, índices y triggers
│       ├── 0002_security.sql  # Row Level Security y políticas por rol
│       ├── 0003_storage.sql   # Buckets de evidencia e imágenes
│       └── 0004_seed.sql      # Catálogo de calzado e inventario semilla
└── src/
    ├── main.jsx            # Entrada de la aplicación React
    ├── App.jsx             # Router principal y proveedores de contexto
    ├── index.css           # Estilos globales y utilidades personalizadas
    ├── components/         # Componentes UI reutilizables (Botones, Modales, Tablas, Badges)
    │   ├── common/         # Componentes comunes (Sidebar, Header, EmptyState, Loading, StatCard)
    │   └── ui/             # Elementos de formulario accesibles y alertas
    ├── context/            # Contextos de React (AuthContext, AlertContext)
    ├── hooks/              # Hooks personalizados (useAuth, useInventory, useOrders)
    ├── layouts/            # Layout principal adaptable con menú según rol
    ├── lib/                # Configuración de Supabase (`supabase.js`) y utilitarios
    ├── pages/              # Vistas completas por módulo del sistema
    │   ├── auth/           # Login y selección interactiva de rol
    │   ├── dashboard/      # Panel de control con métricas personalizadas
    │   ├── inventory/      # Gestión y clasificación de inventario (Kardex)
    │   ├── orders/         # Registro, aprobación y seguimiento de órdenes
    │   ├── reception/      # Verificación de mercancía entrante en muelle
    │   ├── alerts/         # Panel de escasez y puntos de reorden
    │   └── sales/          # Terminal de consulta comercial para ventas
    ├── services/           # Lógica de acceso a datos e integración con Supabase
    └── utils/              # Formateadores de moneda (COP), fechas y generadores de SKU
```

---

## 🔧 Resolución de Problemas (Troubleshooting)

### 1. "Failed to fetch" o error de conexión con Supabase
- Verifica que el archivo `.env` contenga valores válidos para `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Si estás trabajando en modo offline o sin conexión configurada, el sistema utilizará de manera transparente el almacenamiento local emulado para permitir la prueba total de las interfaces.

### 2. Error de políticas RLS: "new row violates row-level security policy"
- Confirma que ejecutaste `0002_security.sql` en tu proyecto de Supabase.
- Recuerda que la creación o modificación de órdenes de compra está reservada para los roles `admin` y `jefe_compra`. Verifica el rol de tu usuario en la tabla `profiles`.

### 3. Visualización en dispositivos móviles
- La interfaz implementa un drawer colapsable para pantallas con ancho menor a 1024px. Pulsa el botón de hamburguesa en la barra superior para abrir el menú adaptado a tu rol.

---
**Proyecto desarrollado para la gestión logística de calzado Adidas en Colombia.**

