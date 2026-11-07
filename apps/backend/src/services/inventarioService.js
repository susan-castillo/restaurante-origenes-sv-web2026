// Lógica de negocio del inventario por sucursal (comunicación con Prisma).
import { prisma } from '../models/db.js';
import { idValido, coincideNombre } from '../utils/validaciones.js';

// Stock de una sucursal: todos los insumos activos, con 0 si aún no tienen fila de inventario.
// buscar: texto dentro del nombre del insumo.
export const listarInventario = async (sucursalId, { buscar } = {}) => {
    const insumos = await prisma.insumos.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
        include: { inventario_sucursal: { where: { sucursal_id: sucursalId } } },
    });

    return insumos
        .filter((insumo) => !buscar || coincideNombre(insumo.nombre, buscar))
        .map((insumo) => {
            const fila = insumo.inventario_sucursal[0];
            return {
                insumo_id: insumo.id,
                nombre: insumo.nombre,
                unidad: insumo.unidad,
                stock_actual: fila ? fila.stock_actual : '0',
                stock_minimo: fila ? fila.stock_minimo : '0',
            };
        });
};

// Insumos activos cuyo stock actual está por debajo del mínimo en una sucursal.
// Prisma no compara dos columnas entre sí en un where, así que se filtra aquí con Decimal.
export const listarAlertas = async (sucursalId, { buscar } = {}) => {
    const filas = await prisma.inventario_sucursal.findMany({
        where: { sucursal_id: sucursalId, insumos: { activo: true } },
        include: { insumos: true },
        orderBy: { insumo_id: 'asc' },
    });

    return filas
        .filter((fila) => fila.stock_actual.lt(fila.stock_minimo))
        .filter((fila) => !buscar || coincideNombre(fila.insumos.nombre, buscar))
        .map((fila) => ({
            insumo_id: fila.insumo_id,
            nombre: fila.insumos.nombre,
            unidad: fila.insumos.unidad,
            stock_actual: fila.stock_actual,
            stock_minimo: fila.stock_minimo,
            faltante: fila.stock_minimo.minus(fila.stock_actual),
        }));
};

// Ajusta stock_actual y/o stock_minimo. Si la fila no existe, la crea (lo no enviado queda en 0).
export const ajustarInventario = async (sucursalId, insumoId, datos) => {
    const [sucursal, insumo] = await Promise.all([
        prisma.sucursales.findUnique({ where: { id: sucursalId } }),
        prisma.insumos.findUnique({ where: { id: insumoId } }),
    ]);
    if (!sucursal) throw new Error('SUCURSAL_NO_ENCONTRADA');
    if (!insumo) throw new Error('INSUMO_NO_ENCONTRADO');

    const fila = await prisma.inventario_sucursal.upsert({
        where: { sucursal_id_insumo_id: { sucursal_id: sucursalId, insumo_id: insumoId } },
        update: datos,
        create: { sucursal_id: sucursalId, insumo_id: insumoId, ...datos },
    });

    return {
        insumo_id: insumo.id,
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        stock_actual: fila.stock_actual,
        stock_minimo: fila.stock_minimo,
    };
};

// Error con código estable (message) y texto legible para mostrar en el POS (mensaje).
const errorInventario = (codigo, mensaje, detalle) => {
    const error = new Error(codigo);
    error.mensaje = mensaje;
    if (detalle !== undefined) error.detalle = detalle;
    return error;
};

// Valida los items de una venta y junta los repetidos: Map(platillo_id → unidades).
const agruparItemsVenta = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw errorInventario('ITEMS_INVALIDOS', 'La venta debe incluir al menos un platillo.');
    }

    const porPlatillo = new Map();
    for (const item of items) {
        const platilloId = idValido(item?.platillo_id);
        const cantidad = idValido(item?.cantidad); // entero mayor que 0
        if (!platilloId || !cantidad) {
            throw errorInventario(
                'ITEMS_INVALIDOS',
                'Cada item necesita un platillo_id y una cantidad entera mayor que 0.'
            );
        }
        porPlatillo.set(platilloId, (porPlatillo.get(platilloId) ?? 0) + cantidad);
    }
    return porPlatillo;
};

/**
 * Descuenta del inventario de una sucursal los insumos que consume una venta.*/
