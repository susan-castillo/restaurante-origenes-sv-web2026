
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
// Permite buscar y filtrar por estado y sucursal.
// PENDIENTE BACKEND:
// Confirmar cómo insumosService del backend
// utiliza el filtro sucursal_id.
export async function obtenerInsumos({
  activo,
  buscar = "",
  sucursalId = null,
} = {}) {
  const params = new URLSearchParams();

  if (activo !== undefined) {
    params.set("activo", String(activo));
  }

  if (buscar.trim()) {
    params.set("buscar", buscar.trim());
  }

  if (sucursalId != null) {
    params.set("sucursal_id", String(sucursalId));
  }

  const query = params.toString();

  return peticion(`/insumos${query ? `?${query}` : ""}`);
}

// GET /api/insumos?activo=false
// Obtiene los insumos deshabilitados.
export async function obtenerInsumosDeshabilitados(buscar = "") {
  return obtenerInsumos({
    activo: false,
    buscar,
  });
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
// Activa o desactiva un insumo.
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
// Busca existencias por nombre y sucursal.
//
// Si sucursalId es null, el backend utiliza
// la sucursal asignada al usuario autenticado.
//
// PENDIENTE BACKEND:
// Obtener la lista de sucursales disponibles
// para el administrador central.
export async function obtenerInventario(
  sucursalId = null,
  buscar = ""
) {
  const params = new URLSearchParams();

  if (sucursalId != null) {
    params.set("sucursal_id", String(sucursalId));
  }

  if (buscar.trim()) {
    params.set("buscar", buscar.trim());
  }

  const query = params.toString();

  return peticion(`/inventario${query ? `?${query}` : ""}`);
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
// Obtiene los insumos con existencias bajas.
export async function obtenerAlertas(
  sucursalId = null,
  buscar = ""
) {
  const params = new URLSearchParams();

  if (sucursalId != null) {
    params.set("sucursal_id", String(sucursalId));
  }

  if (buscar.trim()) {
    params.set("buscar", buscar.trim());
  }

  const query = params.toString();

  return peticion(`/inventario/alertas${query ? `?${query}` : ""}`);
}
