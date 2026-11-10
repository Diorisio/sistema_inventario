import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  Truck, 
  Boxes, 
  Search, 
  X,
  History,
  Layers
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth();

  // Definición de ítems con permisos por rol
  const navigationItems = [
    {
      name: 'Panel General',
      to: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'jefe_compra', 'jefe_bodega']
    },
    {
      name: 'Alertas de Escasez',
      to: '/alertas',
      icon: AlertTriangle,
      allowedRoles: ['admin', 'jefe_compra', 'jefe_bodega']
    },
    {
      name: 'Órdenes de Compra',
      to: '/ordenes',
      icon: FileText,
      allowedRoles: ['admin', 'jefe_compra', 'jefe_bodega']
    },
    {
      name: 'Recepción en Muelle',
      to: '/recepcion',
      icon: Truck,
      allowedRoles: ['admin', 'jefe_bodega', 'auxiliar_logistico']
    },
    {
      name: 'Inventario & Kardex',
      to: '/inventario',
      icon: Boxes,
      allowedRoles: ['admin', 'jefe_bodega', 'auxiliar_logistico', 'coordinador_despacho']
    },
    {
      name: 'Consulta de Ventas',
      to: '/ventas',
      icon: Search,
      allowedRoles: ['admin', 'jefe_compra', 'jefe_bodega', 'auxiliar_logistico', 'coordinador_despacho', 'sector_ventas']
    }
  ];

  // Filtrar ítems visibles para el rol actual
  const visibleItems = navigationItems.filter(item => 
    item.allowedRoles.includes(role)
  );

  return (
    <>
      {/* Backdrop para móviles */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Barra Lateral (Sidebar) */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-black text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Cabecera del Sidebar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {/* Tres líneas de Adidas estilizadas en SVG */}
            <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
              <rect x="2" y="16" width="20" height="3" rx="1.5" />
              <rect x="5" y="10" width="17" height="3" rx="1.5" />
              <rect x="9" y="4" width="13" height="3" rx="1.5" />
            </svg>
            <div className="leading-tight">
              <span className="text-base font-black tracking-widest block">ADIDAS</span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Supply Chain</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegación */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold tracking-wider uppercase text-neutral-400 mb-2">
            Módulos del Sistema
          </p>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-white text-black font-bold shadow-sm' 
                    : 'text-gray-300 hover:text-white hover:bg-neutral-900'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer del Sidebar con versión y bodega */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-medium text-gray-300">Hub Central Siberia (Cund.)</span>
          </div>
          <p className="text-[10px] text-gray-400">
            Versión 1.0.0 — Transaccional
          </p>
        </div>
      </aside>
    </>
  );
}

