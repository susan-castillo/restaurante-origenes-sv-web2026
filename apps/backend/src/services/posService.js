import { Prisma } from '@prisma/client';
import { prisma } from '../models/db.js';
import { descontarInventario, listarInventario } from './inventarioService.js';
import { listarPlatillos } from './platillosService.js';
import { obtenerReceta } from './recetasService.js';

const MAX_INT = 2_147_483_647;
const tiposDocumento = ['FACTURA', 'CCF'];
const metodosPago = ['EFECTIVO', 'TARJETA', 'BITCOIN'];

const datosTicket = {
    detalle_venta: {
        orderBy: { id: 'asc' },
        include: {
            platillos: { select: { id: true, nombre: true } },
        },
    },
    sucursales: { select: { id: true, nombre: true, direccion: true } },
    usuarios: { select: { id: true, nombre: true } },
};

function errorPos(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

function esEnteroPositivo(valor) {
    return Number.isInteger(valor) && valor > 0 && valor <= MAX_INT;
}

function leerId(valor, campo) {
    if (typeof valor === 'string' && /^[1-9]\d*$/.test(valor)) {
        valor = Number(valor);
    }

    if (!esEnteroPositivo(valor)) {
        throw errorPos(400, `${campo} debe ser un entero positivo válido.`);
    }

    return valor;
}

function leerOpcion(valor, opciones, campo) {
    const opcion = typeof valor === 'string'
        ? valor.trim().toUpperCase()
        : '';

    if (!opciones.includes(opcion)) {
        throw errorPos(400, `${campo} debe ser uno de: ${opciones.join(', ')}.`);
    }

    return opcion;
}

function leerDatoCliente(valor, campo, maximo, obligatorio) {
    if (valor == null && !obligatorio) return null;

    if (
        typeof valor !== 'string' ||
        !valor.trim() ||
        valor.trim().length > maximo
    ) {
        throw errorPos(400, `cliente.${campo} debe tener entre 1 y ${maximo} caracteres.`);
    }

    return valor.trim();
}

function validarVenta(body) {
    const tipo_doc = leerOpcion(body?.tipo_doc, tiposDocumento, 'tipo_doc');
    const metodo_pago = leerOpcion(body?.metodo_pago, metodosPago, 'metodo_pago');

    if (!Array.isArray(body.items) || body.items.length === 0) {
        throw errorPos(400, 'La venta debe incluir al menos un platillo.');
    }

    // Unifica los platillos repetidos en un solo detalle.
    const cantidades = new Map();

    for (const item of body.items) {
        const id = leerId(item?.platillo_id, 'platillo_id');
        const cantidad = leerId(item?.cantidad, 'cantidad');
        const acumulada = (cantidades.get(id) ?? 0) + cantidad;

        if (!esEnteroPositivo(acumulada)) {
            throw errorPos(400, `La cantidad del platillo ${id} supera el límite.`);
        }

        cantidades.set(id, acumulada);
    }

    const items = Array.from(cantidades, ([platillo_id, cantidad]) => ({
        platillo_id,
        cantidad,
    }));

    const cliente = body.cliente ?? {};

    if (typeof cliente !== 'object' || Array.isArray(cliente)) {
        throw errorPos(400, 'cliente debe ser un objeto.');
    }

    const esCCF = tipo_doc === 'CCF';

    return {
        tipo_doc,
        metodo_pago,
        items,
        datosCliente: {
            cliente_nombre: leerDatoCliente(cliente.nombre, 'nombre', 150, esCCF),
            cliente_nit: leerDatoCliente(cliente.nit, 'nit', 20, esCCF),
            cliente_nrc: leerDatoCliente(cliente.nrc, 'nrc', 20, esCCF),
        },
    };
}

function obtenerSucursal(usuario) {
    if (!esEnteroPositivo(usuario.sucursal_id)) {
        throw errorPos(403, 'Tu usuario debe tener una sucursal asignada.');
    }

    return usuario.sucursal_id;
}

async function obtenerTurnoAbierto(client, usuario, { bloquear = false } = {}) {
    const sucursalId = obtenerSucursal(usuario);
    const usuarioId = usuario.id;
    const turnoId = usuario.turno_id;

    if (!esEnteroPositivo(usuarioId)) {
        throw errorPos(403, 'El usuario de la sesión no es válido.');
    }

    if (turnoId != null && !esEnteroPositivo(turnoId)) {
        throw errorPos(403, 'El turno de la sesión no es válido.');
    }

    const filtroTurno = turnoId == null
        ? Prisma.empty
        : Prisma.sql`AND id = ${turnoId}`;

    const bloqueo = bloquear ? Prisma.sql`FOR UPDATE` : Prisma.empty;

    const turnos = await client.$queryRaw`
        SELECT id
        FROM turnos_caja
        WHERE usuario_id = ${usuarioId}
          AND sucursal_id = ${sucursalId}
          AND estado = 'ABIERTO'
          ${filtroTurno}
        ORDER BY id
        LIMIT 2
        ${bloqueo}
    `;

    if (turnos.length === 0) {
        throw errorPos(409, 'Debes tener un turno de caja abierto.');
    }

    if (turnos.length > 1) {
        throw errorPos(409, 'Hay más de un turno abierto. Revisa el módulo de caja.');
    }

    return turnos[0];
}

// Calcula la disponibilidad de un platillo con el inventario
// de la sucursal del usuario.
const calcularDisponibilidadPOS = (platillo, receta, stockPorInsumo) => {
    const ingredientes = receta.items.map((item) => {
        const existencia = stockPorInsumo.get(item.insumo_id);

        const cantidadRequerida = Number(item.cantidad);
        const stockActual = Number(existencia?.stock_actual ?? 0);

        return {
            insumo_id: item.insumo_id,
            nombre: item.nombre,
            unidad: item.unidad,
            cantidad_requerida: item.cantidad,
            stock_actual: existencia?.stock_actual ?? '0',
            suficiente: stockActual >= cantidadRequerida,
        };
    });

    return {
        ...platillo,
        disponible:
            platillo.activo &&
            ingredientes.length > 0 &&
            ingredientes.every((item) => item.suficiente),
        ingredientes,
    };
};

// Obtiene todos los platillos con disponibilidad por sucursal.
export const listarPlatillosPOS = async (usuario) => {
    const sucursalId = obtenerSucursal(usuario);

    const [platillos, inventario] = await Promise.all([
        listarPlatillos({ activo: true }),
        listarInventario(sucursalId),
    ]);

    const stockPorInsumo = new Map(
        inventario.map((item) => [item.insumo_id, item])
    );

    const recetas = await Promise.all(
        platillos.map((platillo) => obtenerReceta(platillo.id))
    );

    return platillos.map((platillo, index) =>
        calcularDisponibilidadPOS(
            platillo,
            recetas[index],
            stockPorInsumo
        )
    );
};

// Obtiene el detalle de un platillo para el modal.
export const obtenerDetallePlatilloPOS = async (usuario, platilloId) => {
    const sucursalId = obtenerSucursal(usuario);
    const id = leerId(platilloId, 'platilloId');

    const [platillo, receta, inventario] = await Promise.all([
        prisma.platillos.findUnique({ where: { id } }),
        obtenerReceta(id),
        listarInventario(sucursalId),
    ]);

    const stockPorInsumo = new Map(
        inventario.map((item) => [item.insumo_id, item])
    );

    return calcularDisponibilidadPOS(
        platillo,
        receta,
        stockPorInsumo
    );
};

export async function crearVenta(usuario, body) {
    const sucursalId = obtenerSucursal(usuario);
    const { tipo_doc, metodo_pago, datosCliente, items } = validarVenta(body);

    return prisma.$transaction(async (tx) => {
        const turno = await obtenerTurnoAbierto(tx, usuario, { bloquear: true });

        // Las ventas de una sucursal esperan su turno antes de asignar número.
        // La fila permanece bloqueada hasta confirmar o revertir la transacción.
        const sucursales = await tx.$queryRaw`
            SELECT id
            FROM sucursales
            WHERE id = ${sucursalId} AND activa = TRUE
            FOR NO KEY UPDATE
        `;

        if (sucursales.length === 0) {
            throw errorPos(409, 'La sucursal ya no está activa.');
        }

        const platillos = await tx.platillos.findMany({
            where: { id: { in: items.map((item) => item.platillo_id) } },
            select: { id: true, nombre: true, precio: true, activo: true },
        });

        const porId = new Map(platillos.map((platillo) => [platillo.id, platillo]));
        let total = new Prisma.Decimal(0);

        const detalles = items.map(({ platillo_id, cantidad }) => {
            const platillo = porId.get(platillo_id);

            if (!platillo) {
                throw errorPos(404, `El platillo ${platillo_id} no existe.`);
            }

            if (!platillo.activo) {
                throw errorPos(409, `El platillo "${platillo.nombre}" está desactivado.`);
            }

            total = total.plus(platillo.precio.mul(cantidad));

            return {
                platillo_id,
                cantidad,
                precio_unitario: platillo.precio,
            };
        });

        if (total.gt('99999999.99')) {
            throw errorPos(400, 'El total supera el importe permitido.');
        }

        // El precio del catálogo ya incluye IVA.
        const subtotal = total.div('1.13').toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const iva = total.minus(subtotal);

        const ultimaVenta = await tx.ventas.findFirst({
            where: { sucursal_id: sucursalId, tipo_doc },
            orderBy: { numero: 'desc' },
            select: { numero: true },
        });

        const numero = (ultimaVenta?.numero ?? 0) + 1;

        if (!esEnteroPositivo(numero)) {
            throw errorPos(409, 'El correlativo alcanzó el límite permitido.');
        }

        const venta = await tx.ventas.create({
            data: {
                sucursal_id: sucursalId,
                turno_id: turno.id,
                usuario_id: usuario.id,
                tipo_doc,
                numero,
                metodo_pago,
                ...datosCliente,
                subtotal,
                iva,
                total,
                detalle_venta: { create: detalles },
            },
            include: datosTicket,
        });

        const { alertas } = await descontarInventario(tx, sucursalId, items);

        return { ...venta, alertas };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}

export async function obtenerVentaPorId(usuario, id) {
    const ventaId = leerId(id, 'id');

    const where = { id: ventaId };

    if (usuario.rol !== 'ADMIN') {
        where.sucursal_id = obtenerSucursal(usuario);
    }

    const venta = await prisma.ventas.findFirst({
        where,
        include: datosTicket,
    });

    if (!venta) {
        throw errorPos(404, 'Venta no encontrada.');
    }

    return venta;
}

function leerFecha(valor, campo) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        throw errorPos(400, `${campo} debe tener el formato YYYY-MM-DD.`);
    }

    const fecha = new Date(`${valor}T00:00:00.000Z`);

    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
        throw errorPos(400, `${campo} no es una fecha válida.`);
    }

    return fecha;
}

