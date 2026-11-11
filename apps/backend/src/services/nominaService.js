//Se genera la planilla y calcula el salario bruto.

import { prisma } from "../models/db.js";

//Tablas (verifícalas con Hacienda, ISSS y AFP antes de producción).

const ISSS = { porcentaje: 0.03, topeMensual: 1000.00 };
const AFP = { porcentaje: 0.0725, topeMensual: 7028.89 };
const RENTA_QUINCENAL = [
    { desde: 0.01, hasta: 275.0, porcentaje: 0, exceso: 0, cuotaFija: 0 },
    { desde: 275.01, hasta: 447.62, porcentaje: 0.10, exceso: 275.0, cuotaFija: 8.83 },
    { desde: 447.63, hasta: 1019.05, porcentaje: 0.20, exceso: 447.62, cuotaFija: 30.0 },
    { desde: 1019.06, hasta: Infinity, porcentaje: 0.30, exceso: 1019.05, cuotaFija: 144.28 },
];

const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

//Suma el neto de todos los pagos (acepta números o Decimal de Prisma)
const sumarNeto = (pagos) =>
    redondear(pagos.reduce((suma, p) => suma + Number(p.salario_neto), 0));

//Error de negocio.
const errorNegocio = (mensaje, status = 400) =>
    Object.assign(new Error(mensaje), { status });

//Deducciones

export function calcularDeducciones(saldoBruto) {
    const isss = redondear(Math.min(saldoBruto, ISSS.topeMensual / 2) * ISSS.porcentaje);
    const afp = redondear(Math.min(saldoBruto, AFP.topeMensual / 2) * AFP.porcentaje);

    // Redondeada para no caer entre tramos por decimales flotantes
    const base = redondear(saldoBruto - isss - afp);
    const tramo = RENTA_QUINCENAL.find((t) => base >= t.desde && base <= t.hasta);
    const renta =
        !tramo || tramo.porcentaje === 0
            ? 0
            : redondear((base - tramo.exceso) * tramo.porcentaje + tramo.cuotaFija);

    return { isss, afp, renta };
}

//Calcular planilla (no guarda nada)

async function calcularPlanilla({ anio, mes, quincena }) {
    // Solo empleados activos con salario mayor a 0
    const empleados = await prisma.usuarios.findMany({
        where: { activo: true, salario_base: { gt: 0 } },
        orderBy: { id: 'asc' },
    });

    return empleados.map((emp) => {
        const bruto = redondear(Number(emp.salario_base) / 2);
        const { isss, afp, renta } = calcularDeducciones(bruto);

        return {
            usuario_id: emp.id,
            anio, mes, quincena,
            salario_bruto: bruto,
            isss, afp, renta,
            salario_neto: redondear(bruto - isss - afp - renta),
        };
    });
}

// Vista previa.

export async function simularPlanilla(periodo) {
    const pagos = await calcularPlanilla(periodo);
    return { pagos, totalNeto: sumarNeto(pagos) };
}

//Generar planilla y guardar
export async function generarPlanilla(periodo) {
    const yaExiste = await prisma.pagos_planilla.count({ where: periodo });
    if (yaExiste) throw errorNegocio('La planilla de esta quincena ya fue generada.', 409);

    const pagos = await calcularPlanilla(periodo);
    if (!pagos.length) throw errorNegocio('No hay empleados activos con salario.', 400);

    await prisma.pagos_planilla.createMany({ data: pagos });
    return { pagos, totalNeto: sumarNeto(pagos) };
}

//Consultar planilla.

export async function obtenerPlanilla(periodo) {
    const pagos = await prisma.pagos_planilla.findMany({
        where: periodo,
        include: { usuarios: { select: { id: true, nombre: true, cargo: true } } },
        orderBy: { usuario_id: 'asc' },
    });
    if (!pagos.length) throw errorNegocio('No existe planilla para ese período.', 404);

    return { pagos, totalNeto: sumarNeto(pagos) };
}