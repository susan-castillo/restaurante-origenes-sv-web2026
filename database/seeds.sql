-- Datos de demostración para TODAS las tablas del sistema.
-- Pensado para una base vacía: ejecuta antes database/reset.sql
-- (o usa `node scripts/db-reset.mjs`, que hace ambas cosas).
-- Todos los usuarios tienen la contraseña: Admin1234

BEGIN;

-- Protección: no cargar encima de datos existentes.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM sucursales) THEN
        RAISE EXCEPTION 'La base ya tiene datos. Ejecuta antes database/reset.sql (o node scripts/db-reset.mjs).';
    END IF;
END $$;

-- Función temporal: entero estable entre 0 y n-1 a partir de un texto.
-- Reemplaza a random(), así los datos generados son siempre los mismos.
CREATE FUNCTION pg_temp.h(texto text, n int) RETURNS int AS $$
    SELECT mod(abs(hashtext(texto)::bigint), n)::int;
$$ LANGUAGE sql IMMUTABLE;

-- ---------------------------------------------------------------
-- 1. Sucursales
-- ---------------------------------------------------------------
INSERT INTO sucursales (nombre, direccion) VALUES
    ('Sucursal Central',     'Boulevard de los Héroes, San Salvador'),
    ('Sucursal Escalón',     'Paseo General Escalón, San Salvador'),
    ('Sucursal Santa Tecla', 'Avenida Merliot, Santa Tecla');

-- ---------------------------------------------------------------
-- 2. Usuarios (contraseña de todos: Admin1234)
-- ---------------------------------------------------------------
INSERT INTO usuarios (sucursal_id, nombre, email, password_hash, rol, cargo, salario_base, activo, creado_en)
SELECT (SELECT s.id FROM sucursales s WHERE s.nombre = v.sucursal),
       v.nombre, v.email,
       '$2b$10$6kQTAL/ssz1sU/DvDlZa0uOYVz53tXnUEix2U/ZyNudR6QD03hvlW',
       v.rol, v.cargo, v.salario, v.activo,
       now() - interval '9 months'
FROM (VALUES
    ('Administrador General', 'admin@origenes.sv',               'ADMIN',    'GERENTE', 1500.00, 'Sucursal Central',     true),
    ('Laura Martínez',        'rrhh@origenes.sv',                'RRHH',     'RRHH',           900.00, 'Sucursal Central',     true),
    ('Roberto Hernández',     'gerente.central@origenes.sv',     'ADMIN',    'GERENTE',       1100.00, 'Sucursal Central',     true),
    ('Patricia Villalta',     'gerente.escalon@origenes.sv',     'ADMIN',    'GERENTE',       1100.00, 'Sucursal Escalón',     true),
    ('Ricardo Menjívar',      'gerente.santatecla@origenes.sv',  'ADMIN',    'GERENTE',       1100.00, 'Sucursal Santa Tecla', true),
    ('Usuario Prueba',        'prueba@origenes.sv',              'EMPLEADO', 'CAJERO',         520.00, 'Sucursal Central',     true),
    ('Ana Rivas',             'ana.rivas@origenes.sv',           'EMPLEADO', 'CAJERO',         520.00, 'Sucursal Central',     true),
    ('Carlos Molina',         'carlos.molina@origenes.sv',       'EMPLEADO', 'CAJERO',         520.00, 'Sucursal Escalón',     true),
    ('Sofía Quintanilla',     'sofia.quintanilla@origenes.sv',   'EMPLEADO', 'CAJERO',         520.00, 'Sucursal Escalón',     true),
    ('Diego Alvarado',        'diego.alvarado@origenes.sv',      'EMPLEADO', 'CAJERO',         520.00, 'Sucursal Santa Tecla', true),
    ('Valeria Cruz',          'valeria.cruz@origenes.sv',        'EMPLEADO', 'CAJERO',         520.00, 'Sucursal Santa Tecla', true),
    ('José Flores',           'jose.flores@origenes.sv',         'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Central',     true),
    ('Mariela Guzmán',        'mariela.guzman@origenes.sv',      'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Central',     true),
    ('Kevin Ortiz',           'kevin.ortiz@origenes.sv',         'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Central',     true),
    ('Daniela Pineda',        'daniela.pineda@origenes.sv',      'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Escalón',     true),
    ('Luis Campos',           'luis.campos@origenes.sv',         'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Escalón',     true),
    ('Gabriela Rosales',      'gabriela.rosales@origenes.sv',    'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Santa Tecla', true),
    ('Mauricio Serrano',      'mauricio.serrano@origenes.sv',    'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Santa Tecla', true),
    ('Fernando Aguilar',      'fernando.aguilar@origenes.sv',    'EMPLEADO', 'BARISTA',        480.00, 'Sucursal Escalón',     false)
) AS v(nombre, email, rol, cargo, salario, sucursal, activo);

