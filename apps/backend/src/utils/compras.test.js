import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararCompra } from './compraImportes.js';
import { rangoFechasSV } from './fechaSV.js';

const fila = (costo, cantidad = '1') => ({ insumo_id: 1, cantidad, costo_unitario: costo });

test('cálculo decimal exacto y redondeo del total a centavos', () => {
  assert.equal(prepararCompra([fila('0.1'), fila('0.2')]).total.toString(), '0.3');
  assert.equal(prepararCompra([fila('1.005')]).total.toString(), '1.01');
  assert.equal(prepararCompra([fila('0.0001', '0.001')]).total.toString(), '0');
});

test('rechaza costos y cantidades inválidos antes de escribir', () => {
  for (const valor of [0, -1, null, '', true, Infinity, 'NaN', '0.00001', '1000000']) {
    assert.throws(() => prepararCompra([fila(valor)]));
  }
  assert.throws(() => prepararCompra([fila('1', '0.0001')]));
  assert.throws(() => prepararCompra([fila('999999', '999999999')]));
  assert.throws(() => prepararCompra([]));
});

test('día local de El Salvador incluye hasta antes de las 06 UTC siguientes', () => {
  const { inicio, fin } = rangoFechasSV('2026-11-19', '2026-11-19');
  assert.equal(inicio.toISOString(), '2026-11-19T06:00:00.000Z');
  assert.equal(fin.toISOString(), '2026-11-20T06:00:00.000Z');
});

test('rechaza fechas inexistentes, horas y rangos invertidos', () => {
  for (const fecha of ['2026-02-30', '2026-13-01', '19/11/2026', '2026-11-19T00:00:00Z']) {
    assert.throws(() => rangoFechasSV(fecha, '2026-11-19'));
  }
  assert.throws(() => rangoFechasSV('2026-11-20', '2026-11-19'));
  assert.equal(rangoFechasSV('2024-02-29', '2024-02-29').inicio.toISOString(), '2024-02-29T06:00:00.000Z');
});
