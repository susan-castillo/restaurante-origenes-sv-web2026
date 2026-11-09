
import { apiFetch } from "./api.js";

// ==========================================
// CATÁLOGO DE PLATILLOS DEL POS
// ==========================================

// GET /api/pos/platillos
// Devuelve los platillos con disponibilidad según la sucursal.
export const obtenerPlatillosPOS = () =>
  apiFetch("/pos/platillos");

// GET /api/pos/platillos/:id
// Devuelve la receta y el inventario para el modal.
export const obtenerPlatilloPOS = (id) =>
  apiFetch(`/pos/platillos/${id}`);

// ==========================================
// VENTAS DEL POS
// ==========================================

// POST /api/pos/ventas
export const crearVentaPOS = (datosVenta) =>
  apiFetch("/pos/ventas", {
    method: "POST",
    body: JSON.stringify(datosVenta),
  });

// GET /api/pos/ventas
export const listarVentasPOS = () =>
  apiFetch("/pos/ventas");

// GET /api/pos/ventas/:id
export const obtenerVentaPOS = (id) =>
  apiFetch(`/pos/ventas/${id}`);
