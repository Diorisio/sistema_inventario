import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateCO } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  ClipboardCheck, 
  Package, 
  FileCheck, 
  X,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function ReceptionPage() {
  const { currentUser, role } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderToReceive, setActiveOrderToReceive] = useState(null);

  // Formulario de recepción
  const [carrierName, setCarrierName] = useState('Servientrega Logística / TCC');
  const [waybillNumber, setWaybillNumber] = useState('GUIA-COL-' + Math.floor(100000 + Math.random() * 900000));
  const [receptionItems, setReceptionItems] = useState([]);
  const [receptionSuccess, setReceptionSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingOrders();
  }, []);

  async function loadPendingOrders() {
    try {
      setLoading(true);
      const allOrders = await inventoryService.getPurchaseOrders();
      // Filtrar órdenes enviadas o recibidas parciales
      const pending = allOrders.filter(o => o.status === 'enviada' || o.status === 'recibida_parcial');
      setOrders(pending);
    } catch (err) {
      console.error('Error cargando órdenes para recepción:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStartReception = (order) => {
    setActiveOrderToReceive(order);
    setReceptionSuccess(null);
    setCarrierName('DHL Express / Coordinadora');
    setWaybillNumber('GUIA-' + Math.floor(100000 + Math.random() * 900000));

    // Inicializar ítems con las cantidades ordenadas
    const initialItems = order.items.map(it => ({
      product_id: it.product_id,
      product_name: it.product_name,
      size_col: it.size_col,
      quantity_ordered: it.quantity_ordered,
      quantity_received: it.quantity_ordered, // predeterminado con lo solicitado
      quantity_damaged: 0,
      discrepancy_reason: ''
    }));

    setReceptionItems(initialItems);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...receptionItems];
    updated[index][field] = value;
    setReceptionItems(updated);
  };

  const handleConfirmReception = async (e) => {
    e.preventDefault();
    if (!activeOrderToReceive) return;

    try {
      setSubmitting(true);
      const payload = {
        carrier_name: carrierName,
        waybill_number: waybillNumber,
        items: receptionItems
      };

      const result = await inventoryService.receivePurchaseOrder(
        activeOrderToReceive.id,
        payload,
        currentUser
      );

      setReceptionSuccess(result);
      setActiveOrderToReceive(null);
      await loadPendingOrders();
    } catch (err) {
      alert('Error en recepción: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canReceive = role === 'admin' || role === 'jefe_bodega' || role === 'auxiliar_logistico';

  if (loading) {
    return <LoadingSpinner message="Consultando manifiestos de carga y órdenes en muelle..." />;
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Truck className="w-7 h-7 text-black" />
            Recepción y Verificación en Muelle (RN-04)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Conteo físico, detección de averías y alta obligatoria en Kardex de calzado entrante.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
            {orders.length} Pedidos en Tránsito
          </span>
        </div>
      </div>

      {/* Alerta de Éxito de Recepción */}
      {receptionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-emerald-900">
              ¡Mercancía Recibida e Ingresada al Inventario con Éxito!
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Se generó el Acta de Recepción <strong>{receptionSuccess.receptionNumber}</strong>. El stock de calzado fue incrementado y se crearon los registros correspondientes en el Kardex inmutable.
              {receptionSuccess.hasDiscrepancy && (
                <span className="block mt-1 text-amber-700 font-semibold">
                  ⚠️ Atención: Se reportaron discrepancias o averías que quedaron registradas en la orden.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Órdenes Pendientes de Recepción */}
      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No hay mercancía pendiente por recibir"
          description="Todas las órdenes de compra han sido verificadas en muelle o no hay pedidos en estado 'enviada'."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((ord) => (
            <div 
              key={ord.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between hover:border-black transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-mono font-bold text-black">{ord.order_number}</span>
                  <StatusBadge status={ord.status} text={ord.status.toUpperCase()} />
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">{ord.supplier?.company_name || 'Proveedor'}</span>
                  </div>
                  <p className="text-gray-500">
                    Fecha estimada arribo: <strong>{formatDateCO(ord.estimated_delivery_date, false)}</strong>
                  </p>
                  <p className="text-gray-500 line-clamp-1">
                    Nota: {ord.notes || 'Reabastecimiento regular'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Líneas a Verificar:</span>
                    <div className="mt-1 space-y-1">
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] bg-gray-50 p-1.5 rounded">
                          <span className="font-semibold text-gray-800">{it.product_name} (Talla {it.size_col})</span>
                          <span className="font-bold text-black">{it.quantity_ordered} pares</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100">
                {canReceive ? (
                  <button
                    onClick={() => handleStartReception(ord)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Iniciar Verificación en Muelle
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400 italic block text-center">
                    Acción reservada para Auxiliares Logísticos y Bodega
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Formulario de Verificación Física en Muelle */}
      {activeOrderToReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs font-mono font-bold text-gray-400">ACTA DE RECEPCIÓN</span>
                <h2 className="text-lg font-black uppercase text-black">
                  Verificar Orden {activeOrderToReceive.order_number}
                </h2>
              </div>
              <button 
                onClick={() => setActiveOrderToReceive(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReception} className="mt-4 space-y-4">
              
              {/* Datos del Transporte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Transportadora / Conductor *
                  </label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    required
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Número de Guía de Remisión *
                  </label>
                  <input
                    type="text"
                    value={waybillNumber}
                    onChange={(e) => setWaybillNumber(e.target.value)}
                    required
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Conteo de Pares por Silueta */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  Conteo Físico por Talla vs. Ordenado (RN-04)
                </h3>

                <div className="space-y-3">
                  {receptionItems.map((item, idx) => {
                    const isDiff = Number(item.quantity_received) !== Number(item.quantity_ordered);
                    const hasDamage = Number(item.quantity_damaged) > 0;

                    return (
                      <div 
                        key={idx} 
                        className={`p-3.5 rounded-xl border transition-colors ${
                          isDiff || hasDamage ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-900">{item.product_name}</span>
                          <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">
                            Talla COL {item.size_col}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="block text-[10px] font-semibold text-gray-500 uppercase">Ordenado</span>
                            <span className="text-sm font-black text-gray-800">{item.quantity_ordered} pares</span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-gray-700 uppercase mb-0.5">
                              Recibido Físico
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity_received}
                              onChange={(e) => handleItemChange(idx, 'quantity_received', Number(e.target.value))}
                              className="w-full text-xs p-1.5 font-bold border border-gray-300 rounded focus:ring-2 focus:ring-black"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-red-600 uppercase mb-0.5">
                              Averías / Daño
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity_damaged}
                              onChange={(e) => handleItemChange(idx, 'quantity_damaged', Number(e.target.value))}
                              className="w-full text-xs p-1.5 font-bold text-red-600 border border-red-300 rounded focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        </div>

                        {(isDiff || hasDamage) && (
                          <div className="mt-2 pt-2 border-t border-amber-200">
                            <input
                              type="text"
                              placeholder="Motivo de la discrepancia (ej: 2 pares faltantes en caja sellada)..."
                              value={item.discrepancy_reason}
                              onChange={(e) => handleItemChange(idx, 'discrepancy_reason', e.target.value)}
                              className="w-full text-xs p-1.5 border border-amber-300 rounded bg-amber-50"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOrderToReceive(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  {submitting ? 'Registrando en Kardex...' : 'Confirmar e Ingresar a Stock'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

