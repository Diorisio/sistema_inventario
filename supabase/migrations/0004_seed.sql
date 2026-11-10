-- ==============================================================================
-- SISTEMA DE GESTIÓN DE INVENTARIO Y CADENA DE DISTRIBUCIÓN (ADIDAS)
-- MIGRACIÓN 0004: Datos Semilla (Catálogo de Calzado, Proveedores y Stock Inicial)
-- ==============================================================================

-- 1. Inserción de Proveedores Autorizados
INSERT INTO public.suppliers (id, nit, company_name, contact_name, email, phone, address, city, country)
VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        '800.123.456-1',
        'Adidas Colombia Ltda. (Distribución Central)',
        'Carlos Mendoza',
        'carlos.mendoza@adidas-supply.co',
        '+57 (1) 745-8900',
        'Calle 100 # 19-61, Piso 8',
        'Bogotá D.C.',
        'Colombia'
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        '901.442.889-3',
        'Logística y Calzado Global Andina S.A.S.',
        'Valentina Restrepo',
        'vrestrepo@andina-logistica.com',
        '+57 (4) 448-1234',
        'Zona Franca de Rionegro, Bodega 14',
        'Medellín',
        'Colombia'
    ),
    (
        'a1000000-0000-0000-0000-000000000003',
        '890.312.774-8',
        'Importadora Deportiva del Pacífico S.A.',
        'Julián Domínguez',
        'jdominguez@deportivadelpacifico.com',
        '+57 (2) 660-5522',
        'Avenida Roosevelt # 34-12',
        'Cali',
        'Colombia'
    )
ON CONFLICT (nit) DO NOTHING;

-- 2. Inserción del Catálogo de Calzado Matriz (Siluetas Adidas Icónicas)
INSERT INTO public.products (id, reference_code, name, category, gender, colorway, base_cost, retail_price, image_url, description)
VALUES
    (
        'b2000000-0000-0000-0000-000000000001',
        'B75806',
        'Samba OG Classic Shoes',
        'Originales',
        'Unisex',
        'Cloud White / Core Black / Clear Granite',
        220000.00,
        499900.00,
        'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=600&q=80',
        'El auténtico ícono urbano nacido en las canchas de fútbol sala en los años 50 con parte superior de cuero y puntera de gamuza en T.'
    ),
    (
        'b2000000-0000-0000-0000-000000000002',
        'H06122',
        'Gazelle Indoor Classic',
        'Originales',
        'Unisex',
        'Blue Bird / Footwear White / Gum',
        210000.00,
        479900.00,
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
        'Silueta clásica de gamuza suave con suela de goma translúcida que resalta el legado deportivo retro.'
    ),
    (
        'b2000000-0000-0000-0000-000000000003',
        'HQ6339',
        'Ultraboost Light Corredor Shoes',
        'Corredor',
        'Hombre',
        'Core Black / Cloud White / Solar Red',
        380000.00,
        849900.00,
        'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
        'Máxima amortiguación reactiva con espuma Light BOOST un 30% más ligera para corredores de alto rendimiento.'
    ),
    (
        'b2000000-0000-0000-0000-000000000004',
        'IG5456',
        'Predator Elite FT Firm Ground',
        'Futbol',
        'Hombre',
        'Core Black / Cloud White / Solar Red',
        450000.00,
        999900.00,
        'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80',
        'Botines de fútbol profesionales con aletas Strikeskin de goma y lengüeta plegable para precisión de disparo quirúrgico.'
    ),
    (
        'b2000000-0000-0000-0000-000000000005',
        'FY7756',
        'Forum Low Classic Leather',
        'Originales',
        'Unisex',
        'Cloud White / Royal Blue / Cream White',
        230000.00,
        519900.00,
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
        'Inspiradas en las canchas de básquetbol de 1984 con su característica correa de tobillo en X y acabados en cuero prémium.'
    ),
    (
        'b2000000-0000-0000-0000-000000000006',
        'FX5502',
        'Stan Smith Primegreen',
        'Originales',
        'Unisex',
        'Cloud White / Green',
        190000.00,
        429900.00,
        'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=600&q=80',
        'La zapatilla blanca más icónica del mundo con las 3 tiras perforadas y talón en contraste verde trébol.'
    )
