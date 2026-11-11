# Diagrama de clases del dominio

El diagrama representa las entidades persistidas de Orígenes SV. Los atributos muestran sus tipos y si admiten valores nulos. Las asociaciones siguen las claves foráneas de Prisma.

```mermaid
classDiagram
direction LR
class compras {
  <<PrismaModel>>
  +int id
  +int sucursal_id
  +int proveedor_id
  +string numero_factura
  +Decimal total
  +string estado_pago
  +DateTimeOptional fecha_vencimiento
  +DateTimeOptional creado_en
  +DateTimeOptional fecha_pago
}
class detalle_compra {
  <<PrismaModel>>
  +int id
  +int compra_id
  +int insumo_id
  +Decimal cantidad
  +Decimal costo_unitario
}
class detalle_venta {
  <<PrismaModel>>
  +int id
  +int venta_id
  +int platillo_id
  +int cantidad
  +Decimal precio_unitario
}
class insumos {
  <<PrismaModel>>
  +int id
  +string nombre
  +string unidad
  +bool activo
}
class inventario_sucursal {
  <<PrismaModel>>
  +int sucursal_id
  +int insumo_id
  +Decimal stock_actual
  +Decimal stock_minimo
}
class pagos_planilla {
  <<PrismaModel>>
  +int id
  +int usuario_id
  +int anio
  +int mes
  +int quincena
  +Decimal salario_bruto
  +Decimal isss
  +Decimal afp
  +Decimal renta
  +Decimal salario_neto
  +DateTimeOptional fecha_pago
}
class platillos {
  <<PrismaModel>>
  +int id
  +string nombre
  +stringOptional categoria
  +Decimal precio
  +bool activo
  +string tipo
  +stringOptional imagen
}
class proveedores {
  <<PrismaModel>>
  +int id
  +string nombre
  +stringOptional nit
}
class recetas {
  <<PrismaModel>>
  +int platillo_id
  +int insumo_id
  +Decimal cantidad
}
class sucursales {
  <<PrismaModel>>
  +int id
  +string nombre
  +stringOptional direccion
  +bool activa
}
class turnos_caja {
  <<PrismaModel>>
  +int id
  +int sucursal_id
  +int usuario_id
  +Decimal monto_inicial
  +DateTimeOptional abierto_en
  +DateTimeOptional cerrado_en
  +DecimalOptional efectivo_contado
  +string estado
}
class usuarios {
  <<PrismaModel>>
  +int id
  +intOptional sucursal_id
  +string nombre
  +string email
  +string password_hash
  +string rol
  +string cargo
  +Decimal salario_base
  +bool activo
  +DateTimeOptional creado_en
}
class ventas {
  <<PrismaModel>>
  +int id
  +int sucursal_id
  +int turno_id
  +int usuario_id
  +string tipo_doc
  +int numero
  +string metodo_pago
  +stringOptional cliente_nombre
  +stringOptional cliente_nit
  +stringOptional cliente_nrc
  +Decimal subtotal
  +Decimal iva
  +Decimal total
  +DateTimeOptional creado_en
}
proveedores "1" -- "0..*" compras
sucursales "1" -- "0..*" compras
compras "1" -- "0..*" detalle_compra
insumos "1" -- "0..*" detalle_compra
platillos "1" -- "0..*" detalle_venta
ventas "1" -- "0..*" detalle_venta
insumos "1" -- "0..*" inventario_sucursal
sucursales "1" -- "0..*" inventario_sucursal
usuarios "1" -- "0..*" pagos_planilla
insumos "1" -- "0..*" recetas
platillos "1" -- "0..*" recetas
sucursales "1" -- "0..*" turnos_caja
usuarios "1" -- "0..*" turnos_caja
sucursales "0..1" -- "0..*" usuarios
sucursales "1" -- "0..*" ventas
turnos_caja "1" -- "0..*" ventas
usuarios "1" -- "0..*" ventas
```

## Reglas relevantes

- El sufijo Optional indica un atributo que admite nulos.
- Un usuario puede carecer de sucursal. En este módulo, una cuenta ADMIN sin sede asignada corresponde a Administración central.
- Una sede inactiva conserva sus relaciones con ventas, compras y turnos.
- inventario_sucursal y recetas utilizan claves primarias compuestas.
- El correlativo de una venta es único por sucursal y tipo de documento.

El esquema Prisma conserva las claves y restricciones completas. 
