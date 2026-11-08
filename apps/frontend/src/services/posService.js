import { apiFetch } from "./api.js";

//* ==========================================
//* CATÁLOGO DE PLATILLOS
//* ==========================================

//* GET /api/platillos?activo=true
export const obtenerPlatillosPOS = () =>
  apiFetch("/platillos?activo=true");

//* GET /api/platillos/:id
export const obtenerPlatilloPOS = (id) =>
  apiFetch(`/platillos/${id}`);

//* ==========================================
//* VENTAS DEL POS
//* ==========================================

//* POST /api/pos/ventas
export const crearVentaPOS = (datosVenta) =>
  apiFetch("/pos/ventas", {
    method: "POST",
    body: JSON.stringify(datosVenta),
  });

//* GET /api/pos/ventas
export const listarVentasPOS = () =>
  apiFetch("/pos/ventas");

//* GET /api/pos/ventas/:id
export const obtenerVentaPOS = (id) =>
  apiFetch(`/pos/ventas/${id}`);
