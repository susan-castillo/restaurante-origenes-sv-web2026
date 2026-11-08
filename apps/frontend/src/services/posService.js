import { apiFetch } from "./api.js";

// ==========================================*
// CATÁLOGO DE PLATILLOS
// ==========================================*

// GET /api/platillos?activo=true
export async function obtenerPlatillosPOS() {
  return apiFetch("/platillos?activo=true");
}

// GET /api/platillos/:id
export async function obtenerPlatilloPOS(id) {
  return apiFetch(`/platillos/${id}`);
}
