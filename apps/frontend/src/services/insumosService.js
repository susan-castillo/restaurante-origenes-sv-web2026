
const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// FUNCIÓN GENERAL PARA COMUNICARNOS CON EL BACKEND
// ==========================================

async function peticion(endpoint, opciones = {}) {
  const token = localStorage.getItem("token");

  const respuesta = await fetch(`${API_URL}${endpoint}`, {
    ...opciones,
    headers: {
      Accept: "application/json",
      ...(opciones.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });

  if (!respuesta.ok) {
    let mensaje = `Error en la petición (${respuesta.status})`;

    try {
      const error = await respuesta.json();
      mensaje = error.error || error.message || mensaje;
    } catch {
      // Si la respuesta no es JSON, usamos el mensaje general.
    }

    throw new Error(mensaje);
  }

  if (respuesta.status === 204) return null;

  return respuesta.json();
}

// ==========================================
// CATÁLOGO DE INSUMOS
// ==========================================

// GET /api/insumos
// Obtiene el catálogo completo de insumos.
export async function obtenerInsumos() {
  return peticion("/insumos");
}

// GET /api/insumos?activo=false
// Obtiene los insumos deshabilitados.
export async function obtenerInsumosDeshabilitados() {
  return peticion("/insumos?activo=false");
}

// POST /api/insumos
// Crea un nuevo insumo.
export async function crearInsumo(datos) {
  return peticion("/insumos", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// PUT /api/insumos/:id
// Actualiza el nombre y/o unidad del insumo.
export async function actualizarInsumo(id, datos) {
  return peticion(`/insumos/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// PATCH /api/insumos/:id/estado
// Activa o desactiva un insumo sin eliminarlo de PostgreSQL.
export async function cambiarEstadoInsumo(id, activo) {
  return peticion(`/insumos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
  });
}

// ==========================================
// INVENTARIO POR SUCURSAL
// ==========================================

// GET /api/inventario
// Obtiene las existencias de los insumos.
export async function obtenerInventario(sucursalId = null) {
  const endpoint =
    sucursalId != null
      ? `/inventario?sucursal_id=${encodeURIComponent(sucursalId)}`
      : "/inventario";

  return peticion(endpoint);
}

// PUT /api/inventario/:insumoId
// Actualiza las existencias de un insumo.
export async function actualizarInventario(insumoId, datos) {
  return peticion(`/inventario/${insumoId}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// GET /api/inventario/alertas
// Obtiene alertas de insumos con existencias bajas.
export async function obtenerAlertas(sucursalId = null) {
  const endpoint =
    sucursalId != null
      ? `/inventario/alertas?sucursal_id=${encodeURIComponent(sucursalId)}`
      : "/inventario/alertas";

  return peticion(endpoint);
}
