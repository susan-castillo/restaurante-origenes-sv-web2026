BEGIN;
-- Si hay facturas duplicadas o costos inválidos, aborta para revisar el historial.
-- SELECT proveedor_id, btrim(numero_factura), count(*) FROM compras
-- GROUP BY proveedor_id, btrim(numero_factura) HAVING count(*) > 1;
UPDATE compras SET numero_factura = btrim(numero_factura);
ALTER TABLE compras ADD CONSTRAINT compras_proveedor_factura_key UNIQUE (proveedor_id, numero_factura);
ALTER TABLE detalle_compra ADD CONSTRAINT detalle_compra_costo_positivo CHECK (costo_unitario > 0);
COMMIT;