export async function listarVentas(usuario, filtros = {}) {
    const where = {};

    if (usuario.rol === 'ADMIN') {
        if (filtros.turno_id !== undefined) {
            where.turno_id = leerId(filtros.turno_id, 'turno_id');
        }

        const desde = filtros.desde === undefined
            ? null
            : leerFecha(filtros.desde, 'desde');

        const hasta = filtros.hasta === undefined
            ? null
            : leerFecha(filtros.hasta, 'hasta');

        if (desde && hasta && desde > hasta) {
            throw errorPos(400, 'desde debe ser anterior o igual a hasta.');
        }

        if (desde || hasta) {
            where.creado_en = {};

            if (desde) where.creado_en.gte = desde;

            if (hasta) {
                hasta.setUTCDate(hasta.getUTCDate() + 1);
                where.creado_en.lt = hasta;
            }
        }
    } else {
        const turno = await obtenerTurnoAbierto(prisma, usuario);
        where.turno_id = turno.id;
        where.sucursal_id = usuario.sucursal_id;
    }

    return prisma.ventas.findMany({
        where,
        orderBy: [{ creado_en: 'desc' }, { id: 'desc' }],
        select: {
            id: true,
            numero: true,
            tipo_doc: true,
            metodo_pago: true,
            sucursal_id: true,
            turno_id: true,
            usuario_id: true,
            subtotal: true,
            iva: true,
            total: true,
            creado_en: true,
        },
    });
}