import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/formatters';
import { inventoryService } from '../../services/inventoryService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Bell, Menu, User, ShieldCheck, LogOut, ChevronDown, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuToggle }) {
  const { currentUser, role, switchRole, logout, demoProfiles } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState('checking'); // 'connected' | 'needs_migration' | 'offline' | 'checking'
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        setSupabaseStatus('offline');
        return;
      }
      try {
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error) {
          // Si el error es 42P01 (relation does not exist), la conexión funciona pero falta el schema
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            setSupabaseStatus('needs_migration');
          } else {
            setSupabaseStatus('error');
          }
        } else {
          setSupabaseStatus('connected');
        }
      } catch (err) {
        setSupabaseStatus('offline');
      }
    }

    checkSupabase();
  }, []);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const alerts = await inventoryService.getAlerts();
        setAlertCount(alerts.length);
      } catch (e) {
        console.warn('Error loading header alerts:', e);
      }
    }
    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.sector_ventas;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Izquierda: Botón Menú Móvil + Logo de marca */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-black uppercase">
              ADIDAS
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              LOGÍSTICA COLOMBIA
            </span>
          </div>
        </div>

        {/* Derecha: Estado Supabase + Selector de rol interactivo + Notificaciones + Perfil */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Indicador de Conexión a Supabase en Vivo */}
          <div className="hidden md:flex items-center">
            {supabaseStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300" title="Conectado y sincronizado a Supabase Cloud">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Supabase Online
              </span>
            )}
            {supabaseStatus === 'needs_migration' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300" title="Conexión exitosa, pero falta ejecutar los scripts de migración SQL">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Supabase: Falta migrar SQL
              </span>
            )}
            {supabaseStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-300" title="Operando en modo de persistencia local resiliente">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Modo Local (Offline)
              </span>
            )}
            {supabaseStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300 animate-ping"></span>
                Verificando...
              </span>
            )}
          </div>

          {/* Selector Rápido de Rol (Herramienta interactiva para evaluar el sistema adaptativo) */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors border border-gray-300"
              title="Cambiar rol para probar interfaz adaptada"
            >
              <ShieldCheck className="w-4 h-4 text-black" />
              <span className="hidden md:inline">Rol activo:</span>
              <span className="font-bold text-black">{roleInfo.tag}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {roleDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setRoleDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Cambiar Perfil (Pruebas RBAC)
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Adapta menús y permisos instantáneamente:
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {demoProfiles.map((p) => {
                    const info = ROLE_LABELS[p.role] || {};
                    const isCurrent = p.role === role;
                    return (
                      <button
                        key={p.role}
                        onClick={() => {
                          switchRole(p.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-gray-50 transition-colors ${
                          isCurrent ? 'bg-black/5 font-bold border-l-4 border-black' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{info.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${info.badgeColor}`}>
                            {info.tag}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5">{p.full_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notificaciones de Alerta (Visible para roles que gestionan inventario) */}
          {(role === 'admin' || role === 'jefe_compra' || role === 'jefe_bodega') && (
            <button
              onClick={() => navigate('/alertas')}
              className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              title="Ver alertas de stock bajo y crítico"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>
          )}

          {/* Perfil del Usuario Activo */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {currentUser?.full_name ? currentUser.full_name.slice(0, 2) : 'AD'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {currentUser?.full_name || 'Usuario'}
              </p>
              <p className="text-[10px] text-gray-500">
                {roleInfo.tag}
              </p>
            </div>
          </div>

          {/* Botón Salir */}
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>

        </div>
      </div>
    </header>
  );
}

