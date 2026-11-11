# Manual de usuario del módulo de sucursales

## Acceso y perfiles

Inicia sesión y selecciona **Sucursales** en el menú lateral.

| Perfil | Identificación | Acceso al módulo |
| --- | --- | --- |
| Administración central | Rol `ADMIN` y sin sucursal asignada | Consulta todas las sedes y permite crear, editar y cambiar su estado. |
| Administración de sede | Rol `ADMIN` y con sucursal asignada | Consulta su sede y sus métricas. |

El backend valida la cuenta activa y la asignación vigente en la base de datos. Las acciones de gestión aparecen en la interfaz de Administración central.

## Consultar sucursales

1. Abre el listado desde el menú.
2. Escribe parte del nombre o de la dirección para buscar. La búsqueda admite diferencias de mayúsculas y tildes.
3. Combina la búsqueda con el selector de sucursal y el filtro de estado.
4. Si no hay coincidencias, utiliza **Limpiar filtros** para restablecer el listado.
5. Selecciona **Ver sede** para consultar el detalle.

Cada tarjeta muestra nombre, dirección, estado, usuarios activos asignados y ventas del día. El detalle agrega el número de transacciones del día. La fecha de referencia aparece debajo de las métricas.

## Crear una sede

1. Con una cuenta de Administración central, selecciona **Agregar sucursal**.
2. Introduce el nombre, hasta 100 caracteres, y la dirección, hasta 200 caracteres. Ambos campos son obligatorios en el formulario.
3. Selecciona **Crear sucursal** y espera la confirmación.

La sede se crea activa. El listado se recarga, los filtros se restablecen y la sede aparece en el selector superior. **Cancelar** cierra el formulario. Ante un error, revisa el mensaje y vuelve a intentar el guardado.

## Editar una sede

1. Selecciona **Editar** en su tarjeta o **Editar sede** desde el detalle.
2. Cambia el nombre o la dirección.
3. Selecciona **Guardar sede**.

La confirmación muestra el resultado y actualiza el detalle y el selector superior. **Cancelar** descarta el borrador. Al volver al listado se consultan los datos actualizados.

## Activar y desactivar

1. Selecciona **Activar** o **Desactivar** en la tarjeta o en el detalle.
2. Revisa el nombre de la sede en la confirmación.
3. Confirma la acción o selecciona **Cancelar**.

Al desactivar una sede se conserva su historial y se retira del selector de sedes activas. Si era la sede seleccionada, el selector solicita elegir otra. La sede sigue disponible en el listado administrativo con el filtro **Inactivas**. Al activarla vuelve a aparecer en el selector de activas.

## Interpretar las métricas

- **Empleados activos asignados** cuenta todos los usuarios activos asociados a la sede, incluidos gerentes y administradores de sede.
- **Ventas del día** suma el total de las ventas registradas dentro del día indicado en El Salvador, en dólares estadounidenses.
- **Transacciones del día** cuenta los registros de venta del mismo periodo.

Un importe de cero indica que no hay ventas en ese periodo. Si las métricas no están disponibles, la interfaz muestra ese estado. Las cifras se consultan al cargar la pantalla. Recarga para obtener datos recientes.

## Mensajes frecuentes

| Mensaje o situación | Acción |
| --- | --- |
| Error al cargar la lista o el detalle | Comprueba que los servicios estén activos y selecciona **Reintentar**. |
| Solo puedes consultar tu sucursal asignada | Accede al listado y abre la sede asociada a tu cuenta. |
| Sucursal no encontrada | Vuelve al listado y comprueba la sede disponible. |
| Sesión inválida o expirada | Inicia sesión nuevamente. |
| No aparecen acciones de gestión | Comprueba con el equipo si tu cuenta corresponde a Administración central. |
