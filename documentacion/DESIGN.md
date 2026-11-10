# DESIGN.md — Sistema de Diseño e Identidad Visual (Adidas)

Este documento especifica el sistema de diseño visual, componentes, paleta de colores, tipografía, espaciados y pautas de accesibilidad para el **Sistema de Gestión de Inventario y Cadena de Distribución (Adidas)**.

---

## 🖤 Identidad Visual y Filosofía de Diseño

El sistema está inspirado en la estética corporativa de alto rendimiento de **Adidas**: minimalista, monocromática, de alto contraste visual, con tipografía geométrica contundente y acentos de color estratégicos utilizados únicamente para indicar estados del inventario y la cadena de suministro.

### Principios Fundamentales:
1. **Contraste y Legibilidad:** Fondos oscuros profundos y claros limpios que garantizan visibilidad en ambientes industriales (bodegas con iluminación variable) y oficinas comerciales.
2. **Densidad de Información Funcional:** Interfaces con jerarquía visual clara que permiten a los auxiliares y jefes procesar lotes y SKUs con rapidez sin fatiga cognitiva.
3. **Ergonomía Táctil y de Escritorio:** Botones y selectores con áreas táctiles mínimas de 44x44px para dispositivos móviles y lectores de código de barras en muelle de recepción.

---

## 🎨 Paleta de Colores

### Colores de Marca y Estructura
| Nombre del Token | Valor Hexadecimal | Uso en la Aplicación |
|---|---|---|
| `brand-black` | `#000000` | Barra lateral principal, encabezados principales, botones primarios. |
| `brand-dark` | `#111111` | Fondo de tarjetas oscuras, modales en modo de alto contraste. |
| `brand-gray-dark` | `#1F2937` | Bordes activos, textos secundarios en fondos oscuros. |
| `brand-gray-medium`| `#6B7280` | Etiquetas secundarias, textos de ayuda, íconos inactivos. |
| `brand-gray-light` | `#E5E7EB` | Divisores, bordes de tablas y contenedores. |
| `brand-surface` | `#F9FAFB` | Fondo general de la aplicación, paneles de contenido. |
| `brand-white` | `#FFFFFF` | Superficies de tarjetas, campos de formulario, fondos de modales. |

### Colores de Estado Semántico y Logístico
| Estado | Token | Color Hex | Significado Logístico |
|---|---|---|---|
| **Stock Óptimo / Aprobado** | `status-success` | `#10B981` (Verde esmeralda) | Stock por encima del umbral; orden aprobada o mercancía recibida sin novedad. |
| **Stock Bajo / Alerta** | `status-warning` | `#F59E0B` (Ámbar intenso) | Stock en punto de reorden; notificación automática al Jefe de Compras. |
| **Stock Crítico / Rechazado**| `status-danger` | `#EF4444` (Rojo deportivo) | Stock en cero o por debajo del mínimo crítico; orden rechazada o avería en muelle. |
| **En Tránsito / Pendiente** | `status-info` | `#2563EB` (Azul técnico) | Mercancía en camino desde proveedor; orden de compra pendiente de aprobación. |
| **Neutral / Borrador** | `status-neutral` | `#6B7280` (Gris frío) | Registro preliminar sin enviar a validación. |

---

## 🔤 Tipografía

La tipografía sigue la tradición tipográfica alemana y deportiva de líneas limpias sans-serif:

- **Familia Primaria:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
- **Pesos Utilizados:**
  - `400` (Regular): Textos de cuerpo, descripciones, tablas.
  - `500` (Medium): Botones secundarios, nombres de columnas, metadatos.
  - `600` (SemiBold): Encabezados de tarjetas, valores de métricas (KPIs), badges de estado.
  - `700` (Bold): Títulos de módulos, cifras destacadas de inventario, llamadas a la acción primarias.
  - `800` / `900` (Black/ExtraBold): Logotipo y acentos estilizados corporativos.

### Escala de Tamaños
- **Display / Hero:** `28px - 32px` (Títulos de vista y KPIs principales)
- **H1:** `24px` (Encabezados de sección)
- **H2:** `18px - 20px` (Títulos de tarjetas y modales)
- **H3 / Subtítulos:** `16px` (Grupos de campos de formulario)
- **Body:** `14px` (Texto general y celdas de tablas)
- **Caption / Metadata:** `12px` (SKUs, tallas, fechas, badges)
- **Micro:** `10px - 11px` (Etiquetas de estado en gráficos)

---

## 📐 Espaciado y Cuadrícula (Grid)

Basado en un sistema modular de 4px / 8px:
- `p-2` / `m-2`: 8px (Espaciado interno en badges y celdas compactas)
- `p-4` / `m-4`: 16px (Padding estándar de tarjetas en móvil y controles de formulario)
- `p-6` / `m-6`: 24px (Padding de tarjetas de escritorio y contenedores principales)
- `gap-4`: 16px (Separación en cuadrículas de productos y métricas)
- `gap-6`: 24px (Separación entre bloques estructurales)