export const descontarInventario = async (client, sucursalId, items) => {
    if (!idValido(sucursalId)) {
        throw errorInventario('SUCURSAL_INVALIDA', 'La sucursal no es válida.');
    }
    const porPlatillo = agruparItemsVenta(items);
    const platilloIds = [...porPlatillo.keys()];

    // 1. Los platillos deben existir, estar activos y tener receta
    const platillos = await client.platillos.findMany({
        where: { id: { in: platilloIds } },
        include: { recetas: true },
    });
    if (platillos.length !== platilloIds.length) {
        throw errorInventario('PLATILLO_NO_ENCONTRADO', 'Uno o más platillos de la venta no existen.');
    }
    for (const platillo of platillos) {
        if (!platillo.activo) {
            throw errorInventario('PLATILLO_INACTIVO', `El platillo "${platillo.nombre}" está desactivado.`);
        }
        if (platillo.recetas.length === 0) {
            throw errorInventario('PLATILLO_SIN_RECETA', `El platillo "${platillo.nombre}" no tiene receta configurada.`);
        }
    }

    // 2. Total por insumo = suma de (cantidad de la receta × unidades vendidas)
    const requeridos = new Map();
    for (const platillo of platillos) {
        const unidades = porPlatillo.get(platillo.id);
        for (const linea of platillo.recetas) {
            const total = linea.cantidad.mul(unidades);
            const acumulado = requeridos.get(linea.insumo_id);
            requeridos.set(linea.insumo_id, acumulado ? acumulado.plus(total) : total);
        }
    }
    // Orden fijo para que dos ventas simultáneas no se bloqueen entre sí
    const insumoIds = [...requeridos.keys()].sort((a, b) => a - b);

    // 3. Revisar el stock disponible y reunir todo lo que falte
    const [insumos, filas] = await Promise.all([
        client.insumos.findMany({ where: { id: { in: insumoIds } } }),
        client.inventario_sucursal.findMany({
            where: { sucursal_id: sucursalId, insumo_id: { in: insumoIds } },
        }),
    ]);
    const catalogo = new Map(insumos.map((insumo) => [insumo.id, insumo]));
    const stock = new Map(filas.map((fila) => [fila.insumo_id, fila.stock_actual]));

    const faltantes = [];
    for (const insumoId of insumoIds) {
        const requerido = requeridos.get(insumoId);
        const disponible = stock.get(insumoId);
        if (!disponible || disponible.lt(requerido)) {
            const insumo = catalogo.get(insumoId);
            faltantes.push({
                insumo_id: insumoId,
                nombre: insumo.nombre,
                unidad: insumo.unidad,
                requerido: requerido.toString(),
                disponible: disponible ? disponible.toString() : '0',
            });
        }
    }
    if (faltantes.length > 0) {
        const lista = faltantes
            .map((f) => `${f.nombre} (necesita ${f.requerido} ${f.unidad}, hay ${f.disponible})`)
            .join('; ');
        throw errorInventario('STOCK_INSUFICIENTE', `Stock insuficiente: ${lista}.`, faltantes);
    }

    // 4. Descontar. El UPDATE solo aplica si el stock alcanza, así que dos ventas
    //    simultáneas no pueden gastar el mismo stock.
    for (const insumoId of insumoIds) {
        const requerido = requeridos.get(insumoId);
        const { count } = await client.inventario_sucursal.updateMany({
            where: { sucursal_id: sucursalId, insumo_id: insumoId, stock_actual: { gte: requerido } },
            data: { stock_actual: { decrement: requerido } },
        });
        if (count !== 1) {
            // Otra venta consumió el stock entre la lectura y la actualización
            const insumo = catalogo.get(insumoId);
            throw errorInventario(
                'STOCK_INSUFICIENTE',
                `Stock insuficiente de "${insumo.nombre}". Intenta de nuevo.`
            );
        }
    }

    // 5. Alertas: insumos consumidos que quedaron por debajo del mínimo
    const actualizadas = await client.inventario_sucursal.findMany({
        where: { sucursal_id: sucursalId, insumo_id: { in: insumoIds } },
        include: { insumos: true },
        orderBy: { insumo_id: 'asc' },
    });
    const alertas = actualizadas
        .filter((fila) => fila.stock_actual.lt(fila.stock_minimo))
        .map((fila) => ({
            insumo_id: fila.insumo_id,
            nombre: fila.insumos.nombre,
            unidad: fila.insumos.unidad,
            stock_actual: fila.stock_actual,
            stock_minimo: fila.stock_minimo,
            faltante: fila.stock_minimo.minus(fila.stock_actual),
        }));

    const descontados = insumoIds.map((insumoId) => ({
        insumo_id: insumoId,
        nombre: catalogo.get(insumoId).nombre,
        unidad: catalogo.get(insumoId).unidad,
        cantidad: requeridos.get(insumoId),
    }));

    return { descontados, alertas };
};