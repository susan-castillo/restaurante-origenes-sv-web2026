-- Borra TODOS los datos de todas las tablas y reinicia los ids desde 1.
-- No borra las tablas: para recrearlas usa `npx prisma db push --force-reset`.
TRUNCATE TABLE
    detalle_venta, ventas, turnos_caja,
    detalle_compra, compras, proveedores,
    pagos_planilla, recetas, inventario_sucursal,
    platillos, insumos, usuarios, sucursales
RESTART IDENTITY CASCADE;