-- ---------------------------------------------------------------
-- 3. Insumos
-- ---------------------------------------------------------------
INSERT INTO insumos (nombre, unidad) VALUES
    ('Café de especialidad', 'g'),
    ('Leche entera', 'ml'),
    ('Vaso 12oz', 'unidad'),
    ('Vaso 16oz', 'unidad'),
    ('Tapadera', 'unidad'),
    ('Viñeta', 'unidad'),
    ('Jarabe de chocolate', 'ml'),
    ('Jarabe de caramelo', 'ml'),
    ('Té chai concentrado', 'ml'),
    ('Hielo', 'g'),
    ('Croissant', 'unidad'),
    ('Pan de molde', 'unidad'),
    ('Jamón', 'g'),
    ('Queso mozzarella', 'g'),
    ('Harina de trigo', 'g'),
    ('Huevo', 'unidad'),
    ('Mantequilla', 'g'),
    ('Botella de agua 500ml', 'unidad'),
    ('Gaseosa en lata', 'unidad'),
    ('Jugo de naranja 300ml', 'unidad'),
    ('Galletas de avena', 'unidad'),
    ('Barra de chocolate', 'unidad'),
    ('Café molido 250g', 'unidad');

-- ---------------------------------------------------------------
-- 4. Menú: 12 elaborados activos, 6 de reventa y 1 elaborado desactivado
-- ---------------------------------------------------------------
INSERT INTO platillos (nombre, categoria, precio, tipo, activo) VALUES
    ('Espresso',                   'Bebidas calientes', 1.75, 'ELABORADO', true),
    ('Americano',                  'Bebidas calientes', 2.00, 'ELABORADO', true),
    ('Cappuccino',                 'Bebidas calientes', 2.75, 'ELABORADO', true),
    ('Latte Grande',               'Bebidas calientes', 3.50, 'ELABORADO', true),
    ('Mocha',                      'Bebidas calientes', 3.75, 'ELABORADO', true),
    ('Chocolate caliente',         'Bebidas calientes', 3.25, 'ELABORADO', true),
    ('Latte frío',                 'Bebidas frías',     3.75, 'ELABORADO', true),
    ('Frappé de caramelo',         'Bebidas frías',     4.25, 'ELABORADO', true),
    ('Té chai latte',              'Bebidas frías',     3.50, 'ELABORADO', true),
    ('Croissant de jamón y queso', 'Comida',            3.75, 'ELABORADO', true),
    ('Sándwich de jamón y queso',  'Comida',            4.50, 'ELABORADO', true),
    ('Pancakes',                   'Comida',            5.00, 'ELABORADO', true),
    ('Botella de agua',            'Empacados',         1.00, 'REVENTA',   true),
    ('Gaseosa en lata',            'Empacados',         1.25, 'REVENTA',   true),
    ('Jugo de naranja',            'Empacados',         1.75, 'REVENTA',   true),
    ('Galletas de avena',          'Empacados',         1.50, 'REVENTA',   true),
    ('Barra de chocolate',         'Empacados',         1.25, 'REVENTA',   true),
    ('Café molido 250g',           'Empacados',         8.50, 'REVENTA',   true),
    ('Pumpkin Spice Latte',        'Bebidas calientes', 4.50, 'ELABORADO', false);

