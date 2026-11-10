

const prisma = require('../db');

const CARGOS = ['Barista', 'Cajero', 'Gerente' ];
const ROLES = ['Empleado', 'RRHH', 'Administrador'];

// Campos a seleccionar.
const select = {
    id: true, sucursal_id: true, nombre: true, email: true, rol: true, 
    cargo: true, salario_base: true, activo: true, creado_en: true, 
    sucursales: { select: { id: true, nombre: true}}
}

exports.listarEmpleados = asyn (req, res) => {
    const { cargo, activo, sucursal_id} = req.query;
    const where = {};
        (cargo && {cargo} != undefined), 

    }

}