-- =====================================================
-- BDF: restaurante_sv (PostgreSQL) - Sistema Centralizado Multi-Sucursal
-- Total de tablas: 13
-- Ejecución: Crear la BD primero y luego conectarse (\c restaurante_sv)
-- =====================================================

CREATE DATABASE restaurante_sv;
-- \c restaurante_sv

-- =====================================================
-- MÓDULO 00: INFRAESTRUCTURA Y MULTI-SUCURSAL
-- =====================================================

-- Tabla 1: SUCURSALES (Franquicias / Locales físicos)
-- Almacena las sedes operativas de la empresa en El Salvador.
CREATE TABLE sucursales (
    id SERIAL PRIMARY KEY,                     -- Identificador único de la sucursal
    nombre VARCHAR(100) NOT NULL,              -- Nombre público (Ej: 'Sucursal Escalón', 'Sucursal Tecla')
    direccion VARCHAR(200),                    -- Ubicación física del local
    activa BOOLEAN NOT NULL DEFAULT TRUE       -- Permite 'desactivar' un local sin borrar su historial
);

-- Tabla 2: USUARIOS (Login, Roles y Asignación Institucional)
-- Controla el acceso al sistema y la pertenencia de empleados a sucursales.
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,                     -- Identificador único del usuario/empleado
    sucursal_id INT REFERENCES sucursales(id), -- NULL = Admin Central (acceso global a todas las sedes)
    nombre VARCHAR(100) NOT NULL,              -- Nombre completo del empleado
    email VARCHAR(100) UNIQUE NOT NULL,        -- Credencial de acceso única para Login
    password_hash VARCHAR(255) NOT NULL,       -- Contraseña encriptada (bcrypt) por seguridad
    rol VARCHAR(20) NOT NULL DEFAULT 'EMPLEADO'
        CHECK (rol IN ('ADMIN', 'RRHH', 'EMPLEADO')), -- Control de Acceso Basado en Roles (RBAC)
    cargo VARCHAR(20) NOT NULL DEFAULT 'BARISTA'
    	CHECK (cargo IN ('BARISTA', 'CAJERO', 'GERENTE', 'RRHH')),
    salario_base NUMERIC(8, 2) NOT NULL DEFAULT 600.00 CHECK (salario_base > 0), -- Base para la planilla quincenal
    activo BOOLEAN NOT NULL DEFAULT TRUE,      -- Permite dar de baja un usuario sin romper llaves foráneas
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Registro de auditoría de creación
);

-- =====================================================
-- MÓDULO 02: MENÚ, INSUMOS Y RECETAS (Catálogos Centrales)
-- =====================================================

-- Tabla 3: PLATILLOS (Catálogo Unificado del Menú)
-- Todos los productos comercializables en la pantalla del POS.
CREATE TABLE platillos (
    id SERIAL PRIMARY KEY,                     -- Identificador único del platillo
    nombre VARCHAR(100) NOT NULL,              -- Nombre comercial (Ej: 'Latte Grande 16oz', 'Pupusas')
    categoria VARCHAR(50),                     -- Agrupador para la UI del POS ('Bebidas', 'Postres')
    precio NUMERIC(8, 2) NOT NULL CHECK (precio >= 0), -- Precio de venta al público (IVA incluido)
    activo BOOLEAN NOT NULL DEFAULT true,       -- Controla la visibilidad del plato en la caja POS
    tipo VARCHAR(10) NOT NULL DEFAULT 'ELABORADO'
    	CHECK (tipo IN ('ELABORADO', 'REVENTA')),
    imagen VARCHAR(255) DEFAULT NULL              -- URL de la imagen del platillo
);

-- Tabla 4: INSUMOS (Catálogo Global de Materia Prima / Ingredientes)
-- Define los insumos que compra la empresa a nivel central.
CREATE TABLE insumos (
    id SERIAL PRIMARY KEY,                     -- Identificador único del insumo
    nombre VARCHAR(100) NOT NULL UNIQUE,       -- Nombre del insumo (Ej: 'Café en Grano', 'Leche Entera')
    unidad VARCHAR(10) NOT NULL CHECK (unidad IN ('g', 'ml', 'unidad')) -- Unidad de medida estándar
);

