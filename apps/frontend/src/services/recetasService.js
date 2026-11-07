
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
// CATÁLOGO DE PRODUCTOS
// ==========================================

// GET /api/platillos
export async function obtenerProductos() {
  return peticion("/platillos");
}

// GET /api/platillos/:id
export async function obtenerProducto(id) {
  return peticion(`/platillos/${id}`);
}

// POST /api/platillos
export async function crearProducto(datos) {
  return peticion("/platillos", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// PUT /api/platillos/:id
export async function editarProducto(id, datos) {
  return peticion(`/platillos/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// PATCH /api/platillos/:id/estado
export async function cambiarEstadoProducto(id, datos) {
  return peticion(`/platillos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

// ==========================================
// RECETAS DE PRODUCTOS
// ==========================================

// GET /api/platillos/:id/receta
export async function obtenerReceta(id) {
  return peticion(`/platillos/${id}/receta`);
}

// PUT /api/platillos/:id/receta
export async function guardarReceta(id, items) {
  return peticion(`/platillos/${id}/receta`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}
