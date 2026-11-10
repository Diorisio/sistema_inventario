import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateCO, formatCOP } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Boxes,
  History,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Tag,
  MapPin,
  X,
  FileCheck2,
  AlertCircle,
  Download
} from 'lucide-react';

export default function InventoryPage() {
  const { currentUser, role } = useAuth();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'kardex'
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal para registro manual de movimiento
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    inventory_item_id: '',
    movement_type: 'SALIDA',
    quantity: 1,
    support_document: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [invData, movData] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getMovements()
      ]);
      setInventory(invData);
      setMovements(movData);

      if (invData.length > 0 && !movementForm.inventory_item_id) {
        setMovementForm(prev => ({ ...prev, inventory_item_id: invData[0].id }));
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRegisterMovement = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      await inventoryService.createInventoryMovement(movementForm, currentUser);
      setIsMovementModalOpen(false);
      setMovementForm({
        inventory_item_id: inventory[0]?.id || '',
        movement_type: 'SALIDA',
        quantity: 1,
        support_document: '',
        notes: ''
      });
      await loadData();
      setActiveTab('kardex'); // Llevar al usuario al kardex para ver el registro inmediato
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'stock') {
      filename = `inventario_adidas_${new Date().toISOString().split('T')[0]}.csv`;
      csvContent = 'SKU,Referencia,Silueta,Categoria,Talla_COL,Talla_US,Stock_Actual,Stock_Minimo,Ubicacion\n';
      filteredInventory.forEach(it => {
        csvContent += `"${it.sku}","${it.product?.reference_code || ''}","${it.product?.name || ''}","${it.product?.category || ''}","${it.size_col}","${it.size_us}",${it.current_stock},${it.stock_minimo},"${it.warehouse_location}"\n`;
      });
    } else {
      filename = `kardex_adidas_${new Date().toISOString().split('T')[0]}.csv`;
      csvContent = 'Fecha_Hora,Tipo_Movimiento,Silueta,Referencia,Categoria,Talla_COL,Cantidad,Stock_Previo,Stock_Nuevo,Doc_Soporte,Responsable\n';
      filteredMovements.forEach(m => {
        csvContent += `"${m.movement_date}","${m.movement_type}","${m.product_name}","${m.product_reference}","${m.product_category}","${m.size_col}",${m.quantity},${m.previous_stock},${m.new_stock},"${m.support_document}","${m.user_name}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesCat = categoryFilter === 'ALL' || item.product?.category === categoryFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.product?.name || '').toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      (item.product?.reference_code || '').toLowerCase().includes(term) ||
      item.size_col.includes(term);

    return matchesCat && matchesSearch;
  });

  const filteredMovements = movements.filter(mov => {
    const term = searchTerm.toLowerCase();
    return (
      mov.product_name.toLowerCase().includes(term) ||
      mov.product_reference.toLowerCase().includes(term) ||
      mov.support_document.toLowerCase().includes(term) ||
      mov.user_name.toLowerCase().includes(term)
    );
  });

  const canRegisterMovement =
    role === 'admin' ||
    role === 'jefe_bodega' ||
    role === 'auxiliar_logistico' ||
    role === 'coordinador_despacho';

  if (loading) {
    return <LoadingSpinner message="Consultando stock y libros de Kardex..." />;
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Boxes className="w-7 h-7 text-black" />
            Gestión y Clasificación de Inventario (RN-03)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Control de existencias por talla, ubicación y registro inmutable de Kardex en Colombia.
          </p>
        </div>

        {canRegisterMovement && (
          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Movimiento Manual
          </button>
        )}
      </div>

      {/* Selector de Pestañas: Stock vs Kardex */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('stock')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'stock'
            ? 'border-black text-black font-black'
            : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
        >
          <Boxes className="w-4 h-4" />
          Stock Actual por Talla ({filteredInventory.length})
        </button>

        <button
          onClick={() => setActiveTab('kardex')}
          className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'kardex'
            ? 'border-black text-black font-black'
            : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
        >
          <History className="w-4 h-4" />
          Kardex de Trazabilidad ({filteredMovements.length})
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'stock' ? "Buscar por silueta, SKU, talla..." : "Buscar en Kardex por documento, silueta o responsable..."}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>

        {activeTab === 'stock' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Originales', 'Corredor', 'Futbol'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${categoryFilter === cat
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {cat === 'ALL' ? 'Todas las Categorías' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PESTAÑA 1: STOCK ACTUAL */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Calzado & Silueta</th>
                  <th className="py-3 px-4">Clasificación</th>
                  <th className="py-3 px-4">SKU / Referencia</th>
                  <th className="py-3 px-4">Talla COL / US</th>
                  <th className="py-3 px-4">Ubicación Bodega</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                {filteredInventory.map((item) => {
                  let status = 'optimo';
                  if (item.current_stock === 0) status = 'critico';
                  else if (item.current_stock <= item.stock_minimo) status = 'bajo';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.product?.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-bold text-gray-900">{item.product?.name || 'Calzado'}</div>
                            <div className="text-[10px] text-gray-400">{item.product?.colorway}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800">
                          {item.product?.category || 'Originales'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-black">COL {item.size_col}</span>
                        <span className="text-gray-400 text-[10px] ml-1">(US {item.size_us})</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {item.warehouse_location}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-sm font-black ${item.current_stock === 0 ? 'text-red-600' : 'text-black'}`}>
                          {item.current_stock}
                        </span>
                        <span className="text-[10px] text-gray-400 block">Mín: {item.stock_minimo}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={status} text={status.toUpperCase()} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: KARDEX INMUTABLE (RN-03) */}
      {activeTab === 'kardex' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-black" />
              <span className="text-xs font-bold uppercase text-gray-700">
                Libro Mayor de Movimientos (Kardex Fiscal e Inmutable)
              </span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Conforme a RN-03: Fecha, Tipo y Clasificación obligatorias
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Tipo Movimiento</th>
                  <th className="py-3 px-4">Silueta & Clasificación</th>
                  <th className="py-3 px-4">Talla</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-center">Saldo</th>
                  <th className="py-3 px-4">Doc. Soporte</th>
                  <th className="py-3 px-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                {filteredMovements.map((mov) => {
                  const isPositive = mov.movement_type === 'ENTRADA' || mov.movement_type === 'AJUSTE_POSITIVO';

                  return (
                    <tr key={mov.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                        {formatDateCO(mov.movement_date, true)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{mov.product_name}</div>
                        <div className="text-[10px] text-gray-400">
                          Ref: {mov.product_reference} | {mov.product_category}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-black">
                        COL {mov.size_col}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black">
                        <span className={isPositive ? 'text-emerald-700' : 'text-purple-700'}>
                          {isPositive ? '+' : '-'}{mov.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-gray-600">
                        {mov.previous_stock} &rarr; <strong className="text-black">{mov.new_stock}</strong>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-700 text-[11px]">
                        {mov.support_document}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {mov.user_name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Registrar Movimiento Manual en Kardex */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-lg font-black uppercase text-black">
                Registrar Movimiento en Kardex
              </h2>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterMovement} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Ítem de Inventario (SKU y Talla) *
                </label>
                <select
                  value={movementForm.inventory_item_id}
                  onChange={(e) => setMovementForm({ ...movementForm, inventory_item_id: e.target.value })}
                  required
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.product?.name} — Talla {i.size_col} (Stock Actual: {i.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Tipo de Movimiento *
                  </label>
                  <select
                    value={movementForm.movement_type}
                    onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  >
                    <option value="SALIDA">SALIDA</option>
                    <option value="DESPACHO">DESPACHO TIENDA</option>
                    <option value="AJUSTE_POSITIVO">AJUSTE POSITIVO (+)</option>
                    <option value="AJUSTE_NEGATIVO">AJUSTE NEGATIVO (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Cantidad (Pares) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                    required
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Documento de Soporte (Remisión / Guía / Acta) *
                </label>
                <input
                  type="text"
                  placeholder="Ej: DESP-BOG-2041 o ACTA-AJUSTE-09"
                  value={movementForm.support_document}
                  onChange={(e) => setMovementForm({ ...movementForm, support_document: e.target.value })}
                  required
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Observaciones / Justificación
                </label>
                <textarea
                  rows="2"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="Destino, motivo de la merma o traslado..."
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-sm"
                >
                  Guardar en Kardex
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

