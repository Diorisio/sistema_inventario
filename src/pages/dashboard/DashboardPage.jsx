import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { inventoryService } from '../../services/inventoryService';
import { formatCOP, formatDateCO, ROLE_LABELS } from '../../utils/formatters';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Boxes, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  ArrowUpRight, 
  Truck, 
  Clock,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPairs: 0,
    totalSKUs: 0,
    alertCount: 0,
    criticalCount: 0,
    activeOrders: 0,
    recentMovementsCount: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [inv, alertsData, orders, movements] = await Promise.all([
          inventoryService.getInventory(),
          inventoryService.getAlerts(),
          inventoryService.getPurchaseOrders(),
          inventoryService.getMovements()
        ]);

        const totalPairs = inv.reduce((sum, item) => sum + (item.current_stock || 0), 0);
        const criticalCount = alertsData.filter(a => a.severity === 'CRITICA').length;
        const activeOrders = orders.filter(o => o.status === 'enviada' || o.status === 'pendiente_aprobacion').length;

        setMetrics({
          totalPairs,
          totalSKUs: inv.length,
          alertCount: alertsData.length,
          criticalCount,
          activeOrders,
          recentMovementsCount: movements.length
        });

        setAlerts(alertsData.slice(0, 4));
        setRecentMovements(movements.slice(0, 5));
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Cargando panel de control logístico..." />;
  }

  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.sector_ventas;

  return (
    <div className="space-y-6">
      
      {/* Saludo y Encabezado Adaptado al Rol */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">
              Bienvenido, {currentUser?.full_name?.split(' ')[0] || 'Usuario'}
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${roleInfo.badgeColor}`}>
              {roleInfo.tag}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Centro de Distribución Central (Siberia, Cundinamarca) — Vista de control operativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(role === 'admin' || role === 'jefe_compra') && (
            <button
              onClick={() => navigate('/ordenes')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden de Compra
            </button>
          )}

          {(role === 'admin' || role === 'jefe_bodega' || role === 'auxiliar_logistico') && (
            <button
              onClick={() => navigate('/recepcion')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black text-xs font-bold rounded-lg transition-colors border border-gray-300"
            >
              <Truck className="w-4 h-4" />
              Verificar Muelle
            </button>
          )}
        </div>
      </div>

      {/* Banner de Alerta Crítica para el Jefe de Compras (RN-01) */}
      {(role === 'admin' || role === 'jefe_compra') && metrics.alertCount > 0 && (
        <div className="bg-amber-500 text-black p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-amber-600">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black text-white rounded-xl">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide">
                Alerta de Escasez Activa: {metrics.alertCount} referencias bajo stock mínimo
              </h2>
              <p className="text-xs font-semibold text-black/80 mt-0.5">
                Se detectaron {metrics.criticalCount} siluetas con existencias en cero. Requieren orden de compra inmediata.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/alertas')}
            className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shadow"
          >
            Ver Alertas y Reponer
          </button>
        </div>
      )}

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stock Total en Bodega"
          value={`${metrics.totalPairs.toLocaleString('es-CO')} pares`}
          subtitle={`${metrics.totalSKUs} combinaciones de talla registradas`}
          icon={Boxes}
          onClick={() => navigate('/inventario')}
        />
        <StatCard
          title="Alertas de Escasez"
          value={metrics.alertCount}
          subtitle={`${metrics.criticalCount} referencias en estado crítico`}
          icon={AlertTriangle}
          alert={metrics.alertCount > 0}
          onClick={() => navigate('/alertas')}
        />
        <StatCard
          title="Órdenes en Tránsito"
          value={metrics.activeOrders}
          subtitle="En espera de arribo o aprobación"
          icon={Truck}
          onClick={() => navigate('/ordenes')}
        />
        <StatCard
          title="Movimientos Registrados"
          value={metrics.recentMovementsCount}
          subtitle="Auditoría inmutable de Kardex"
          icon={TrendingUp}
          onClick={() => navigate('/inventario')}
        />
      </div>

      {/* Sección en 2 Columnas: Alertas Inmediatas + Kardex Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna Izquierda: Escasez Prioritaria */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                  Escasez Prioritaria (Punto de Reorden)
                </h3>
              </div>
              <button
                onClick={() => navigate('/alertas')}
                className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1"
              >
                Ver todas ({metrics.alertCount})
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {alerts.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-500 font-medium">
                  El inventario se encuentra en niveles óptimos. No hay escasez detectada.
                </p>
              ) : (
                alerts.map((alt) => (
                  <div key={alt.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{alt.product_name}</span>
                        <span className="text-[10px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          Talla COL {alt.size_col}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        SKU: <span className="font-mono text-gray-700">{alt.sku}</span> | Ubicación: {alt.warehouse_location}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-red-600">
                        {alt.current_stock} pares (Mín: {alt.stock_minimo})
                      </div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        alt.severity === 'CRITICA' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Déficit: -{alt.deficit} pares
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => navigate('/alertas')}
              className="text-xs font-bold text-black hover:underline"
            >
              Ir a gestión de compras &rarr;
            </button>
          </div>
        </div>

        {/* Columna Derecha: Últimos Movimientos en Kardex */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                  Trazabilidad Reciente (Kardex)
                </h3>
              </div>
              <button
                onClick={() => navigate('/inventario')}
                className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1"
              >
                Ver Kardex
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {recentMovements.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-500">
                  No hay movimientos registrados recientemente.
                </p>
              ) : (
                recentMovements.map((mov) => (
                  <div key={mov.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          mov.movement_type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {mov.movement_type}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{mov.product_name}</span>
                        <span className="text-[10px] text-gray-500 font-medium">Talla {mov.size_col}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Doc: {mov.support_document} | Resp: {mov.user_name}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-extrabold text-black block">
                        {mov.movement_type === 'ENTRADA' ? '+' : '-'}{mov.quantity} pares
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatDateCO(mov.movement_date, true)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => navigate('/inventario')}
              className="text-xs font-bold text-black hover:underline"
            >
              Auditar movimientos completos &rarr;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

