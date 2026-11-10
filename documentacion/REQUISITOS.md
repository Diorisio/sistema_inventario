# REQUISITOS.md — Especificación de Requisitos y Reglas de Negocio

**Sistema de Gestión de Inventario y Cadena de Distribución (Adidas)**  
*Aplicación Web Transaccional*  
**Región e Idioma:** Colombia / Español  
**Moneda Oficial:** Pesos Colombianos (COP - $)

---

## 🎯 1. Objetivos del Sistema

### 1.1 Objetivo General
Digitalizar y automatizar el ciclo de vida del inventario de calzado deportivo Adidas en centros de distribución y puntos logísticos en Colombia, garantizando la trazabilidad estricta desde la emisión de la orden de compra a proveedores hasta el almacenamiento por tallas y la entrega para despacho y consulta de ventas.

### 1.2 Objetivos Específicos
1. Eliminar la incertidumbre de stock mediante alertas automáticas de escasez orientadas a la toma de decisiones del Jefe de Compras.
2. Garantizar que cada entrada y salida física quede registrada con marca temporal inmutable, responsable, clasificación del calzado y tipo de movimiento (Kardex).
3. Reducir los errores en recepción comparando en tiempo real las cantidades despachadas por el proveedor frente a las verificadas en el muelle de carga.
4. Proveer al sector de ventas una herramienta de consulta ágil que informe la disponibilidad de tallas sin permitir modificaciones no autorizadas en el almacén.

---

## 👥 2. Perfiles, Roles y Matriz de Permisos (RBAC)

El sistema define seis roles con responsabilidades separadas para evitar conflictos de interés:

1. **Administrador (`admin`):** Acceso total a todos los módulos, gestión de usuarios, auditoría y configuración general.
2. **Jefe de Compra (`jefe_compra`):** Creación y aprobación de órdenes de compra, gestión de proveedores, recepción de alertas de escasez y seguimiento de órdenes enviadas.
3. **Jefe de Bodega (`jefe_bodega`):** Monitoreo global de inventario, aprobación de ajustes por merma o daño físico, supervisión de recepciones y despachos.
4. **Auxiliar Logístico (`auxiliar_logistico`):** Verificación física de mercancía entrante en muelle, conteo por tallas/cajas y registro de entradas y salidas operativas.
5. **Coordinador de Despacho (`coordinador_despacho`):** Generación y control de órdenes de salida para distribución a tiendas o clientes finales.
6. **Sector de Ventas (`sector_ventas`):** Consulta exclusiva de existencias por modelo, talla y clasificación, sin privilegios de edición sobre el inventario.

### Matriz de Permisos por Rol:

| Módulo / Acción | Admin | Jefe Compra | Jefe Bodega | Auxiliar Log. | Coord. Despacho | Sector Ventas |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Ver Dashboard con métricas globales** | ✅ | ✅ (compras) | ✅ (bodega) | ❌ | ❌ | ❌ |
| **Módulo de Alertas de Escasez** | ✅ | ✅ (prioritario) | ✅ | ❌ | ❌ | ❌ |
| **Crear / Editar Órdenes de Compra** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Aprobar / Enviar Órdenes a Proveedor** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Verificar Mercancía en Recepción** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Registrar Entrada / Salida en Kardex** | ✅ | ❌ | ✅ | ✅ | ✅ (salidas) | ❌ |
| **Aprobar Ajustes de Stock (daños/mermas)** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Consultar Disponibilidad de Catálogo** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (modo vista) |
| **Exportar Reportes Comerciales** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 📜 3. Reglas de Negocio Obligatorias

- **RN-01 (Alerta Automática de Escasez):** Siempre que la cantidad disponible de un SKU (combinación de producto + talla) sea igual o inferior a su `stock_minimo`, el sistema genera automáticamente un registro de alerta con nivel `ALTO` o `CRITICO` y lo destaca visualmente en la interfaz del **Jefe de Compras** para iniciar el reabastecimiento.
- **RN-02 (Separación e Interfaz Adaptativa):** La navegación y los controles mostrados se adaptan al rol del usuario autenticado sin conceder capacidades cruzadas que no correspondan a su cargo (ej. el personal de ventas jamás podrá alterar existencias ni el personal de compras podrá confirmar recepciones físicas en bodega).
- **RN-03 (Trazabilidad y Kardex Obligatorio):** Cualquier modificación en el inventario requiere la creación obligatoria e inmutable de un registro en `inventory_movements` con los siguientes campos:
  - Fecha y hora exacta (`timestamp with time zone`).
  - Tipo de movimiento (`ENTRADA`, `SALIDA`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `DESPACHO`).
  - Clasificación completa del producto (`categoria`, `linea`, `referencia`, `talla_us`, `talla_col`, `sku`).
  - Cantidad de pares afectados.
  - Usuario responsable (ID y nombre).
  - Justificación o documento de soporte (número de Orden de Compra o Guía de Despacho).