-- ---------------------------------------------------------------
-- 5. Recetas. Los de reventa llevan una receta de un solo insumo con
--    cantidad 1, así descontarInventario los trata igual que a los elaborados.
-- ---------------------------------------------------------------
INSERT INTO recetas (platillo_id, insumo_id, cantidad)
SELECT p.id, i.id, v.cantidad
FROM (VALUES
    ('Espresso', 'Café de especialidad', 18),
    ('Espresso', 'Vaso 12oz', 1),
    ('Espresso', 'Tapadera', 1),
    ('Espresso', 'Viñeta', 1),

    ('Americano', 'Café de especialidad', 18),
    ('Americano', 'Vaso 12oz', 1),
    ('Americano', 'Tapadera', 1),
    ('Americano', 'Viñeta', 1),

    ('Cappuccino', 'Café de especialidad', 18),
    ('Cappuccino', 'Leche entera', 150),
    ('Cappuccino', 'Vaso 12oz', 1),
    ('Cappuccino', 'Tapadera', 1),
    ('Cappuccino', 'Viñeta', 1),

    ('Latte Grande', 'Café de especialidad', 18),
    ('Latte Grande', 'Leche entera', 250),
    ('Latte Grande', 'Vaso 16oz', 1),
    ('Latte Grande', 'Tapadera', 1),
    ('Latte Grande', 'Viñeta', 1),

    ('Mocha', 'Café de especialidad', 18),
    ('Mocha', 'Leche entera', 200),
    ('Mocha', 'Jarabe de chocolate', 30),
    ('Mocha', 'Vaso 16oz', 1),
    ('Mocha', 'Tapadera', 1),
    ('Mocha', 'Viñeta', 1),

    ('Chocolate caliente', 'Jarabe de chocolate', 40),
    ('Chocolate caliente', 'Leche entera', 250),
    ('Chocolate caliente', 'Vaso 16oz', 1),
    ('Chocolate caliente', 'Tapadera', 1),
    ('Chocolate caliente', 'Viñeta', 1),

    ('Latte frío', 'Café de especialidad', 18),
    ('Latte frío', 'Leche entera', 200),
    ('Latte frío', 'Hielo', 150),
    ('Latte frío', 'Vaso 16oz', 1),
    ('Latte frío', 'Tapadera', 1),
    ('Latte frío', 'Viñeta', 1),

    ('Frappé de caramelo', 'Café de especialidad', 18),
    ('Frappé de caramelo', 'Leche entera', 150),
    ('Frappé de caramelo', 'Jarabe de caramelo', 30),
    ('Frappé de caramelo', 'Hielo', 200),
    ('Frappé de caramelo', 'Vaso 16oz', 1),
    ('Frappé de caramelo', 'Tapadera', 1),
    ('Frappé de caramelo', 'Viñeta', 1),

    ('Té chai latte', 'Té chai concentrado', 100),
    ('Té chai latte', 'Leche entera', 200),
    ('Té chai latte', 'Vaso 16oz', 1),
    ('Té chai latte', 'Tapadera', 1),
    ('Té chai latte', 'Viñeta', 1),

    ('Croissant de jamón y queso', 'Croissant', 1),
    ('Croissant de jamón y queso', 'Jamón', 40),
    ('Croissant de jamón y queso', 'Queso mozzarella', 30),

    ('Sándwich de jamón y queso', 'Pan de molde', 2),
    ('Sándwich de jamón y queso', 'Jamón', 50),
    ('Sándwich de jamón y queso', 'Queso mozzarella', 40),

    ('Pancakes', 'Harina de trigo', 120),
    ('Pancakes', 'Huevo', 1),
    ('Pancakes', 'Leche entera', 100),
    ('Pancakes', 'Mantequilla', 15),

    ('Botella de agua', 'Botella de agua 500ml', 1),
    ('Gaseosa en lata', 'Gaseosa en lata', 1),
    ('Jugo de naranja', 'Jugo de naranja 300ml', 1),
    ('Galletas de avena', 'Galletas de avena', 1),
    ('Barra de chocolate', 'Barra de chocolate', 1),
    ('Café molido 250g', 'Café molido 250g', 1),

    ('Pumpkin Spice Latte', 'Café de especialidad', 18),
    ('Pumpkin Spice Latte', 'Leche entera', 250),
    ('Pumpkin Spice Latte', 'Jarabe de caramelo', 30),
    ('Pumpkin Spice Latte', 'Vaso 16oz', 1),
    ('Pumpkin Spice Latte', 'Tapadera', 1),
    ('Pumpkin Spice Latte', 'Viñeta', 1)
) AS v(platillo, insumo, cantidad)
JOIN platillos p ON p.nombre = v.platillo
JOIN insumos i ON i.nombre = v.insumo;

-- ---------------------------------------------------------------
-- 6. Inventario por sucursal (foto del stock de hoy)
--    Central 100%, Escalón 70%, Santa Tecla 50% del stock base.
-- ---------------------------------------------------------------
INSERT INTO inventario_sucursal (sucursal_id, insumo_id, stock_actual, stock_minimo)
SELECT s.id, i.id,
       ROUND(v.stock * CASE s.nombre
                           WHEN 'Sucursal Central' THEN 1.0
                           WHEN 'Sucursal Escalón' THEN 0.7
                           ELSE 0.5
                       END),
       v.minimo