-- Tabla 5: RECETAS (Matriz de Deducción por Platillo)
-- Relaciona qué cantidad de cada insumo consume la preparación de un platillo.
CREATE TABLE recetas (
    platillo_id INT NOT NULL REFERENCES platillos(id) ON DELETE CASCADE, -- Plato que se vende
    insumo_id INT NOT NULL REFERENCES insumos(id),                       -- Insumo que consume
    cantidad NUMERIC(12, 3) NOT NULL CHECK (cantidad > 0),               -- Medida exacta según la unidad del insumo
    PRIMARY KEY (platillo_id, insumo_id)                                 -- Llave primaria compuesta: evita duplicar el mismo insumo en una receta
);

-- Tabla 6: INVENTARIO POR SUCURSAL (Bodega Local)
-- Controla la existencia física en tiempo real de cada insumo por cada local.
CREATE TABLE inventario_sucursal (
    sucursal_id INT NOT NULL REFERENCES sucursales(id),                 -- Local donde reside el stock
    insumo_id INT NOT NULL REFERENCES insumos(id),                       -- Insumo almacenado
    stock_actual NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0), -- Existencia física actual (no permite negativos)
    stock_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0,                     -- Umbral para emitir alerta de reabastecimiento
    PRIMARY KEY (sucursal_id, insumo_id)                                 -- Llave primaria compuesta: garantiza 1 registro de stock por insumo/sucursal
);

-- =====================================================
-- MÓDULO 04: CAJA Y TURNOS (Operación Diaria)
-- =====================================================

-- Tabla 7: TURNOS DE CAJA (Control de Flujo de Efectivo)
-- Registra las aperturas y cierres de la caja registradora por cajero y local.
CREATE TABLE turnos_caja (
    id SERIAL PRIMARY KEY,                     -- Identificador único del turno de caja
    sucursal_id INT NOT NULL REFERENCES sucursales(id), -- Sucursal donde opera la caja
    usuario_id INT NOT NULL REFERENCES usuarios(id),   -- Cajero responsable del turno
    monto_inicial NUMERIC(10, 2) NOT NULL CHECK (monto_inicial >= 0), -- Fondo base entregado al abrir
    abierto_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- Fecha y hora de apertura
    cerrado_en TIMESTAMP,                              -- Fecha y hora de cierre (NULL indica turno activo)
    efectivo_contado NUMERIC(10, 2),                   -- Arqueo final reportado por el cajero al cerrar
    estado VARCHAR(10) NOT NULL DEFAULT 'ABIERTO'
        CHECK (estado IN ('ABIERTO', 'CERRADO'))       -- Estado operativo del turno
);

-- =====================================================
-- MÓDULO 01: VENTAS Y FACTURACIÓN (Cumplimiento El Salvador)
-- =====================================================

-- Tabla 8: VENTAS (Cabecera de Comprobante Fiscal)
-- Emisión de Factura de Consumidor Final o Crédito Fiscal (CCF).
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,                     -- Identificador único interno del sistema
    sucursal_id INT NOT NULL REFERENCES sucursales(id), -- Sucursal emisora del documento
    turno_id INT NOT NULL REFERENCES turnos_caja(id),   -- Turno de caja en el que se procesó el pago
    usuario_id INT NOT NULL REFERENCES usuarios(id),   -- Cajero/Mesero que realizó la venta
    tipo_doc VARCHAR(10) NOT NULL CHECK (tipo_doc IN ('FACTURA', 'CCF')), -- Normativa tributaria SV
    numero INT NOT NULL,                       -- Correlativo físico/electrónico del documento
    metodo_pago VARCHAR(10) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'BITCOIN')), -- Formas de pago aceptadas
    cliente_nombre VARCHAR(150),               -- Datos obligatorios para Crédito Fiscal (CCF)
    cliente_nit VARCHAR(20),                   -- NIT del cliente para CCF
    cliente_nrc VARCHAR(20),                   -- Registro de Contribuyente (NRC) para CCF
    subtotal NUMERIC(10, 2) NOT NULL,          -- Monto neto de la venta
    iva NUMERIC(10, 2) NOT NULL,               -- Impuesto al Valor Agregado (13% El Salvador)
    total NUMERIC(10, 2) NOT NULL,             -- Total cobrado al cliente
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp oficial de transacción
    UNIQUE (sucursal_id, tipo_doc, numero),    -- Impide duplicar secuencias de facturación en la misma sucursal
    CHECK (tipo_doc <> 'CCF' OR (cliente_nombre IS NOT NULL
                                 AND cliente_nit IS NOT NULL
                                 AND cliente_nrc IS NOT NULL)) -- Garantiza integridad legal: CCF requiere datos del contribuyente
);

