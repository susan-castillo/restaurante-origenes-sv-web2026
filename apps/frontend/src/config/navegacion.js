// =====================================================================
// navegacion.js — Una sola fuente de verdad sobre rutas y permisos.
// =====================================================================
import {
    FaBoxes,
    FaCashRegister,
    FaFileInvoiceDollar,
    FaMoneyBillWave,
    FaShoppingCart,
    FaUserPlus,
    FaUsers
} from 'react-icons/fa';

// Cada entrada es una pantalla del sistema.
//   roles            -> quién puede entrar
//   requiereSucursal -> solo para quien trabaja en una sucursal (el admin global no cobra)
export const MENU = [
    { ruta: '/pos', etiqueta: 'Punto de venta', icono: FaCashRegister, roles: ['EMPLEADO', 'ADMIN'], requiereSucursal: true },
    { ruta: '/admin/inventario', etiqueta: 'Inventario y recetas', icono: FaBoxes, roles: ['ADMIN'] },
    { ruta: '/admin/compras', etiqueta: 'Compras', icono: FaShoppingCart, roles: ['ADMIN'] },
    { ruta: '/admin/caja', etiqueta: 'Historial de caja', icono: FaMoneyBillWave, roles: ['ADMIN'] },
    {
        ruta: '/rrhh',
        etiqueta: 'Recursos Humanos',
        icono: FaUsers,
        roles: ['ADMIN', 'RRHH'],
        hijos: [
            { ruta: '/rrhh/empleados', etiqueta: 'Empleados', icono: FaUserPlus, roles: ['ADMIN', 'RRHH'] },
            { ruta: '/rrhh/planilla', etiqueta: 'Planillas', icono: FaFileInvoiceDollar, roles: ['ADMIN', 'RRHH'] },
        ]
    },
];

// A dónde va cada usuario justo después de iniciar sesión.
// Se decide por el ROL (permisos), no por el cargo (puesto): un gerente ya es ADMIN.
export const rutaInicial = (usuario) => {
    // Leemos el rol y lo convertimos a mayúsculas por seguridad
    const rolBruto = usuario?.rol || usuario?.usuario?.rol || '';
    const rol = String(rolBruto).toUpperCase().trim();

    switch (rol) {
        case 'ADMIN':
            return '/admin/inventario';
        case 'RRHH':
            return '/rrhh/empleados';
        case 'EMPLEADO':
            return '/pos';
        default:
            return '/pos';
    }
};

// Opciones del menú lateral que este usuario puede ver (incluyendo filtrado de sub-opciones).
export const menuPermitido = (usuario) => {
    if (!usuario || !usuario.rol) return [];

    return MENU
        .filter((item) => item.roles.includes(usuario.rol) && (!item.requiereSucursal || usuario.sucursal_id))
        .map((item) => {
            // Si el ítem principal tiene subopciones, las filtramos según el rol del usuario
            if (item.hijos && item.hijos.length > 0) {
                const hijosPermitidos = item.hijos.filter((hijo) => hijo.roles.includes(usuario.rol));
                return { ...item, hijos: hijosPermitidos };
            }
            return item;
        });
};
