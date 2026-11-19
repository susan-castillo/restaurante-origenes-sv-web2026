import { Prisma } from '@prisma/client';

export function prepararCompra(detalles) {
  if (!Array.isArray(detalles) || !detalles.length) throw new Error('Incluye al menos un insumo.');
  const filas = detalles.map((item) => {
    if (!item || !Number.isInteger(Number(item.insumo_id)) || Number(item.insumo_id) <= 0) throw new Error('Insumo inválido.');
    function positivo(valor, precision, maximo) {
      if (!['string', 'number'].includes(typeof valor) || String(valor).trim() === '') throw new Error('Cantidad y costo deben ser positivos.');
      const decimal = new Prisma.Decimal(valor);
      if (!decimal.isFinite() || !decimal.gt(0) || decimal.decimalPlaces() > precision || decimal.gt(maximo)) throw new Error('Cantidad o costo fuera del rango o precisión permitidos.');
      return decimal;
    }
    return { insumo_id: Number(item.insumo_id), cantidad: positivo(item.cantidad, 3, '999999999.999'), costo_unitario: positivo(item.costo_unitario, 4, '999999.9999') };
  });
  const total = filas.reduce((suma, fila) => suma.plus(fila.cantidad.times(fila.costo_unitario)), new Prisma.Decimal(0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  if (total.gt('99999999.99')) throw new Error('El total supera el importe permitido.');
  return { filas, total };
}