FROM (VALUES
    ('Café de especialidad',   5000, 1000),
    ('Leche entera',          20000, 4000),
    ('Vaso 12oz',               500,  100),
    ('Vaso 16oz',               500,  100),
    ('Tapadera',               1000,  200),
    ('Viñeta',                 1000,  200),
    ('Jarabe de chocolate',    2000,  500),
    ('Jarabe de caramelo',      150,  500),
    ('Té chai concentrado',    3000,  500),
    ('Hielo',                 30000, 5000),
    ('Croissant',                60,   15),
    ('Pan de molde',            100,   20),
    ('Jamón',                  3000,  500),
    ('Queso mozzarella',       3000,  500),
    ('Harina de trigo',        5000, 1000),
    ('Huevo',                   120,   30),
    ('Mantequilla',            2000,  300),
    ('Botella de agua 500ml',   120,   24),
    ('Gaseosa en lata',         120,   24),
    ('Jugo de naranja 300ml',    60,   12),
    ('Galletas de avena',        60,   12),
    ('Barra de chocolate',       80,   15),
    ('Café molido 250g',         30,    6)
) AS v(insumo, stock, minimo)
JOIN insumos i ON i.nombre = v.insumo
CROSS JOIN sucursales s;

-- Alertas de stock para la demo. El jarabe de caramelo ya queda bajo el
-- mínimo en las 3 sucursales; estos son los casos adicionales.
UPDATE inventario_sucursal inv
SET stock_actual = o.stock
FROM (VALUES
    ('Sucursal Escalón',     'Huevo',      20),
    ('Sucursal Santa Tecla', 'Vaso 12oz',  12),
    ('Sucursal Santa Tecla', 'Croissant',  10)
) AS o(sucursal, insumo, stock)
JOIN sucursales s ON s.nombre = o.sucursal
JOIN insumos i ON i.nombre = o.insumo
WHERE inv.sucursal_id = s.id AND inv.insumo_id = i.id;

-- ---------------------------------------------------------------
-- 7. Proveedores
-- ---------------------------------------------------------------
INSERT INTO proveedores (nombre, nit) VALUES
    ('Café Cumbre Salvadoreña, S.A. de C.V.',           '0614-010101-101-1'),
    ('Lácteos del Valle, S.A. de C.V.',                 '0614-020202-102-2'),
    ('Empaques y Desechables SV, S.A. de C.V.',         '0614-030303-103-3'),
    ('Distribuidora El Trigal, S.A. de C.V.',           '0614-040404-104-4'),
    ('Bebidas y Snacks Cuscatlán, S.A. de C.V.',        '0614-050505-105-5'),
    ('Sabores y Jarabes Centroamericana, S.A. de C.V.', '0614-060606-106-6');

-- ---------------------------------------------------------------
-- 8. Compras: por sucursal y proveedor, una hace ~50 días y otra hace ~8 días.
--    Las antiguas están pagadas (salvo una vencida en Santa Tecla); las
--    recientes quedan como cuentas por pagar pendientes.
-- ---------------------------------------------------------------
-- Qué vende cada proveedor (número de proveedor según el orden de arriba)
CREATE TEMP TABLE tmp_catalogo_compra (
    prov int, insumo text, costo numeric(10,4), cantidad numeric(12,3)
) ON COMMIT DROP;

INSERT INTO tmp_catalogo_compra (prov, insumo, costo, cantidad) VALUES
    (1, 'Café de especialidad',     0.0220,  3000),
    (1, 'Café molido 250g',         4.8000,    24),
    (2, 'Leche entera',             0.0013, 12000),
    (2, 'Mantequilla',              0.0085,  1500),
    (2, 'Queso mozzarella',         0.0095,  2000),
    (3, 'Vaso 12oz',                0.0900,   300),
    (3, 'Vaso 16oz',                0.1100,   300),
    (3, 'Tapadera',                 0.0400,   600),
    (3, 'Viñeta',                   0.0150,   600),
    (4, 'Croissant',                0.6500,    40),
    (4, 'Pan de molde',             0.1200,    60),
    (4, 'Jamón',                    0.0090,  2000),
    (4, 'Harina de trigo',          0.0012,  3000),
    (4, 'Huevo',                    0.1300,    90),
    (5, 'Botella de agua 500ml',    0.3500,    96),
    (5, 'Gaseosa en lata',          0.5000,    96),
    (5, 'Jugo de naranja 300ml',    0.8000,    48),
    (5, 'Galletas de avena',        0.6000,    48),
    (5, 'Barra de chocolate',       0.5500,    48),
    (6, 'Jarabe de chocolate',      0.0090,  2000),
    (6, 'Jarabe de caramelo',       0.0095,  2000),
    (6, 'Té chai concentrado',      0.0070,  3000),
    (6, 'Hielo',                    0.0008, 20000);