---

## 🧩 Componentes y Variantes

### 1. Botones (`Button`)
- **Primario (`solid-black`):** Fondo negro `#000000`, texto blanco `#FFFFFF`, hover `#222222`. Utilizado para acciones principales (Crear Orden, Confirmar Recepción, Registrar Movimiento).
- **Secundario (`outline`):** Borde gris `#D1D5DB`, fondo transparente o blanco, hover `#F3F4F6`. Para filtros, cancelar o exportar.
- **Peligro (`danger`):** Fondo rojo `#EF4444`, texto blanco. Para rechazar órdenes o anular registros erróneos.
- **Acción Rápida (`ghost`):** Sin borde, para opciones secundarias en tablas (ver detalle, editar).

### 2. Badges de Estado (`StatusBadge`)
- Estilo píldora (`rounded-full`) con punto luminoso y tipografía `text-xs font-semibold`:
  - `Stock Óptimo`: Verde con fondo esmeralda suave (`bg-emerald-50 text-emerald-700 border-emerald-200`).
  - `Stock Bajo`: Ámbar con fondo cálido (`bg-amber-50 text-amber-700 border-amber-200`).
  - `Stock Crítico`: Rojo con fondo suave (`bg-red-50 text-red-700 border-red-200`).
  - `Pendiente / En Tránsito`: Azul con fondo claro (`bg-blue-50 text-blue-700 border-blue-200`).

### 3. Tarjetas de Indicadores (KPI Cards)
- Borde sutil, fondo blanco, esquina redondeada (`rounded-xl`), sombra ligera (`shadow-sm`), ícono en contenedor oscuro de contraste y valor numérico en tipografía destacada (`text-2xl font-bold`).

### 4. Tablas de Datos
- Encabezado con fondo gris ultra claro (`bg-gray-50`), texto en mayúsculas pequeñas (`text-xs font-medium text-gray-500 uppercase tracking-wider`).
- Filas alternas con efecto hover interactivo (`hover:bg-gray-50/80 transition-colors`).
- Celdas con padding vertical ergonómico para facilitar la lectura.

---

## ♿ Accesibilidad (a11y)

- Contraste de color superior a 4.5:1 en todos los textos sobre fondos claros y oscuros (cumplimiento WCAG AA).
- Indicadores visuales que no dependen exclusivamente del color (los badges incluyen texto descriptivo e iconos identificadores).
- Elementos interactivos con anillo de enfoque visible (`focus:ring-2 focus:ring-black focus:outline-none`).
- Formularios con etiquetas explícitas asociadas a sus respectivos `id` y mensajes de error legibles.

---

## 📱 Pautas Responsive y Dispositivos Soportados

- **Escritorio (> 1024px):** Barra lateral fija a la izquierda (Sidebar) con acceso a módulos según rol, visualización de tablas completas con todas sus columnas de auditoría.
- **Tablets (768px - 1023px):** Barra lateral colapsable mediante menú tipo hamburguesa, tablas con scroll horizontal optimizado.
- **Móviles (< 768px):** Menú deslizante (Drawer), tarjetas colapsables para conteo rápido en bodega y verificación de bultos con botones grandes.

---

## 🖥️ Lista de Pantallas del Sistema

1. **Pantalla de Acceso (Login):**
   - Autenticación segura.
   - Selector rápido interactivo de roles para pruebas de demostración sin fricción.
2. **Dashboard Operativo por Rol:**
   - Métricas clave adaptadas según el rol del usuario conectado.
   - Accesos directos y alertas activas.
3. **Módulo de Alertas Automáticas:**
   - Lista priorizada de productos en escasez con cálculo del déficit vs. punto de reorden.
   - Botón directo para "Generar Orden de Compra Inmediata".
4. **Módulo de Órdenes de Compra (PO):**
   - Listado de órdenes (Borrador, Pendiente, Aprobada, Enviada, Recibida).
   - Modal de creación con selección de proveedor, líneas de productos y tallas.
   - Flujo de aprobación para Jefe de Compras / Administrador.
5. **Módulo de Recepción y Verificación:**
   - Visualización de órdenes de compra pendientes de ingreso.
   - Formulario de verificación en muelle: cantidades recibidas vs. ordenadas, reporte de novedades y confirmación de ingreso al stock.
6. **Módulo de Gestión y Clasificación de Inventario (Kardex):**
   - Catálogo de productos con SKU, modelo, categoría (Originales, Corredor, Futbol, etc.), talla (US/COL) y existencias.
   - Registro obligatorio de movimientos (Entrada / Salida / Ajuste) con fecha, tipo y clasificación.
7. **Terminal de Consultas y Reportes (Sector de Ventas):**
   - Buscador rápido por modelo y talla para atención en tienda.
   - Filtros por categoría y disponibilidad inmediata en bodega.

