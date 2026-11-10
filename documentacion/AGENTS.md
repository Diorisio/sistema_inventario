# AGENTS.md — Reglas y Directrices para Agentes de IA

Este documento contiene las reglas de desarrollo, arquitectura, seguridad y flujos de trabajo que **cualquier agente de inteligencia artificial o desarrollador debe seguir rigurosamente** al trabajar en este repositorio.

---

## 🛑 REGLA FUNDAMENTAL DE LECTURA OBLIGATORIA

> **Antes de modificar o crear cualquier archivo en este repositorio, el agente DEBE leer primero los siguientes cuatro documentos en este orden:**
> 1. `REQUISITOS.md`: Para entender el alcance del negocio, los 6 roles, las reglas y los criterios de aceptación.
> 2. `DATABASE.md`: Para conocer el esquema relacional, los tipos, restricciones y políticas RLS.
> 3. `DESIGN.md`: Para respetar la identidad visual corporativa de Adidas y los lineamientos de UI/UX.
> 4. `TAREAS.md`: Para conocer el estado actual del checklist y registrar avances de manera verificable.

---

## 🛠️ Pila Tecnológica y Restricciones Estrictas

1. **Lenguaje:** JavaScript ES Modules (ES6+). **PROHIBIDO el uso de TypeScript (`.ts`, `.tsx`)** en cualquier archivo del proyecto.
2. **Framework Frontend:** React 18+ estructurado en componentes funcionales y Hooks nativos (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`).
3. **Construcción y Servidor:** Vite.
4. **Enrutamiento:** React Router DOM (v6+), estructurado con guardias de rol.
5. **Estilos:** Tailwind CSS con clases semánticas utilitarias. No introducir frameworks pesados que choquen con la identidad visual (como Material UI o Ant Design).
6. **Iconos:** `lucide-react`.
7. **Backend / Base de Datos:** Supabase (PostgreSQL 15+, Auth, Row Level Security y Storage).

---

## 🏛️ Convenciones de Arquitectura de Código

El código debe residir bajo `src/` respetando estrictamente esta estructura:

- `src/components/common/`: Componentes transversales independientes del dominio (Layout, Header, Sidebar, Modal, Badges, Botones, Tablas).
- `src/components/ui/`: Entradas de formulario, selectores, campos de búsqueda accesibles.
- `src/layouts/`: Plantilla principal que renderiza el Sidebar colapsable y adapta la navegación según el rol del usuario activo.
- `src/pages/`: Vistas de nivel superior que representan rutas directas.
- `src/context/`: Estados globales encapsulados (ej. `AuthContext.jsx` para sesión y rol activo, `AlertContext.jsx`).
- `src/hooks/`: Hooks reutilizables para encapsular consultas y lógica de negocio.
- `src/services/`: Capa desacoplada para interactuar con Supabase. Las páginas nunca deben llamar directamente a `supabase.from(...)` sin pasar o modelar mediante un servicio.
- `src/lib/`: Instancia cliente de Supabase (`supabase.js`) y utilitarios agnósticos.
- `src/utils/`: Funciones puras para formateo de pesos colombianos (`formatCOP`), fechas locales (`formatDateCO`), validación de SKU y exportación.

---

## 🔒 Reglas de Seguridad y Supabase

1. **Nunca exponer credenciales privilegiadas:** Bajo ninguna circunstancia uses `service_role` ni la expongas en variables de entorno de Vite (`VITE_`). Solo se utiliza `VITE_SUPABASE_URL` y la clave pública `VITE_SUPABASE_ANON_KEY`.
2. **Autorización Real en Base de Datos (RLS):**
   - Ocultar un botón o una pestaña en la interfaz NO es seguridad.
   - Cada tabla debe contar con `ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;`.
   - Ninguna política de datos sensibles debe usar atajos como `USING (true)` o `WITH CHECK (true)`.
3. **Protección de Roles:**
   - La asignación de roles (`profiles.role`) está protegida para que un usuario no pueda elevar sus propios privilegios.
4. **Protección de Datos Sensibles:**
   - Nunca registrar en la consola (`console.log`) contraseñas, tokens JWT, datos personales o respuestas de autenticación en texto claro.

---

## 🎨 Principios de Diseño e Interfaz (Inspiración Adidas)

- **Identidad sobria y deportiva:** Paleta dominada por blanco puro (`#FFFFFF`), negro sólido (`#000000`), grises antracita (`#111111`, `#1F2937`) y acentos específicos para estados:
  - Éxito / Stock Óptimo: Verde esmeralda (`#10B981`)
  - Alerta / Stock Bajo: Amarillo ámbar (`#F59E0B`)
  - Peligro / Stock Crítico / Rechazado: Rojo carmesí (`#EF4444`)
  - Info / En Tránsito: Azul cobalto (`#2563EB`)
- **Adaptabilidad Ergonómica:** La interfaz debe ser fluida y táctil en tablets y móviles para auxiliares logísticos en bodega, y detallada y densa en computadores de escritorio para compras y administración.
- **Estados de Interfaz Obligatorios:**
  - **Carga (Loading):** Skeletons o spinners sutiles.
  - **Vacío (Empty State):** Mensajes comprensibles con ilustración o icono y botón de acción.
  - **Error:** Feedback claro en español, explicando qué falló y cómo reintentar.

---

## 🔄 Flujo de Trabajo y Definición de Terminado (DoD)

Una tarea solo se considera **COMPLETADA** cuando cumple con:
1. El código no contiene errores de compilación (`npm run build` finaliza con éxito).
2. Se han contemplado los 6 roles del sistema y sus restricciones asociadas.
3. El registro de transacciones de inventario almacena de forma obligatoria:
   - Fecha y hora exacta.
   - Tipo de movimiento (`ENTRADA`, `SALIDA`, `AJUSTE`, `DESPACHO`).
   - Clasificación completa del calzado (referencia, categoría, talla, SKU).
4. Las alertas de escasez se disparan automáticamente cuando el stock cae por debajo del umbral mínimo.
5. Se actualiza el archivo `TAREAS.md` marcando la tarea como `[X]` e indicando la fecha de finalización.

