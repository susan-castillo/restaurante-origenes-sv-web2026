
const API_URL = import.meta.env.VITE_API_URL;

// Función general para comunicarnos con el backend
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
      // Si la respuesta no es JSON, usamos el mensaje general
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
export async function obtenerInsumos() {
  return peticion("/api/insumos");
}

// POST /api/insumos
export async function crearInsumo(datos) {
  return peticion("/api/insumos", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// PUT /api/insumos/:id
export async function actualizarInsumo(id, datos) {
  return peticion(`/api/insumos/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// ==========================================
// INVENTARIO POR SUCURSAL
// ==========================================

// GET /api/inventario
export async function obtenerInventario() {
  return peticion("/api/inventario");
}

// PUT /api/inventario/:insumoId
export async function actualizarInventario(insumoId, datos) {
  return peticion(`/api/inventario/${insumoId}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// GET /api/inventario/alertas
export async function obtenerAlertas() {
  return peticion("/api/inventario/alertas");
}