INSERT INTO compras (sucursal_id, proveedor_id, numero_factura, total, estado_pago,
                     fecha_vencimiento, creado_en, fecha_pago)
SELECT b.sucursal_id, b.proveedor_id, b.factura, 0, b.estado,
       b.fecha::date + 30,
       b.fecha,
       CASE WHEN b.estado = 'PAGADA' THEN b.fecha::date + 15 END
FROM (
    SELECT s.id AS sucursal_id, pr.id AS proveedor_id,
           'FAC-' || lpad(pr.idx::text, 2, '0') || lpad(s.idx::text, 2, '0')
                  || '-' || lpad(k.n::text, 3, '0') AS factura,
                      (current_date - (CASE k.n WHEN 1 THEN 50 ELSE 8 END) - pr.idx::int)::timestamp
               + interval '9 hours 30 minutes' AS fecha,
           CASE WHEN k.n = 1 AND NOT (pr.idx = 6 AND s.nombre = 'Sucursal Santa Tecla')
                THEN 'PAGADA' ELSE 'PENDIENTE' END AS estado
    FROM (SELECT id, nombre, row_number() OVER (ORDER BY id) AS idx FROM sucursales) s
    CROSS JOIN (SELECT id, row_number() OVER (ORDER BY id) AS idx FROM proveedores) pr
    CROSS JOIN (VALUES (1), (2)) AS k(n)
) b;

INSERT INTO detalle_compra (compra_id, insumo_id, cantidad, costo_unitario)
SELECT c.id, i.id,
       ROUND(cat.cantidad * CASE s.nombre
                                WHEN 'Sucursal Central' THEN 1.0
                                WHEN 'Sucursal Escalón' THEN 0.7
                                ELSE 0.5
                            END),
       ROUND(cat.costo * CASE WHEN c.creado_en < now() - interval '30 days' THEN 1.00 ELSE 1.03 END, 4)
FROM compras c
JOIN sucursales s ON s.id = c.sucursal_id
JOIN (SELECT id, row_number() OVER (ORDER BY id) AS idx FROM proveedores) pr ON pr.id = c.proveedor_id
JOIN tmp_catalogo_compra cat ON cat.prov = pr.idx
JOIN insumos i ON i.nombre = cat.insumo;

UPDATE compras c
SET total = d.t
FROM (SELECT compra_id, ROUND(SUM(cantidad * costo_unitario), 2) AS t
      FROM detalle_compra GROUP BY compra_id) d
WHERE d.compra_id = c.id;

-- ---------------------------------------------------------------
-- 9. Turnos de caja
--    Últimos 14 días: 2 turnos por día y sucursal (7-14 h y 14-21 h), cerrados.
--    Escalón y Santa Tecla tienen un turno ABIERTO hace 2 horas.
--    Sucursal Central NO tiene turno abierto, para practicar la apertura de caja.
-- ---------------------------------------------------------------
INSERT INTO turnos_caja (sucursal_id, usuario_id, monto_inicial, abierto_en, cerrado_en, estado)
SELECT s.id, c.id, 100.00, g.dia + t.ini, g.dia + t.fin, 'CERRADO'
FROM sucursales s
CROSS JOIN (SELECT n, (current_date - n)::timestamp AS dia FROM generate_series(1, 14) AS n) g
CROSS JOIN (VALUES (1, interval '7 hours',  interval '14 hours'),
                   (2, interval '14 hours', interval '21 hours')) AS t(turno, ini, fin)
JOIN (
    SELECT u.id, u.sucursal_id,
           row_number() OVER (PARTITION BY u.sucursal_id ORDER BY u.id) - 1 AS pos
    FROM usuarios u
    WHERE u.cargo = 'CAJERO' AND u.activo
) c ON c.sucursal_id = s.id AND c.pos = (g.n + t.turno) % 2;

