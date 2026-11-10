/**
 * Servicio de Inventario y Cadena de Distribución (Adidas)
 * 
 * FUENTE DE DATOS: Supabase (PostgreSQL) como fuente PRIMARIA y ÚNICA.
 * 
 * Cumplimiento de Reglas de Negocio:
 *  - RN-01: Alertas automáticas de escasez
 *  - RN-03: Kardex inmutable con fecha, tipo y clasificación
 *  - RN-04: Control de discrepancias en recepción
 *  - RN-05: Moneda COP
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Verifica que Supabase esté activo y arroja error descriptivo si no lo está.
 */
function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'La conexión a Supabase no está configurada. ' +
      'Verifica tus variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env y reinicia el servidor.'
    );
  }
  return supabase;
}

/**
 * Valida si un string tiene formato UUID v4.
 * Los IDs de demostración como "usr-admin" NO son UUIDs válidos.
 */
function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Extrae un UUID válido del usuario para FK, o null si es un perfil de demo.
 */
function getUserUUID(user) {
  return isValidUUID(user?.id) ? user.id : null;
}

export const inventoryService = {

  // ═══════════════════════════════════════════════════════════
  // 1. CATÁLOGO DE PRODUCTOS (Siluetas de Calzado Adidas)
  // ═══════════════════════════════════════════════════════════
  async getProducts() {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new Error('Error consultando catálogo de productos: ' + error.message);
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════
  // 2. PROVEEDORES AUTORIZADOS
  // ═══════════════════════════════════════════════════════════
  async getSuppliers() {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('company_name');

    if (error) throw new Error('Error consultando proveedores: ' + error.message);
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════
  // 3. INVENTARIO POR SKU Y TALLA (con producto anidado)
  // ═══════════════════════════════════════════════════════════
  async getInventory() {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('inventory_items')
      .select('*, product:products(*)')
      .order('sku');

    if (error) throw new Error('Error consultando inventario: ' + error.message);
    return (data || []).map(item => ({
      ...item,
      product: item.product || null
    }));
  },

  // ═══════════════════════════════════════════════════════════
  // 4. ALERTAS AUTOMÁTICAS DE ESCASEZ (RN-01)
  // ═══════════════════════════════════════════════════════════
  async getAlerts() {
    const sb = requireSupabase();

    // Intentar leer de stock_alerts (poblada por el trigger)
    const { data, error } = await sb
      .from('stock_alerts')
      .select(`
        *,
        inventory_item:inventory_items(
          *,
          product:products(*)
        )
      `)
      .in('status', ['PENDIENTE', 'EN_GESTION'])
      .order('severity', { ascending: false })
      .order('deficit', { ascending: false });

    if (error) {
      // Fallback: calcular alertas directamente desde inventory_items
      console.warn('Error consultando stock_alerts, calculando desde inventario:', error.message);
      return this._computeAlertsFromInventory();
    }

    return (data || []).map(alert => ({
      ...alert,
      sku: alert.inventory_item?.sku || 'N/A',
      product_name: alert.inventory_item?.product?.name || 'Calzado Adidas',
      reference_code: alert.inventory_item?.product?.reference_code || 'REF-N/A',
      category: alert.inventory_item?.product?.category || 'Originales',
      size_col: alert.inventory_item?.size_col || '-',
      size_us: alert.inventory_item?.size_us || '-',
      stock_maximo: alert.inventory_item?.stock_maximo || 50,
      warehouse_location: alert.inventory_item?.warehouse_location || 'BOD-CENTRAL'
    }));
  },

  /**
   * Fallback: calcula alertas en memoria desde inventory_items.
   */
  async _computeAlertsFromInventory() {
    const inventory = await this.getInventory();
    const alerts = [];

    inventory.forEach(item => {
      if (item.current_stock <= item.stock_minimo) {
        const deficit = item.stock_minimo - item.current_stock;
        let severity = 'MEDIA';
        if (item.current_stock === 0) severity = 'CRITICA';
        else if (item.current_stock <= Math.floor(item.stock_minimo / 2)) severity = 'ALTA';

        alerts.push({
          id: `computed-alt-${item.id}`,
          inventory_item_id: item.id,
          sku: item.sku,
          product_name: item.product?.name || 'Calzado Deportivo',
          reference_code: item.product?.reference_code || 'REF-N/A',
          category: item.product?.category || 'Originales',
          size_col: item.size_col,
          size_us: item.size_us,
          current_stock: item.current_stock,
          stock_minimo: item.stock_minimo,
          stock_maximo: item.stock_maximo,
          deficit,
          severity,
          warehouse_location: item.warehouse_location,
          status: 'PENDIENTE',
          created_at: new Date().toISOString()
        });
      }
    });

    const rank = { CRITICA: 3, ALTA: 2, MEDIA: 1, BAJA: 0 };
    return alerts.sort((a, b) => rank[b.severity] - rank[a.severity] || b.deficit - a.deficit);
  },

  // ═══════════════════════════════════════════════════════════
  // 5. ÓRDENES DE COMPRA (con proveedor e ítems anidados)
  // ═══════════════════════════════════════════════════════════
  async getPurchaseOrders() {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(
          *,
          product:products(name, reference_code, category)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Error consultando órdenes de compra: ' + error.message);

    return (data || []).map(order => ({
      ...order,
      items: (order.items || []).map(it => ({
        ...it,
        product_name: it.product?.name || 'Calzado Adidas',
        product_id: it.product_id
      }))
    }));
  },

  // ═══════════════════════════════════════════════════════════
  // 6. CREAR ORDEN DE COMPRA
  //    Usa getUserUUID() para no enviar IDs de demo inválidos
  // ═══════════════════════════════════════════════════════════
  async createPurchaseOrder(orderData, user) {
    const sb = requireSupabase();

    // Generar número de orden secuencial
    const { data: lastOrder } = await sb
      .from('purchase_orders')
      .select('order_number')
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (lastOrder && lastOrder.length > 0) {
      const match = lastOrder[0].order_number.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const orderNumber = `PO-2026-${String(nextNum).padStart(4, '0')}`;

    const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);
    const tax = Math.round(subtotal * 0.19); // IVA 19% Colombia
    const totalAmount = subtotal + tax;

    // Insertar la orden: created_by solo si es UUID real, siempre created_by_name
    const { data: newOrder, error: orderError } = await sb
      .from('purchase_orders')
      .insert({
        order_number: orderNumber,
        supplier_id: orderData.supplier_id,
        created_by: getUserUUID(user),
        status: 'pendiente_aprobacion',
        subtotal,
        tax,
        total_amount: totalAmount,
        currency: 'COP',
        estimated_delivery_date: orderData.estimated_delivery_date || null,
        notes: orderData.notes || ''
      })
      .select()
      .single();

    if (orderError) throw new Error('Error creando orden de compra: ' + orderError.message);

    // Insertar las líneas de detalle
    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map(it => ({
        order_id: newOrder.id,
        product_id: it.product_id,
        size_col: it.size_col,
        quantity_ordered: Number(it.quantity_ordered),
        unit_cost: Number(it.unit_cost),
        subtotal: Number(it.quantity_ordered) * Number(it.unit_cost)
      }));

      const { error: itemsError } = await sb
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw new Error('Error registrando ítems de la orden: ' + itemsError.message);
    }

    return newOrder;
  },

  // ═══════════════════════════════════════════════════════════
  // 7. ACTUALIZAR ESTADO DE ORDEN (Aprobar, Enviar, Cancelar)
  // ═══════════════════════════════════════════════════════════
  async updateOrderStatus(orderId, newStatus, user) {
    const sb = requireSupabase();

    const updatePayload = {
      status: newStatus
    };

    if (newStatus === 'aprobada') {
      updatePayload.approved_by = getUserUUID(user);
      updatePayload.approved_by_name = user?.full_name || 'Jefe de Compras';
    }

    const { data, error } = await sb
      .from('purchase_orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error('Error actualizando estado de la orden: ' + error.message);
    return data;
  },

  // ═══════════════════════════════════════════════════════════
  // 8. RECEPCIÓN EN MUELLE (RN-03 y RN-04)
  // ═══════════════════════════════════════════════════════════
  async receivePurchaseOrder(orderId, receptionPayload, user) {
    const sb = requireSupabase();

    // Obtener la orden original
    const { data: order, error: orderError } = await sb
      .from('purchase_orders')
      .select('*, items:purchase_order_items(*, product:products(*))')
      .eq('id', orderId)
      .single();

    if (orderError || !order) throw new Error('Orden no encontrada: ' + (orderError?.message || 'ID inválido'));

    const receptionNumber = `REC-2026-${String(Date.now()).slice(-6)}`;
    let hasDiscrepancy = false;

    // Crear acta de recepción
    const { data: reception, error: recError } = await sb
      .from('receptions')
      .insert({
        reception_number: receptionNumber,
        order_id: orderId,
        received_by: getUserUUID(user),
        carrier_name: receptionPayload.carrier_name || '',
        waybill_number: receptionPayload.waybill_number || '',
        has_discrepancies: false,
        notes: receptionPayload.notes || ''
      })
      .select()
      .single();

    if (recError) throw new Error('Error creando acta de recepción: ' + recError.message);

    // Procesar cada ítem recibido
    for (const item of receptionPayload.items) {
      const receivedQty = Number(item.quantity_received) || 0;
      const damagedQty = Number(item.quantity_damaged) || 0;
      const effectiveQty = Math.max(0, receivedQty - damagedQty);

      if (receivedQty !== item.quantity_ordered || damagedQty > 0) {
        hasDiscrepancy = true;
      }

      // Detalle de recepción
      await sb.from('reception_items').insert({
        reception_id: reception.id,
        product_id: item.product_id,
        size_col: item.size_col,
        quantity_ordered: item.quantity_ordered,
        quantity_received: receivedQty,
        quantity_damaged: damagedQty,
        discrepancy_reason: item.discrepancy_reason || null
      });

      if (effectiveQty > 0) {
        const { data: invItem } = await sb
          .from('inventory_items')
          .select('*, product:products(reference_code, name, category)')
          .eq('product_id', item.product_id)
          .eq('size_col', item.size_col)
          .single();

        if (invItem) {
          const prevStock = invItem.current_stock;
          const newStock = prevStock + effectiveQty;

          // Actualizar stock
          await sb
            .from('inventory_items')
            .update({ current_stock: newStock })
            .eq('id', invItem.id);

          // Kardex inmutable (RN-03)
          await sb.from('inventory_movements').insert({
            movement_type: 'ENTRADA',
            inventory_item_id: invItem.id,
            product_reference: invItem.product?.reference_code || 'REF-N/A',
            product_name: invItem.product?.name || 'Calzado Adidas',
            product_category: invItem.product?.category || 'Originales',
            size_col: item.size_col,
            quantity: effectiveQty,
            previous_stock: prevStock,
            new_stock: newStock,
            user_id: getUserUUID(user),
            user_name: user?.full_name || 'Auxiliar Logístico',
            support_document: `${receptionNumber} (Ref. ${order.order_number})`,
            notes: `Ingreso por verificación en muelle. Averías: ${damagedQty} pares.`
          });
        }
      }
    }

    // Actualizar discrepancias y estado de la orden
    if (hasDiscrepancy) {
      await sb.from('receptions').update({ has_discrepancies: true }).eq('id', reception.id);
    }

    const newOrderStatus = hasDiscrepancy ? 'recibida_parcial' : 'recibida_total';
    await sb.from('purchase_orders').update({ status: newOrderStatus }).eq('id', orderId);

    return { receptionNumber, hasDiscrepancy, status: newOrderStatus };
  },

  // ═══════════════════════════════════════════════════════════
  // 9. REGISTRAR MOVIMIENTO MANUAL EN KARDEX (RN-03)
  // ═══════════════════════════════════════════════════════════
  async createInventoryMovement(movementData, user) {
    const sb = requireSupabase();

    const { data: invItem, error: invError } = await sb
      .from('inventory_items')
      .select('*, product:products(reference_code, name, category)')
      .eq('id', movementData.inventory_item_id)
      .single();

    if (invError || !invItem) throw new Error('Ítem de inventario no encontrado: ' + (invError?.message || 'ID inválido'));

    const qty = Number(movementData.quantity);
    if (isNaN(qty) || qty <= 0) throw new Error('La cantidad debe ser mayor a 0');

    const prevStock = invItem.current_stock;
    let newStock = prevStock;

    if (movementData.movement_type === 'ENTRADA' || movementData.movement_type === 'AJUSTE_POSITIVO') {
      newStock = prevStock + qty;
    } else {
      if (qty > prevStock) {
        throw new Error(`Stock insuficiente. Disponible: ${prevStock} pares. Solicitado: ${qty} pares.`);
      }
      newStock = prevStock - qty;
    }

    // Actualizar stock
    const { error: updateError } = await sb
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', invItem.id);

    if (updateError) throw new Error('Error actualizando stock: ' + updateError.message);

    // Kardex inmutable (RN-03)
    const { data: newMovement, error: movError } = await sb
      .from('inventory_movements')
      .insert({
        movement_type: movementData.movement_type,
        inventory_item_id: invItem.id,
        product_reference: invItem.product?.reference_code || 'REF-N/A',
        product_name: invItem.product?.name || 'Calzado Adidas',
        product_category: invItem.product?.category || 'Originales',
        size_col: invItem.size_col,
        quantity: qty,
        previous_stock: prevStock,
        new_stock: newStock,
        user_id: getUserUUID(user),
        user_name: user?.full_name || 'Operador Autorizado',
        support_document: movementData.support_document || 'OPERACION-DIRECTA',
        notes: movementData.notes || 'Movimiento registrado en sistema'
      })
      .select()
      .single();

    if (movError) throw new Error('Error registrando movimiento en Kardex: ' + movError.message);
    return newMovement;
  },

  // ═══════════════════════════════════════════════════════════
  // 10. KARDEX: CONSULTAR TODOS LOS MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════
  async getMovements() {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('inventory_movements')
      .select('*')
      .order('movement_date', { ascending: false })
      .limit(200);

    if (error) throw new Error('Error consultando Kardex: ' + error.message);
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════
  // 11. VERIFICAR CONEXIÓN A SUPABASE
  // ═══════════════════════════════════════════════════════════
  async checkConnection() {
    if (!isSupabaseConfigured || !supabase) {
      return { status: 'offline', message: 'Variables de entorno no configuradas' };
    }
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return { status: 'needs_migration', message: 'Conexión activa, pero las tablas aún no existen.' };
        }
        return { status: 'error', message: 'Error en la consulta: ' + error.message };
      }
      return { status: 'connected', message: 'Conectado y sincronizado con Supabase', rowCount: data?.length || 0 };
    } catch (err) {
      return { status: 'offline', message: 'Sin conexión: ' + err.message };
    }
  }
};