- **RN-04 (Control de Discrepancias en Recepción):** Al verificar una orden de compra, el sistema contrasta las cantidades recibidas físicamente contra las pactadas. Si existe una diferencia, se genera una novedad que queda registrada en el acta de recepción antes de alimentar el stock.
- **RN-05 (Precios y Moneda):** Todos los valores monetarios de compra y venta se manejan en Pesos Colombianos (COP) sin decimales y con formato visual local (ej: `$499.900`).

---

## 👤 4. Historias de Usuario

### Historia 1: Detección y Notificación de Escasez
- **Como:** Jefe de Compras
- **Quiero:** Recibir una alerta visual y un reporte claro cuando una silueta de calzado (ej. *Adidas Samba OG Blanco Talla 40*) caiga por debajo de su umbral de seguridad.
- **Para:** Generar oportunamente una orden de compra antes de que se agote en tiendas.
- **Criterio de Aceptación:** La alerta muestra el stock actual, el mínimo requerido, el déficit y un botón para crear la orden de compra precargada.

### Historia 2: Registro y Flujo de Órdenes de Compra
- **Como:** Jefe de Compras / Administrador
- **Quiero:** Registrar una orden de compra seleccionando el proveedor, las siluetas, las tallas y las cantidades en pares.
- **Para:** Mantener trazabilidad de los pedidos en curso y gestionar su aprobación y envío formal.
- **Criterio de Aceptación:** La orden se crea en estado `BORRADOR`, pasa a `PENDIENTE_APROBACION`, luego a `APROBADA` y finalmente a `ENVIADA`. Se calculan subtotales e impuestos en COP.

### Historia 3: Verificación de Mercancía en Muelle
- **Como:** Auxiliar Logístico
- **Quiero:** Abrir una orden de compra enviada e ingresar el conteo físico de cajas y pares por talla recibidos en bodega.
- **Para:** Confirmar que el proveedor entregó lo acordado y aumentar automáticamente el stock.
- **Criterio de Aceptación:** Al confirmar la recepción, el stock disponible se incrementa de forma transaccional y se crea el registro de movimiento tipo `ENTRADA` con la fecha y clasificación del calzado.

### Historia 4: Consulta de Disponibilidad para Ventas
- **Como:** Asesor del Sector de Ventas
- **Quiero:** Buscar calzado por nombre, referencia o talla y ver de inmediato cuántos pares hay disponibles en la bodega central.
- **Para:** Responder con rapidez a clientes o confirmar despachos sin interrumpir la operación de los bodegueros.
- **Criterio de Aceptación:** Pantalla simplificada, veloz y de sólo lectura que filtra en tiempo real y permite ver el estado del stock (Disponible, Últimos Pares, Agotado).

---

## 📦 5. Alcance: MVP vs. Mejoras Posteriores

### 5.1 Alcance del Producto Mínimo Viable (MVP - Implementación Actual)
- Autenticación completa con perfiles de usuario y selector rápido de roles para pruebas operativas.
- Panel de control (Dashboard) dinámico adaptado a cada rol con métricas en tiempo real.
- Sistema de alertas automáticas por escasez de inventario con clasificación de severidad.
- Módulo de Órdenes de Compra con estados de vida, selección de proveedor y líneas de producto.
- Módulo de Recepción y Verificación en muelle con validación de cantidades y actualización de stock.
- Módulo de Gestión de Inventario (Kardex) con registro obligatorio de movimientos, tallas (US/COL) y clasificación.
- Terminal de consulta ágil para el Sector de Ventas.
- Scripts SQL completos y ejecutables (Esquema, Seguridad RLS, Storage y Catálogo Semilla).

### 5.2 Mejoras Posteriores (Roadmap Futuro)
- Integración directa con lectores de códigos de barra / pistolas RFID vía Web Bluetooth o cámara WebRTC.
- Envío automático de correos transaccionales mediante Supabase Edge Functions con Resend o SendGrid.
- Sincronización con el ERP corporativo (SAP / Oracle) mediante Webhooks seguros.
- Generación y descarga de remisiones de despacho en formato PDF corporativo con firma digital.