INSERT INTO turnos_caja (sucursal_id, usuario_id, monto_inicial, abierto_en, estado)
SELECT s.id, c.id, 100.00, now()::timestamp - interval '2 hours', 'ABIERTO'
FROM sucursales s
JOIN (
    SELECT u.id, u.sucursal_id,
           row_number() OVER (PARTITION BY u.sucursal_id ORDER BY u.id) - 1 AS pos
    FROM usuarios u
    WHERE u.cargo = 'CAJERO' AND u.activo
) c ON c.sucursal_id = s.id AND c.pos = 0
WHERE s.nombre IN ('Sucursal Escalón', 'Sucursal Santa Tecla');

-- ---------------------------------------------------------------
-- 10. Ventas: de 6 a 14 por turno cerrado y de 4 a 6 por turno abierto,
--     repartidas a lo largo del turno.
--     85% facturas de consumidor final y 15% CCF; pagos: 55% efectivo,
--     30% tarjeta, 10% Chivo Wallet y 5% Bitcoin.
-- ---------------------------------------------------------------
CREATE TEMP TABLE tmp_ventas ON COMMIT DROP AS
SELECT t.id AS turno_id, t.sucursal_id, t.usuario_id, g.n AS orden,
       t.abierto_en
           + (COALESCE(t.cerrado_en, now()::timestamp) - t.abierto_en) * ((g.n - 0.5) / q.total)::float8
           + pg_temp.h('jit' || t.id || ':' || g.n, 6) * interval '1 minute' AS creado_en,
       CASE WHEN pg_temp.h('td' || t.id || ':' || g.n, 100) < 15 THEN 'CCF' ELSE 'FACTURA' END AS tipo_doc,
       CASE
           WHEN m.r < 55 THEN 'EFECTIVO'
           WHEN m.r < 85 THEN 'TARJETA'
           ELSE 'BITCOIN'
       END AS metodo_pago
FROM turnos_caja t
CROSS JOIN LATERAL (
    SELECT CASE WHEN t.estado = 'ABIERTO'
                THEN 4 + pg_temp.h('nv' || t.id, 3)
                ELSE 6 + pg_temp.h('nv' || t.id, 9)
           END AS total
) q
CROSS JOIN LATERAL generate_series(1, q.total) AS g(n)
CROSS JOIN LATERAL (SELECT pg_temp.h('mp' || t.id || ':' || g.n, 100) AS r) m;

-- El correlativo es por sucursal y tipo de documento, en orden cronológico.
-- Los totales se calculan después, a partir del detalle.
INSERT INTO ventas (sucursal_id, turno_id, usuario_id, tipo_doc, numero, metodo_pago,
                    cliente_nombre, cliente_nit, cliente_nrc, subtotal, iva, total, creado_en)
SELECT tv.sucursal_id, tv.turno_id, tv.usuario_id, tv.tipo_doc,
       row_number() OVER (PARTITION BY tv.sucursal_id, tv.tipo_doc
                          ORDER BY tv.creado_en, tv.turno_id, tv.orden),
       tv.metodo_pago,
       CASE WHEN tv.tipo_doc = 'CCF' THEN (ARRAY[
           'Constructora Pacífico, S.A. de C.V.',
           'Clínica Dental Sonrisas, S.A. de C.V.',
           'Despacho Jurídico Rivera & Asociados',
           'Agencia Publicitaria Colibrí, S.A. de C.V.',
           'Colegio Bilingüe Los Pinos',
           'Hotel Boutique Mirador, S.A. de C.V.'])[cl.idx] END,
       CASE WHEN tv.tipo_doc = 'CCF' THEN (ARRAY[
           '0614-110190-101-1', '0614-220291-102-2', '0614-330392-103-3',
           '0614-440493-104-4', '0614-550594-105-5', '0614-660695-106-6'])[cl.idx] END,
       CASE WHEN tv.tipo_doc = 'CCF' THEN (ARRAY[
           '123456-1', '234567-2', '345678-3', '456789-4', '567890-5', '678901-6'])[cl.idx] END,
       0, 0, 0,
       tv.creado_en
FROM tmp_ventas tv
CROSS JOIN LATERAL (
    SELECT 1 + pg_temp.h('cl' || tv.turno_id || ':' || tv.orden, 6) AS idx
) cl;

