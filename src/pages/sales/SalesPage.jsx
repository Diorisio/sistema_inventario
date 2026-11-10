import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { formatCOP } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Search,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  XCircle,
  Share2,
  Layers,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const [prodData, invData] = await Promise.all([
          inventoryService.getProducts(),
          inventoryService.getInventory()
        ]);
        setProducts(prodData);
        setInventory(invData);
      } catch (err) {
        console.error('Error cargando terminal de ventas:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Agrupar existencias por producto
  const catalogWithStock = products.map(prod => {
    const items = inventory.filter(i => i.product_id === prod.id);
    const totalPairs = items.reduce((sum, it) => sum + (it.current_stock || 0), 0);
    return {
      ...prod,
      items,
      totalPairs
    };
  });

  const filteredCatalog = catalogWithStock.filter(prod => {
    const matchesCat = selectedCategory === 'ALL' || prod.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      prod.name.toLowerCase().includes(term) ||
      prod.reference_code.toLowerCase().includes(term) ||
      prod.colorway.toLowerCase().includes(term);

    const matchesSize =
      selectedSize === 'ALL' ||
      prod.items.some(it => it.size_col === selectedSize && it.current_stock > 0);

    return matchesCat && matchesSearch && matchesSize;
  });

  const handleCopyAvailability = (product) => {
    const availableSizes = product.items
      .filter(i => i.current_stock > 0)
      .map(i => `Talla ${i.size_col}: ${i.current_stock} pares`)
      .join(', ');

    const text = `👟 *Adidas - ${product.name}*\nRef: ${product.reference_code}\nPrecio: ${formatCOP(product.retail_price)}\nDisponibilidad en Bodega:\n${availableSizes || 'Agotado en todas las tallas'}`;

    navigator.clipboard?.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  if (loading) {
    return <LoadingSpinner message="Consultando disponibilidad en tiempo real para ventas..." />;
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-black" />
            Terminal de Consulta Comercial (Ventas)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Buscador instantáneo de existencias por silueta y talla en Bodega Central (Modo Sólo Lectura).
          </p>
        </div>

        {copiedNotification && (
          <div className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow animate-in fade-in flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            ¡Disponibilidad copiada al portapapeles!
          </div>
        )}
      </div>

      {/* Barra de Búsqueda y Filtros de Talla */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por silueta (ej: Samba OG, Gazelle, Ultraboost) o referencia..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Originales', 'Corredor', 'Futbol'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${selectedCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {cat === 'ALL' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro rápido por Talla Colombiana */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-gray-500 uppercase text-[11px] whitespace-nowrap">Filtrar por Talla:</span>
          {['ALL', '38', '39', '40', '41', '42'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedSize(t)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${selectedSize === t
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t === 'ALL' ? 'Cualquiera' : `Talla ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Catálogo en Cuadrícula de Tarjetas */}
      {filteredCatalog.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No hay productos disponibles"
          description="No se encontraron referencias con los criterios de búsqueda seleccionados."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalog.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                {/* Imagen del Calzado */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {prod.category}
                  </span>
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-black text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                    {formatCOP(prod.retail_price)}
                  </span>
                </div>

                {/* Contenido de la Silueta */}
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>REF: {prod.reference_code}</span>
                    <span className="text-gray-500 font-semibold">{prod.gender}</span>
                  </div>

                  <h3 className="text-base font-black text-black leading-tight">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {prod.colorway}
                  </p>

                  {/* Matriz de Tallas y Existencias en Bodega */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase text-gray-700 tracking-wider">
                        Disponibilidad por Talla:
                      </span>
                      <span className="text-xs font-black text-black">
                        Total: {prod.totalPairs} pares
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {prod.items.map((item) => {
                        const inStock = item.current_stock > 0;
                        const isLow = item.current_stock <= item.stock_minimo && inStock;

                        return (
                          <div
                            key={item.id}
                            className={`p-1.5 rounded-lg border text-xs flex flex-col items-center ${!inStock
                                ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-60'
                                : isLow
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                              }`}
                          >
                            <span className="text-[10px] text-gray-500 block leading-none">COL</span>
                            <span className="text-xs font-black">{item.size_col}</span>
                            <span className={`text-[10px] mt-0.5 ${!inStock ? 'text-red-500 font-bold' : ''}`}>
                              {inStock ? `${item.current_stock}p` : '0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Compartir Disponibilidad */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleCopyAvailability(prod)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 hover:border-black bg-white hover:bg-gray-100 text-black transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Copiar Disponibilidad para Cliente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

