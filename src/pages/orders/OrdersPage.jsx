import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import { formatCOP, formatDateCO } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { 
  FileText, 
  Plus, 
  Search, 
  Send, 
  CheckCircle, 
  Eye, 
  Calendar, 
  Building2, 
  Package, 
  X,
  Truck
} from 'lucide-react';

export default function OrdersPage() {
  const { role, currentUser } = useAuth();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Formulario de nueva orden
  const [formData, setFormData] = useState({
    supplier_id: '',
    estimated_delivery_date: '',
    notes: '',
    items: []
  });

  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    size_col: '40',
    quantity_ordered: 20
  });

  useEffect(() => {
    loadData();
  }, []);

  // Si se navegó desde una alerta de escasez, abrir modal precargado
  useEffect(() => {
    if (location.state?.prefillAlert && products.length > 0 && suppliers.length > 0) {
      const alt = location.state.prefillAlert;
      const prod = products.find(p => p.reference_code === alt.reference_code) || products[0];
      
      setFormData({
        supplier_id: suppliers[0]?.id || '',
        estimated_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: `Reabastecimiento de emergencia por déficit en ${alt.product_name} talla ${alt.size_col}`,
        items: [
          {
            product_id: prod.id,
            product_name: prod.name,
            size_col: alt.size_col,
            quantity_ordered: Math.max(alt.deficit * 2, 20),
            unit_cost: prod.base_cost,
            subtotal: Math.max(alt.deficit * 2, 20) * prod.base_cost
          }
        ]
      });
      setIsCreateOpen(true);
    }
  }, [location.state, products, suppliers]);

  async function loadData() {
    try {
      console.log('loadData');
      setLoading(true);
      const [ordList, prodList, suppList] = await Promise.all([
        inventoryService.getPurchaseOrders(),
        inventoryService.getProducts(),
        inventoryService.getSuppliers()
      ]);
      setOrders(ordList);
      setProducts(prodList);
      setSuppliers(suppList);

      if (suppList.length > 0 && !formData.supplier_id) {
        setFormData(prev => ({ ...prev, supplier_id: suppList[0].id }));
      }
      if (prodList.length > 0 && !currentItem.product_id) {
        setCurrentItem(prev => ({ ...prev, product_id: prodList[0].id }));
      }
    } catch (err) {
      console.error('Error cargando órdenes:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddItemToOrder = () => {
    if (!currentItem.product_id || currentItem.quantity_ordered <= 0) return;
    const prod = products.find(p => p.id === currentItem.product_id);
    if (!prod) return;

    const newItem = {
      product_id: prod.id,
      product_name: prod.name,
      size_col: currentItem.size_col,
      quantity_ordered: Number(currentItem.quantity_ordered),
      unit_cost: prod.base_cost,
      subtotal: Number(currentItem.quantity_ordered) * prod.base_cost
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Debe agregar al menos una línea de calzado a la orden');
      return;
    }

    try {
      await inventoryService.createPurchaseOrder(formData, currentUser);
      setIsCreateOpen(false);
      setFormData({
        supplier_id: suppliers[0]?.id || '',
        estimated_delivery_date: '',
        notes: '',
        items: []
      });
      await loadData();
    } catch (err) {
      alert('Error creando la orden: ' + err.message);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await inventoryService.updateOrderStatus(orderId, newStatus, currentUser);
      await loadData();
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails(null);
      }
    } catch (err) {
      alert('Error actualizando estado: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(ord => {
    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      ord.order_number.toLowerCase().includes(term) ||
      (ord.supplier?.company_name || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const canManageOrders = role === 'admin' || role === 'jefe_compra';

  if (loading) {
    return <LoadingSpinner message="Cargando órdenes de compra registradas..." />;
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <FileText className="w-7 h-7 text-black" />
            Órdenes de Compra (PO)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestión, aprobación formal y seguimiento de pedidos de calzado a proveedores.
          </p>
        </div>

        {canManageOrders && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Orden de Compra
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número (ej: PO-2026-0045) o proveedor..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'pendiente_aprobacion', 'aprobada', 'enviada', 'recibida_total'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Órdenes */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay órdenes de compra"
          description="No se encontraron registros con los filtros actuales."
          actionText={canManageOrders ? "Crear primera orden" : undefined}
          onAction={canManageOrders ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Número de Orden</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Total (COP)</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{ord.supplier?.company_name || 'Proveedor Directo'}</div>
                      <div className="text-[10px] text-gray-400">NIT: {ord.supplier?.nit || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {formatDateCO(ord.created_at, false)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-black">
                      {formatCOP(ord.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ord.status} text={ord.status.replace('_', ' ').toUpperCase()} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver detalle de la orden"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Flujo de aprobación para Jefe de Compras / Admin */}
                        {canManageOrders && ord.status === 'pendiente_aprobacion' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, 'aprobada')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-sm"
                            title="Aprobar orden"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Aprobar
                          </button>
                        )}

                        {canManageOrders && ord.status === 'aprobada' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, 'enviada')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-sm"
                            title="Enviar orden a proveedor"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Enviar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Orden de Compra */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-black" />
                Registrar Orden de Compra
              </h2>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="mt-4 space-y-4">
              
              {/* Proveedor y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Proveedor Autorizado *
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.company_name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Fecha Estimada de Entrega
                  </label>
                  <input
                    type="date"
                    value={formData.estimated_delivery_date}
                    onChange={(e) => setFormData({ ...formData, estimated_delivery_date: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Agregar Ítem de Calzado */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  Agregar Calzado a la Orden
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Silueta</label>
                    <select
                      value={currentItem.product_id}
                      onChange={(e) => setCurrentItem({ ...currentItem, product_id: e.target.value })}
                      className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Talla COL</label>
                    <select
                      value={currentItem.size_col}
                      onChange={(e) => setCurrentItem({ ...currentItem, size_col: e.target.value })}
                      className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                    >
                      {['38', '39', '40', '41', '42', '43'].map(t => (
                        <option key={t} value={t}>Talla {t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Pares</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={currentItem.quantity_ordered}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity_ordered: Number(e.target.value) })}
                        className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleAddItemToOrder}
                        className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Ítems Agregados */}
              <div>
                <p className="text-xs font-bold uppercase text-gray-700 mb-2">Líneas de la Orden ({formData.items.length})</p>
                {formData.items.length === 0 ? (
                  <p className="text-xs text-gray-400 italic p-3 text-center border border-dashed rounded-lg">
                    No has añadido productos a esta orden aún.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-black">{item.product_name}</span>
                          <span className="ml-2 text-gray-500">Talla COL {item.size_col} x {item.quantity_ordered} pares</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">{formatCOP(item.subtotal)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Observaciones / Justificación de Compra
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles logísticos, condiciones de flete..."
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm"
                >
                  Registrar Orden
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle de Orden */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs font-mono font-bold text-gray-500">ORDEN DE COMPRA</span>
                <h3 className="text-lg font-black text-black">{selectedOrderDetails.order_number}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-gray-500 block">Proveedor:</span>
                  <span className="font-bold text-gray-900">{selectedOrderDetails.supplier?.company_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Emitida por:</span>
                  <span className="font-bold text-gray-900">{selectedOrderDetails.created_by_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Fecha Creación:</span>
                  <span className="font-bold text-gray-900">{formatDateCO(selectedOrderDetails.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Estado Actual:</span>
                  <StatusBadge status={selectedOrderDetails.status} />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 uppercase text-[11px]">Detalle de Mercancía:</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {selectedOrderDetails.items?.map((it, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between bg-white text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{it.product_name}</div>
                        <div className="text-[10px] text-gray-500">Talla COL {it.size_col} | {it.quantity_ordered} pares</div>
                      </div>
                      <div className="font-bold text-black">{formatCOP(it.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between text-sm font-black border-t border-gray-100">
                <span>Total Consolidado (COP):</span>
                <span>{formatCOP(selectedOrderDetails.total_amount)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