ON CONFLICT (reference_code) DO NOTHING;

-- 3. Inserción de Inventario por Tallas (SKU), incluyendo tallas en Punto Crítico/Bajo para activar Alertas
INSERT INTO public.inventory_items (id, product_id, sku, size_us, size_col, current_stock, stock_minimo, stock_maximo, warehouse_location)
VALUES
    -- Samba OG (B75806)
    ('c3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'SAM-OG-WHT-38', '6.5', '38', 14, 5, 40, 'BOD-CENTRAL-A01-N1'),
    ('c3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'SAM-OG-WHT-39', '7.5', '39', 8,  6, 40, 'BOD-CENTRAL-A01-N2'),
    ('c3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001', 'SAM-OG-WHT-40', '8.5', '40', 2,  8, 50, 'BOD-CENTRAL-A01-N3'), -- ⚠️ ALERTA: Stock Bajo
    ('c3000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', 'SAM-OG-WHT-41', '9.5', '41', 0,  8, 50, 'BOD-CENTRAL-A01-N4'), -- 🚨 ALERTA: Stock Crítico (0)
    ('c3000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000001', 'SAM-OG-WHT-42', '10.5', '42', 12, 6, 40, 'BOD-CENTRAL-A01-N5'),

    -- Gazelle Indoor (H06122)
    ('c3000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002', 'GAZ-IND-BLU-39', '7.5', '39', 18, 5, 35, 'BOD-CENTRAL-A02-N1'),
    ('c3000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000002', 'GAZ-IND-BLU-40', '8.5', '40', 3,  6, 35, 'BOD-CENTRAL-A02-N2'), -- ⚠️ ALERTA: Stock Bajo
    ('c3000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000002', 'GAZ-IND-BLU-41', '9.5', '41', 11, 6, 35, 'BOD-CENTRAL-A02-N3'),

    -- Ultraboost Light (HQ6339)
    ('c3000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000003', 'UB-LGT-BLK-40', '8.5', '40', 20, 5, 30, 'BOD-CENTRAL-B01-N1'),
    ('c3000000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000003', 'UB-LGT-BLK-41', '9.5', '41', 1,  6, 30, 'BOD-CENTRAL-B01-N2'), -- 🚨 ALERTA: Crítico (1 par)
    ('c3000000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000003', 'UB-LGT-BLK-42', '10.5', '42', 15, 6, 30, 'BOD-CENTRAL-B01-N3'),

    -- Predator Elite FG (IG5456)
    ('c3000000-0000-0000-0000-000000000012', 'b2000000-0000-0000-0000-000000000004', 'PRED-ELT-BLK-40', '8.5', '40', 8,  4, 25, 'BOD-CENTRAL-C01-N1'),
    ('c3000000-0000-0000-0000-000000000013', 'b2000000-0000-0000-0000-000000000004', 'PRED-ELT-BLK-41', '9.5', '41', 7,  4, 25, 'BOD-CENTRAL-C01-N2'),

    -- Forum Low Classic (FY7756)
    ('c3000000-0000-0000-0000-000000000014', 'b2000000-0000-0000-0000-000000000005', 'FOR-LOW-WHT-39', '7.5', '39', 16, 5, 40, 'BOD-CENTRAL-D01-N1'),
    ('c3000000-0000-0000-0000-000000000015', 'b2000000-0000-0000-0000-000000000005', 'FOR-LOW-WHT-40', '8.5', '40', 14, 6, 40, 'BOD-CENTRAL-D01-N2')
ON CONFLICT (sku) DO NOTHING;

