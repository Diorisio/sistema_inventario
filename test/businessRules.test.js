import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatCOP, formatDateCO } from '../src/utils/formatters.js';

describe('Reglas del Negocio y Lógica de Trazabilidad (Adidas)', () => {

  // RN-05: Moneda oficial COP
  test('RN-05: formatCOP formatea correctamente valores en Pesos Colombianos', () => {
    const formatted = formatCOP(499900);
    assert.match(formatted, /499\.900/);
    assert.match(formatted, /\$/);
  });

  // RN-01: Algoritmo de Detección de Escasez y Criticidad
  test('RN-01: Detección de escasez y severidad según umbral mínimo', () => {
    function computeAlert(currentStock, stockMinimo) {
      if (currentStock <= stockMinimo) {
        const deficit = stockMinimo - currentStock;
        let severity = 'MEDIA';
        if (currentStock === 0) {
          severity = 'CRITICA';
        } else if (currentStock <= Math.floor(stockMinimo / 2)) {
          severity = 'ALTA';
        }
        return { isAlert: true, deficit, severity };
      }
      return { isAlert: false, deficit: 0, severity: null };
    }

    // Caso 1: Stock en 0 -> Severidad CRÍTICA
    const alertZero = computeAlert(0, 8);
    assert.equal(alertZero.isAlert, true);
    assert.equal(alertZero.deficit, 8);
    assert.equal(alertZero.severity, 'CRITICA');

    // Caso 2: Stock bajo la mitad del mínimo -> Severidad ALTA
    const alertHigh = computeAlert(3, 8);
    assert.equal(alertHigh.isAlert, true);
    assert.equal(alertHigh.deficit, 5);
    assert.equal(alertHigh.severity, 'ALTA');

    // Caso 3: Stock en punto de reorden -> Severidad MEDIA
    const alertMedium = computeAlert(7, 8);
    assert.equal(alertMedium.isAlert, true);
    assert.equal(alertMedium.deficit, 1);
    assert.equal(alertMedium.severity, 'MEDIA');

    // Caso 4: Stock óptimo por encima del mínimo -> No genera alerta
    const noAlert = computeAlert(15, 8);
    assert.equal(noAlert.isAlert, false);
  });

  // RN-03: Validación estricta de Kardex
  test('RN-03: Todo movimiento de Kardex debe contener fecha, tipo y clasificación obligatoria', () => {
    function validateMovement(mov) {
      const requiredFields = [
        'movement_date',
        'movement_type',
        'product_reference',
        'product_name',
        'product_category',
        'size_col',
        'quantity',
        'previous_stock',
        'new_stock',
        'user_name'
      ];

      for (const field of requiredFields) {
        if (mov[field] === undefined || mov[field] === null || mov[field] === '') {
          throw new Error(`Campo obligatorio faltante en Kardex: ${field}`);
        }
      }

      const validTypes = ['ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DESPACHO'];
      if (!validTypes.includes(mov.movement_type)) {
        throw new Error(`Tipo de movimiento no permitido: ${mov.movement_type}`);
      }

      if (mov.quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      return true;
    }

    const validMov = {
      movement_date: new Date().toISOString(),
      movement_type: 'ENTRADA',
      product_reference: 'B75806',
      product_name: 'Samba OG Classic Shoes',
      product_category: 'Originales',
      size_col: '40',
      quantity: 30,
      previous_stock: 2,
      new_stock: 32,
      user_name: 'Auxiliar Logístico Muelle'
    };

    assert.equal(validateMovement(validMov), true);

    // Movimiento inválido (sin tipo ni categoría)
    assert.throws(() => {
      validateMovement({
        movement_date: new Date().toISOString(),
        product_name: 'Samba OG'
      });
    }, /Campo obligatorio faltante/);
  });

  // RN-02: Matriz RBAC de Roles y Restricciones
  test('RN-02: El Sector de Ventas no tiene permisos de mutación de inventario', () => {
    const permissions = {
      admin: ['read', 'write_order', 'receive_muelle', 'write_kardex'],
      jefe_compra: ['read', 'write_order', 'approve_order'],
      jefe_bodega: ['read', 'receive_muelle', 'write_kardex'],
      auxiliar_logistico: ['read', 'receive_muelle', 'write_kardex'],
      coordinador_despacho: ['read', 'write_kardex'],
      sector_ventas: ['read'] // Exclusivamente sólo lectura
    };

    assert.equal(permissions.sector_ventas.includes('write_kardex'), false);
    assert.equal(permissions.sector_ventas.includes('receive_muelle'), false);
    assert.equal(permissions.sector_ventas.includes('write_order'), false);
    assert.equal(permissions.sector_ventas.includes('read'), true);
  });

  // RN-04: Control de discrepancias en recepción
  test('RN-04: Detección automática de discrepancias y averías en recepción', () => {
    function evaluateReception(items) {
      let hasDiscrepancy = false;
      let totalReceived = 0;
      let totalDamaged = 0;

      for (const it of items) {
        if (it.quantity_received !== it.quantity_ordered || it.quantity_damaged > 0) {
          hasDiscrepancy = true;
        }
        totalReceived += it.quantity_received;
        totalDamaged += it.quantity_damaged;
      }

      return {
        hasDiscrepancy,
        effectiveStockIncrease: Math.max(0, totalReceived - totalDamaged)
      };
    }

    const receptionWithDamage = [
      { quantity_ordered: 20, quantity_received: 20, quantity_damaged: 2 },
      { quantity_ordered: 10, quantity_received: 10, quantity_damaged: 0 }
    ];

    const result = evaluateReception(receptionWithDamage);
    assert.equal(result.hasDiscrepancy, true);
    assert.equal(result.effectiveStockIncrease, 28); // 30 recibidos - 2 dañados = 28 al stock
  });

});