-- Tabla 9: DETALLE DE VENTA (Renglones del Comprobante)
-- Detalla cada platillo vendido en una transacción de venta.
CREATE TABLE detalle_venta (
    id SERIAL PRIMARY KEY,                     -- Identificador del renglón de venta
    venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE, -- Transacción padre
    platillo_id INT NOT NULL REFERENCES platillos(id),             -- Platillo vendido
    cantidad INT NOT NULL CHECK (cantidad > 0),                    -- Unidades vendidas
    precio_unitario NUMERIC(8, 2) NOT NULL     -- Mantiene el histórico del precio vendido (inmunidad a cambios de menú)
);

-- =====================================================
-- MÓDULO 03: COMPRAS Y PROVEEDORES (Cuentas por Pagar)
-- =====================================================

-- Tabla 10: PROVEEDORES (Directorio Central de Compras)
-- Empresas que abastecen de insumos al negocio.
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,                     -- Identificador único del proveedor
    nombre VARCHAR(100) NOT NULL,              -- Razon social (Ej: 'Distribuidora Láctea S.A.')
    nit VARCHAR(20)                            -- Identificación tributaria del proveedor
);

-- Tabla 11: COMPRAS (Cabecera de Factura de Proveedor)
-- Registra el ingreso de compras y control de pasivos a crédito.
CREATE TABLE compras (
    id SERIAL PRIMARY KEY,                     -- Identificador interno de la compra
    sucursal_id INT NOT NULL REFERENCES sucursales(id), -- Sucursal/bodega receptora del pedido
    proveedor_id INT NOT NULL REFERENCES proveedores(id), -- Proveedor emisor
    numero_factura VARCHAR(30) NOT NULL,       -- Número de comprobante físico emitido por el proveedor
    total NUMERIC(10, 2) NOT NULL,             -- Costo total de la compra
    estado_pago VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado_pago IN ('PENDIENTE', 'PAGADA')), -- Control de cuentas por pagar
    fecha_vencimiento DATE,                    -- Fecha límite de pago para compras a crédito
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Registro de ingreso al sistema
    fecha_pago DATE    -- NULL mientras la compra esté pendiente
);

-- Tabla 12: DETALLE DE COMPRA (Insumos Ingresados)
-- Desglosa los insumos comprados para incrementar el stock local.
CREATE TABLE detalle_compra (
    id SERIAL PRIMARY KEY,                     -- Identificador del renglón de compra
    compra_id INT NOT NULL REFERENCES compras(id) ON DELETE CASCADE, -- Compra padre
    insumo_id INT NOT NULL REFERENCES insumos(id),                   -- Insumo recibido
    cantidad NUMERIC(12, 3) NOT NULL CHECK (cantidad > 0),          -- Cantidad ingresada al inventario
    costo_unitario NUMERIC(10, 4) NOT NULL     -- Costo de adquisición (soporta precisión de 4 decimales)
);

-- =====================================================
-- MÓDULO 05: PLANILLA QUINCENAL (Leyes Laborales SV)
-- =====================================================

-- Tabla 13: PAGOS DE PLANILLA (Histórico de Nómina)
-- Consolida los pagos quincenales aplicando retenciones de ley El Salvador (ISSS, AFP, Renta).
CREATE TABLE pagos_planilla (
    id SERIAL PRIMARY KEY,                     -- Identificador del comprobante de pago
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, -- Empleado receptor del pago
    anio INT NOT NULL CHECK (anio >= 2026),     -- Año de procesamiento
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12), -- Mes procesado (1 - 12)
    quincena INT NOT NULL CHECK (quincena IN (1, 2)), -- 1 = Primera Quincena / 2 = Segunda Quincena
    salario_bruto NUMERIC(8, 2) NOT NULL,      -- Base devengada en el periodo (Salario Base / 2)
    isss NUMERIC(6, 2) NOT NULL,               -- Retención ISSS (3% con tope legal)
    afp NUMERIC(6, 2) NOT NULL,                -- Retención AFP (7.25%)
    renta NUMERIC(6, 2) NOT NULL,              -- Retención del Impuesto sobre la Renta según tabla MH
    salario_neto NUMERIC(8, 2) NOT NULL,       -- Líquido a recibir (Salario Bruto - ISSS - AFP - Renta)
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp de emisión de la boleta de pago
    UNIQUE (usuario_id, anio, mes, quincena)   -- Garantiza que no se le pague dos veces la misma quincena al mismo empleado
);