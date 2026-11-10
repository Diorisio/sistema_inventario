import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import { formatCOP, formatDateCO, SEVERITY_CONFIG } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { 
  AlertTriangle, 
  ShoppingCart, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Flame,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AlertsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await inventoryService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Error cargando alertas:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filtrado
  const filteredAlerts = alerts.filter(alt => {
    const matchesSeverity = filterSeverity === 'ALL' || alt.severity === filterSeverity;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      alt.product_name.toLowerCase().includes(term) ||
      alt.sku.toLowerCase().includes(term) ||
      alt.reference_code.toLowerCase().includes(term);

    return matchesSeverity && matchesSearch;
  });

  const criticalCount = alerts.filter(a => a.severity === 'CRITICA').length;
  const highCount = alerts.filter(a => a.severity === 'ALTA').length;

  const handleGeneratePO = (alertItem) => {
    // Redirigir a órdenes de compra precargando el producto
    navigate('/ordenes', { state: { prefillAlert: alertItem } });
  };

  if (loading) {
    return <LoadingSpinner message="Calculando niveles de inventario y alertas activas..." />;
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Módulo */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
              Alertas de Escasez y Reorden (RN-01)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Detección automática de calzado por debajo del stock de seguridad para el Jefe de Compras.
          </p>
        </div>

        {/* Resumen numérico */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-bold rounded-lg border border-red-200">
            {criticalCount} Críticas (Stock 0)
          </span>
          <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200">
            {highCount} Severidad Alta
          </span>
        </div>
      </div>

      {/* Controles: Buscador y Filtros de Severidad */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por silueta, SKU o referencia (ej. Samba, UB-LGT)..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Nivel:
          </span>
          {['ALL', 'CRITICA', 'ALTA', 'MEDIA'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                filterSeverity === sev
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sev === 'ALL' ? 'Todas' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Alertas */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No se encontraron alertas activas"
          description="Todos los productos coinciden con los umbrales seguros de inventario o no hay resultados para el filtro seleccionado."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map((alt) => {
            const config = SEVERITY_CONFIG[alt.severity] || SEVERITY_CONFIG.MEDIA;
            const isCritical = alt.severity === 'CRITICA';

            return (
              <div
                key={alt.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                  isCritical ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
                }`}
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.badge}`}>
                      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                      {config.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-500">
                      Talla COL {alt.size_col} (US {alt.size_us})
                    </span>
                  </div>

                  {/* Silueta y SKU */}
                  <h3 className="text-base font-black text-gray-900 leading-tight">
                    {alt.product_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-semibold">
                      {alt.sku}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Ref: {alt.reference_code}
                    </span>
                  </div>

                  {/* Detalle de Existencias y Déficit */}
                  <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-500 uppercase">Stock Actual</span>
                      <span className={`text-base font-black ${alt.current_stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {alt.current_stock}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-500 uppercase">Stock Mínimo</span>
                      <span className="text-base font-bold text-gray-700">
                        {alt.stock_minimo}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-500 uppercase">Déficit</span>
                      <span className="text-base font-black text-red-600">
                        -{alt.deficit}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2.5 text-[11px] text-gray-500 flex items-center justify-between">
                    <span>Ubicación: <strong>{alt.warehouse_location}</strong></span>
                    <span>Categoría: <strong>{alt.category}</strong></span>
                  </p>
                </div>

                {/* Acción de Reorden para Jefe de Compras / Admin */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {(role === 'admin' || role === 'jefe_compra') ? (
                    <button
                      onClick={() => handleGeneratePO(alt)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg text-white bg-black hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Generar Orden de Compra Inmediata
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">
                      Notificación enviada al Jefe de Compras
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

