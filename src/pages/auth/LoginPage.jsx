import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '../../utils/formatters';
import { ShieldCheck, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { demoProfiles, switchRole, loginWithEmail, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' o 'credentials'

  const handleRoleSelect = (roleKey) => {
    switchRole(roleKey);
    // Redirección según rol
    if (roleKey === 'sector_ventas') {
      navigate('/ventas');
    } else if (roleKey === 'auxiliar_logistico') {
      navigate('/recepcion');
    } else {
      navigate('/dashboard');
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Por favor ingrese su correo corporativo');
      return;
    }

    const res = await loginWithEmail(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(res.error || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fondo técnico con diagonales inspiradas en las 3 tiras */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-[800px] h-96 bg-white rotate-45 transform -translate-x-48 -translate-y-24 blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        {/* Logo Adidas estilizado */}
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <svg className="w-10 h-10 fill-white" viewBox="0 0 24 24">
            <rect x="2" y="16" width="20" height="3" rx="1.5" />
            <rect x="5" y="10" width="17" height="3" rx="1.5" />
            <rect x="9" y="4" width="13" height="3" rx="1.5" />
          </svg>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white uppercase">
          ADIDAS COLOMBIA
        </h2>
        <p className="mt-1 text-sm text-gray-400 font-medium">
          Sistema de Gestión de Inventario & Cadena de Distribución
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-neutral-200">
          
          {/* Selector de modo de acceso */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 text-center transition-colors ${
                activeTab === 'demo'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Acceso Rápido por Rol (Demostración)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 text-center transition-colors ${
                activeTab === 'credentials'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Credenciales Corporativas
            </button>
          </div>

          {activeTab === 'demo' ? (
            <div>
              <p className="text-xs text-gray-600 mb-4 text-center font-medium">
                Selecciona uno de los 6 roles para experimentar la interfaz y permisos adaptados:
              </p>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {demoProfiles.map((p) => {
                  const info = ROLE_LABELS[p.role] || {};
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleRoleSelect(p.role)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 group-hover:bg-neutral-800">
                          {p.full_name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{info.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${info.badgeColor}`}>
                              {info.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{info.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Correo Corporativo (@adidas.com.co)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="compras@adidas.com.co"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-black hover:bg-neutral-800 transition-colors focus:outline-none"
              >
                {loading ? 'Validando...' : 'Iniciar Sesión'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Sesión Segura RBAC
            </span>
            <span>Centro Logístico Siberia</span>
          </div>

        </div>
      </div>
    </div>
  );
}

