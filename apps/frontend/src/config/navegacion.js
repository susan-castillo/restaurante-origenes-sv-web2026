// =====================================================================
// navegacion.js — Una sola fuente de verdad sobre rutas y permisos.
// =====================================================================
import { FaBoxes, FaCashRegister, FaMoneyBillWave, FaShoppingCart, FaUsers } from 'react-icons/fa';

// Cada entrada es una pantalla del sistema.
//   roles            -> quién puede entrar
//   requiereSucursal -> solo para quien trabaja en una sucursal (el admin global no cobra)
export const MENU = [
    { ruta: '/pos', etiqueta: 'Punto de venta', icono: FaCashRegister, roles: ['EMPLEADO', 'ADMIN'], requiereSucursal: true },
    { ruta: '/admin/inventario', etiqueta: 'Inventario y recetas', icono: FaBoxes, roles: ['ADMIN'] },
    { ruta: '/admin/compras', etiqueta: 'Compras', icono: FaShoppingCart, roles: ['ADMIN'] },
    { ruta: '/admin/caja', etiqueta: 'Historial de caja', icono: FaMoneyBillWave, roles: ['ADMIN'] },
    { ruta: '/admin/rrhh', etiqueta: 'Recursos Humanos', icono: FaUsers, roles: ['ADMIN', 'RRHH'] },
];

// A dónde va cada usuario justo después de iniciar sesión.
// Se decide por el ROL (permisos), no por el cargo (puesto): un gerente ya es ADMIN.
export const rutaInicial = (usuario) => {
    if (usuario.rol === 'RRHH') return '/admin/rrhh';
    if (usuario.rol === 'ADMIN') return '/admin/inventario';
    return '/pos'; // EMPLEADO (barista, cajero)
};

// Opciones del menú lateral que este usuario puede ver.
export const menuPermitido = (usuario) =>
    MENU.filter(
        (item) => item.roles.includes(usuario.rol) && (!item.requiereSucursal || usuario.sucursal_id)
    );
