const router = require('express').Router();
const { requireRole } = require('../middlewares/roles');
const rrhh = require('../controllers/rrhh.controller');
const emp  = require('../controllers/empleados.controller');
const plan = require('../controllers/planilla.controller');

router.use(requireRole('RRHH', 'ADMIN'));

// /rrhh
router.get('/', rrhh.dashboard);

// /rrhh/empleados
router.get('/empleados',                emp.listar);
router.post('/empleados',               emp.crear);
router.get('/empleados/:id',            emp.obtener);
router.put('/empleados/:id',            emp.actualizar);
router.patch('/empleados/:id/estado',   emp.cambiarEstado);
router.delete('/empleados/:id',         emp.desactivar);

// /rrhh/planilla
router.get('/planilla',                                   plan.listar);   // resumen por quincena
router.post('/planilla/generar',                          plan.generar);
router.get('/planilla/:anio/:mes/:quincena',              plan.detalle);
router.get('/planilla/:anio/:mes/:quincena/boletas',      plan.boletas);
router.get('/planilla/:anio/:mes/:quincena/boletas/:usuarioId', plan.boleta);

module.exports = router;