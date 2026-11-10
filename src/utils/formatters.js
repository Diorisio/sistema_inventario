/**
 * Formatea un número en Pesos Colombianos (COP) sin decimales.
 * @param {number|string} amount
 * @returns {string} Ej: $ 499.900
 */
export function formatCOP(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formatea una fecha en formato local de Colombia.
 * @param {string|Date} date
 * @param {boolean} includeTime
 * @returns {string} Ej: 07/11/2026 07:15 PM
 */
export function formatDateCO(date, includeTime = true) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };

  return new Intl.DateTimeFormat('es-CO', options).format(d);
}

/**
 * Mapeo legible de roles a etiquetas en español con descripción.
 */
export const ROLE_LABELS = {
  admin: {
    title: 'Administrador General',
    tag: 'Admin',
    description: 'Acceso total y configuración del sistema',
    badgeColor: 'bg-black text-white',
  },
  jefe_compra: {
    title: 'Jefe de Compras',
    tag: 'Compras',
    description: 'Aprobación de órdenes y monitoreo de escasez',
    badgeColor: 'bg-blue-900 text-blue-100',
  },
  jefe_bodega: {
    title: 'Jefe de Bodega',
    tag: 'Bodega Central',
    description: 'Supervisión de stock, recepción y mermas',
    badgeColor: 'bg-emerald-900 text-emerald-100',
  },
  auxiliar_logistico: {
    title: 'Auxiliar Logístico',
    tag: 'Operaciones',
    description: 'Verificación física en muelle y acomodo',
    badgeColor: 'bg-amber-900 text-amber-100',
  },
  coordinador_despacho: {
    title: 'Coordinador de Despacho',
    tag: 'Despacho',
    description: 'Control de salidas a tiendas y clientes',
    badgeColor: 'bg-purple-900 text-purple-100',
  },
  sector_ventas: {
    title: 'Sector de Ventas',
    tag: 'Comercial',
    description: 'Consulta de stock y catálogo en tiempo real',
    badgeColor: 'bg-zinc-800 text-zinc-100',
  },
};

/**
 * Severidad de las alertas
 */
export const SEVERITY_CONFIG = {
  CRITICA: {
    label: 'Crítica (Sin Existencias)',
    badge: 'bg-red-100 text-red-800 border-red-300',
    dot: 'bg-red-600',
  },
  ALTA: {
    label: 'Alta (Déficit Severo)',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    dot: 'bg-orange-500',
  },
  MEDIA: {
    label: 'Media (Punto de Reorden)',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
  },
  BAJA: {
    label: 'Baja (Seguimiento)',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
  },
};

