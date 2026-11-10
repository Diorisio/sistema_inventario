import React from 'react';

export default function StatusBadge({ type, status, text }) {
  // Configuración de estilo por tipo de estado
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      // Stock
      case 'optimo':
      case 'disponible':
      case 'aprobada':
      case 'recibida_total':
      case 'resuelta':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      
      case 'bajo':
      case 'alerta':
      case 'pendiente_aprobacion':
      case 'recibida_parcial':
      case 'en_gestion':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      
      case 'critico':
      case 'agotado':
      case 'cancelada':
      case 'rechazada':
        return 'bg-red-50 text-red-700 border-red-200';
      
      case 'enviada':
      case 'en_transito':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      
      case 'borrador':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDotStyle = () => {
    switch (status?.toLowerCase()) {
      case 'optimo':
      case 'disponible':
      case 'aprobada':
      case 'recibida_total':
      case 'resuelta':
        return 'bg-emerald-500';
      case 'bajo':
      case 'alerta':
      case 'pendiente_aprobacion':
      case 'recibida_parcial':
      case 'en_gestion':
        return 'bg-amber-500';
      case 'critico':
      case 'agotado':
      case 'cancelada':
      case 'rechazada':
        return 'bg-red-500';
      case 'enviada':
      case 'en_transito':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`} />
      {text || status}
    </span>
  );
}