-- Detalle: de 1 a 4 platillos activos por venta, de 1 a 3 unidades cada uno.
INSERT INTO detalle_venta (venta_id, platillo_id, cantidad, precio_unitario)
SELECT DISTINCT ON (v.id, pick.id)
       v.id, pick.id,
       1 + pg_temp.h('q' || v.id || ':' || l.n, 3),
       pick.precio
FROM ventas v
CROSS JOIN LATERAL generate_series(1, 1 + pg_temp.h('ln' || v.id, 4)) AS l(n)
CROSS JOIN LATERAL (
    SELECT p.id, p.precio
    FROM platillos p
    WHERE p.activo
    ORDER BY md5(v.id::text || ':' || l.n::text || ':' || p.id::text)
    LIMIT 1
) pick
ORDER BY v.id, pick.id;

-- Totales: los precios del menú se toman SIN IVA; el 13% se suma encima.
UPDATE ventas v
SET subtotal = s.sub,
    iva      = ROUND(s.sub * 0.13, 2),
    total    = s.sub + ROUND(s.sub * 0.13, 2)
FROM (SELECT venta_id, SUM(cantidad * precio_unitario) AS sub
      FROM detalle_venta GROUP BY venta_id) s
WHERE s.venta_id = v.id;

-- Cierre de caja: efectivo contado = fondo inicial + ventas en efectivo,
-- con algunos descuadres pequeños para ver el arqueo en la demo.
UPDATE turnos_caja t
SET efectivo_contado = t.monto_inicial
    + COALESCE((SELECT SUM(v.total) FROM ventas v
                WHERE v.turno_id = t.id AND v.metodo_pago = 'EFECTIVO'), 0)
    + CASE WHEN t.id % 7 = 0 THEN -1.50
           WHEN t.id % 11 = 0 THEN 0.75
           ELSE 0 END
WHERE t.estado = 'CERRADO';

-- ---------------------------------------------------------------
-- 11. Planilla quincenal: las últimas 6 quincenas ya vencidas, para cada
--     empleado activo.
--     ISSS 3% y AFP 7.25% sobre el bruto de la quincena. Renta según la
--     tabla quincenal del Decreto Ejecutivo No. 10 (abril 2025), sobre el
--     bruto menos ISSS y AFP.
-- ---------------------------------------------------------------
WITH meses AS (
    SELECT (date_trunc('month', current_date)::date - make_interval(months => n))::date AS inicio
    FROM generate_series(0, 3) AS n
),
periodos AS (
    SELECT EXTRACT(YEAR FROM fecha)::int AS anio,
           EXTRACT(MONTH FROM fecha)::int AS mes,
           quincena, fecha
    FROM (
        SELECT 1 AS quincena, inicio + 14 AS fecha FROM meses
        UNION ALL
        SELECT 2, (inicio + interval '1 month' - interval '1 day')::date FROM meses
    ) q
    WHERE fecha < current_date
    ORDER BY fecha DESC
    LIMIT 6
),
base AS (
    SELECT u.id AS usuario_id, p.anio, p.mes, p.quincena, p.fecha,
           ROUND(u.salario_base / 2, 2)          AS bruto,
           ROUND(u.salario_base / 2 * 0.03, 2)   AS isss,
           ROUND(u.salario_base / 2 * 0.0725, 2) AS afp
    FROM usuarios u
    CROSS JOIN periodos p
    WHERE u.activo
),
con_renta AS (
    SELECT b.*,
           CASE
               WHEN b.bruto - b.isss - b.afp <= 275.00  THEN 0
               WHEN b.bruto - b.isss - b.afp <= 447.62  THEN ROUND((b.bruto - b.isss - b.afp - 275.00)  * 0.10 + 8.83, 2)
               WHEN b.bruto - b.isss - b.afp <= 1019.05 THEN ROUND((b.bruto - b.isss - b.afp - 447.62)  * 0.20 + 30.00, 2)
               ELSE ROUND((b.bruto - b.isss - b.afp - 1019.05) * 0.30 + 144.28, 2)
           END AS renta
    FROM base b
)
INSERT INTO pagos_planilla (usuario_id, anio, mes, quincena, salario_bruto, isss, afp, renta,
                            salario_neto, fecha_pago)
SELECT usuario_id, anio, mes, quincena, bruto, isss, afp, renta,
       bruto - isss - afp - renta,
       fecha + time '15:00'
FROM con_renta;

COMMIT;