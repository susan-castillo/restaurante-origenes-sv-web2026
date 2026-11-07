
import { useEffect, useState } from "react";

// ==========================================
// SERVICIOS
// ==========================================

import {
  obtenerInventario,
  crearInsumo,
  actualizarInsumo,
} from "../services/insumosService";import {
  obtenerProductos,
  obtenerReceta,
} from "../services/recetasService";

// ==========================================
// COMPONENTES GENERALES
// ==========================================

import Button from "../components/Common/Button.jsx";
import Card from "../components/Common/Card.jsx";
import Tabs from "../components/Common/Tabs.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";
import { Pencil, Trash2 } from "lucide-react";
import Modal from "../components/Common/Modal.jsx";
// ==========================================
// OPCIONES DE NAVEGACIÓN
// ==========================================

const vistas = [
  { value: "existencias", label: "Existencias" },
  { value: "recetas", label: "Productos y recetas" },
];

const filtros = [
  { value: "todos", label: "Todos" },
  { value: "bajo", label: "Bajo mínimo" },
  { value: "agotados", label: "Agotados" },
];

const filtrosProductos = [
  { value: "todos", label: "Todos" },
  { value: "ELABORADO", label: "Elaborados" },
  { value: "REVENTA", label: "Reventa" },
];

// ==========================================
// ESTADO VISUAL DEL INVENTARIO
// ==========================================

function obtenerEstado(item) {
  const stock = Number(item.stock_actual);
  const minimo = Number(item.stock_minimo);

  if (stock <= 0) {
    return {
      texto: "Agotado",
      variante: "danger",
      codigo: "agotados",
    };
  }

  if (stock < minimo) {
    return {
      texto: "Bajo mínimo",
      variante: "warning",
      codigo: "bajo",
    };
  }

  return {
    texto: "Disponible",
    variante: "success",
    codigo: "disponible",
  };
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function InventarioPage() {

  // ========================================
  // ESTADOS GENERALES
  // ========================================

  const [vista, setVista] = useState("existencias");

  // ========================================
  // ESTADOS DE EXISTENCIAS
  // ========================================

  const [filtro, setFiltro] = useState("todos");

  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // ESTADOS DE PRODUCTOS Y RECETAS
  // ========================================

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState("");

  const [filtroProductos, setFiltroProductos] = useState("todos");

  const [recetas, setRecetas] = useState({});
  const [cargandoReceta, setCargandoReceta] = useState(null);
  const [erroresRecetas, setErroresRecetas] = useState({});

  // ========================================
// MODALES DE INSUMOS
// ========================================

const [modalEditar, setModalEditar] = useState(false);
const [modalEliminar, setModalEliminar] = useState(false);
const [modalAgregar, setModalAgregar] = useState(false);

const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);

const [nombreInsumo, setNombreInsumo] = useState("");
const [unidadInsumo, setUnidadInsumo] = useState("g");

const [guardandoInsumo, setGuardandoInsumo] = useState(false);
const [errorModal, setErrorModal] = useState("");

  // ========================================
  // CARGAR INVENTARIO DEL BACKEND
  // ========================================

  useEffect(() => {
    let activo = true;

    async function cargarInventario() {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerInventario();

        if (!activo) return;

        if (!Array.isArray(datos)) {
          throw new Error(
            "La API no devolvió una lista de inventario."
          );
        }

        setInventario(datos);

      } catch (err) {
        if (activo) {
          setError(
            err.message || "No se pudo cargar el inventario."
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarInventario();

    return () => {
      activo = false;
    };
  }, []);

  // ========================================
  // CARGAR PRODUCTOS DEL BACKEND
  // ========================================

  useEffect(() => {
    if (vista !== "recetas") return;

    let activo = true;

    async function cargarProductos() {
      try {
        setCargandoProductos(true);
        setErrorProductos("");

        const datos = await obtenerProductos();

        if (!activo) return;

        if (!Array.isArray(datos)) {
          throw new Error(
            "La API no devolvió una lista de productos."
          );
        }

        setProductos(datos);

      } catch (err) {
        if (activo) {
          setErrorProductos(
            err.message || "No se pudieron cargar los productos."
          );
        }
      } finally {
        if (activo) {
          setCargandoProductos(false);
        }
      }
    }

    cargarProductos();

    return () => {
      activo = false;
    };
  }, [vista]);

  // ========================================
  // FILTRAR EXISTENCIAS
  // ========================================

  const inventarioFiltrado = inventario.filter((item) => {
    if (filtro === "todos") {
      return true;
    }

    const estado = obtenerEstado(item);

    return estado.codigo === filtro;
  });

  // ========================================
  // FILTRAR PRODUCTOS
  // ========================================

  const productosFiltrados = productos.filter((producto) => {
    if (filtroProductos === "todos") {
      return true;
    }

    return producto.tipo === filtroProductos;
  });

  // ========================================
  // CONSULTAR Y MOSTRAR RECETAS
  // ========================================

  async function verReceta(id) {

    // Si ya está abierta, la ocultamos.
    if (Object.prototype.hasOwnProperty.call(recetas, id)) {
      setRecetas((actuales) => {
        const copia = { ...actuales };
        delete copia[id];
        return copia;
      });

      return;
    }

    try {
      setCargandoReceta(id);

      setErroresRecetas((actuales) => ({
        ...actuales,
        [id]: "",
      }));

      const datos = await obtenerReceta(id);

      // Se admiten dos formatos comunes de respuesta.
      const ingredientes = Array.isArray(datos)
        ? datos
        : datos?.items;

      if (!Array.isArray(ingredientes)) {
        throw new Error(
          "La API no devolvió una lista de ingredientes."
        );
      }

      setRecetas((actuales) => ({
        ...actuales,
        [id]: ingredientes,
      }));

    } catch (err) {
      setErroresRecetas((actuales) => ({
        ...actuales,
        [id]: err.message || "No se pudo cargar la receta.",
      }));
    } finally {
      setCargandoReceta(null);
    }
  }

  
function abrirEditar(item) {
  setInsumoSeleccionado(item);
  setNombreInsumo(item.nombre);
  setUnidadInsumo(item.unidad);
  setErrorModal("");
  setModalEditar(true);
}

function abrirEliminar(item) {
  setInsumoSeleccionado(item);
  setModalEliminar(true);
}

async function guardarCambiosInsumo() {
  if (!insumoSeleccionado) return;

  try {
    setGuardandoInsumo(true);
    setErrorModal("");

    await actualizarInsumo(insumoSeleccionado.insumo_id, {
      nombre: nombreInsumo.trim(),
      unidad: unidadInsumo,
    });

    // Recargamos las existencias desde el backend.
    const datos = await obtenerInventario();
    setInventario(datos);

    setModalEditar(false);
    setInsumoSeleccionado(null);

  } catch (err) {
    setErrorModal(
      err.message || "No se pudo actualizar el insumo."
    );
  } finally {
    setGuardandoInsumo(false);
  }
}


 // ========================================
 // AGREGAR INSUMO
 // ========================================

function abrirAgregar() {
  // Limpiar el formulario
  setNombreInsumo("");
  setUnidadInsumo("g");
  setErrorModal("");

  // Abrir el modal
  setModalAgregar(true);
}

async function guardarNuevoInsumo() {
  const nombre = nombreInsumo.trim();

  if (!nombre) {
    setErrorModal("El nombre del insumo es obligatorio.");
    return;
  }

  try {
    setGuardandoInsumo(true);
    setErrorModal("");

    // Registrar el insumo en PostgreSQL
    await crearInsumo({
      nombre,
      unidad: unidadInsumo,
    });

    // Volver a consultar las existencias
    const datos = await obtenerInventario();

    if (!Array.isArray(datos)) {
      throw new Error("No se pudo actualizar la tabla de existencias.");
    }

    setInventario(datos);

    // Cerrar y limpiar el formulario
    setModalAgregar(false);
    setNombreInsumo("");
    setUnidadInsumo("g");

  } catch (err) {
    setErrorModal(
      err.message || "No se pudo registrar el insumo."
    );
  } finally {
    setGuardandoInsumo(false);
  }
}



  // ========================================
  // RENDERIZADO PRINCIPAL
  // ========================================

  return (
    <div className="inventario-page">

      {/* ===================================
          ENCABEZADO
          =================================== */}

      <header className="inventario-header">

        <div>
          <h1 className="inventario-titulo">
            Inventario y recetas
          </h1>

          <p className="inventario-subtitulo">
            Existencias de la sucursal
          </p>
        </div>

{vista === "existencias" && (
  <Button
    text="Agregar insumo"
    variant="secondary"
    className="text-white"
    onClick={abrirAgregar}
  />
)}

      </header>

      {/* ===================================
          PESTAÑAS PRINCIPALES
          =================================== */}

      <Tabs
        options={vistas}
        value={vista}
        onChange={setVista}
      />

      {/* ===================================
          CONTENIDO PRINCIPAL
          =================================== */}

      <main className="inventario-contenido">

        {vista === "existencias" ? (

          // ===================================
          // EXISTENCIAS
          // ===================================

          <section>

            {/* FILTROS DE INVENTARIO */}

            <div className="inventario-filtros">
              <Tabs
                variant="pills"
                options={filtros}
                value={filtro}
                onChange={setFiltro}
              />
            </div>

            {/* MENSAJE DE CARGA */}

            {cargando && (
              <div
                className="inventario-mensaje"
                role="status"
              >
                Cargando existencias...
              </div>
            )}

            {/* MENSAJE DE ERROR */}

            {!cargando && error && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* TABLA DE EXISTENCIAS */}

            {!cargando && !error && (

              <div className="inventario-tabla-contenedor">

                <table className="inventario-tabla">

                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Existencia</th>
                      <th>Mínimo</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>

                    {inventarioFiltrado.length === 0 ? (

                      <tr>
                        <td
                          colSpan={5}
                          className="inventario-mensaje"
                        >
                          {filtro === "todos"
                            ? "No hay insumos registrados."
                            : "No hay insumos que coincidan con este filtro."}
                        </td>
                      </tr>

                    ) : (

                      inventarioFiltrado.map((item) => {

                        const stock = Number(item.stock_actual);
                        const minimo = Number(item.stock_minimo);
                        const estado = obtenerEstado(item);

                        return (
                          <tr key={item.insumo_id}>

                            {/* NOMBRE DEL INSUMO */}

                            <td className="inventario-nombre">
                              {item.nombre}
                            </td>

                            {/* EXISTENCIA ACTUAL */}

                            <td>
                              {stock.toLocaleString("es-SV")}{" "}
                              {item.unidad}
                            </td>

                            {/* STOCK MÍNIMO */}

                            <td>
                              {minimo.toLocaleString("es-SV")}{" "}
                              {item.unidad}
                            </td>

                            {/* ESTADO */}

                            <td>
                              <StatusBadge
                                text={estado.texto}
                                variant={estado.variante}
                              />
                            </td>


{/* ACCIONES */}

<td>
  <div className="inventario-acciones">

    {/* EDITAR */}

    <button
      type="button"
      className="inventario-icono inventario-icono--editar"
      title="Editar insumo"
      aria-label={`Editar ${item.nombre}`}
      onClick={() => abrirEditar(item)}
    >
      <Pencil size={18} />
    </button>

    {/* ELIMINAR */}

    <button
      type="button"
      className="inventario-icono inventario-icono--eliminar"
      title="Eliminar insumo"
      aria-label={`Eliminar ${item.nombre}`}
      onClick={() => abrirEliminar(item)}
    >
      <Trash2 size={18} />
    </button>

  </div>
</td>


                          </tr>
                        );
                      })

                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        ) : (

          // ===================================
          // PRODUCTOS Y RECETAS
          // ===================================

          <section className="recetas-seccion">

            {/* FILTROS DE PRODUCTOS */}

            <div className="recetas-filtros">
              <Tabs
                variant="pills"
                options={filtrosProductos}
                value={filtroProductos}
                onChange={setFiltroProductos}
              />
            </div>

            {/* MENSAJE DE CARGA */}

            {cargandoProductos && (
              <div
                className="inventario-mensaje"
                role="status"
              >
                Cargando productos...
              </div>
            )}

            {/* MENSAJE DE ERROR */}

            {!cargandoProductos && errorProductos && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                {errorProductos}
              </div>
            )}

            {/* TARJETAS DE PRODUCTOS */}

            {!cargandoProductos && !errorProductos && (

              <div className="row g-3">

                {productosFiltrados.length === 0 ? (

                  <div className="col-12">
                    <p className="inventario-mensaje">
                      No hay productos registrados para este filtro.
                    </p>
                  </div>

                ) : (

                  productosFiltrados.map((producto) => {

                    const id = producto.platillo_id;
                    const recetaAbierta =
                      Object.prototype.hasOwnProperty.call(recetas, id);

                    return (

                      <div
                        className="col-12 col-md-6"
                        key={id}
                      >

                        <Card className="receta-card">

                          {/* ENCABEZADO DE TARJETA */}

                          <div className="receta-card-encabezado">

                            <span className="receta-tipo">
                              {producto.tipo === "ELABORADO"
                                ? "ELABORADO"
                                : "REVENTA"}
                            </span>

                            <span className="receta-precio">
                              ${Number(producto.precio).toFixed(2)}
                            </span>

                          </div>

                          {/* INFORMACIÓN DEL PRODUCTO */}

                          <h3 className="receta-nombre">
                            {producto.nombre}
                          </h3>

                          <p className="receta-descripcion">
                            {producto.categoria || "Sin categoría"}
                          </p>

                          {/* RECETA DEL PRODUCTO ELABORADO */}

                          {producto.tipo === "ELABORADO" && (

                            <div className="receta-detalle">

                              <Button
                                text={
                                  cargandoReceta === id
                                    ? "Cargando..."
                                    : recetaAbierta
                                      ? "Ocultar receta"
                                      : "Ver receta"
                                }
                                variant="secondary"
                                disabled={cargandoReceta === id}
                                onClick={() => verReceta(id)}
                              />

                              {/* INGREDIENTES */}

                              {recetaAbierta && (

                                <div className="receta-ingredientes">

                                  <h4>
                                    Receta por unidad
                                  </h4>

                                  {recetas[id].length === 0 ? (

                                    <p>
                                      Sin ingredientes registrados.
                                    </p>

                                  ) : (

                                    recetas[id].map((item, index) => (

                                      <div
                                        key={item.insumo_id ?? index}
                                        className="receta-ingrediente"
                                      >

                                        <span>
                                          {item.insumo?.nombre ??
                                            item.nombre ??
                                            `Insumo ${item.insumo_id}`}
                                        </span>

                                        <strong>
                                          {item.cantidad}{" "}
                                          {item.insumo?.unidad ??
                                            item.unidad ??
                                            ""}
                                        </strong>

                                      </div>

                                    ))

                                  )}

                                </div>

                              )}

                              {/* ERROR DE RECETA */}

                              {erroresRecetas[id] && (

                                <p
                                  className="text-danger mt-2"
                                  role="alert"
                                >
                                  {erroresRecetas[id]}
                                </p>

                              )}

                            </div>

                          )}

                        </Card>

                      </div>

                    );
                  })

                )}

              </div>

            )}

          </section>

        )}

      </main>
      
{/* ========================================
    MODAL EDITAR INSUMO
    ======================================== */}

<Modal
  show={modalEditar}
  title="Editar insumo"
  onClose={() => {
    if (!guardandoInsumo) setModalEditar(false);
  }}
  footer={
    <>
      <Button
        text="Cancelar"
        variant="outline-secondary"
        disabled={guardandoInsumo}
        onClick={() => setModalEditar(false)}
      />

      <Button
        text={guardandoInsumo ? "Guardando..." : "Guardar cambios"}
        variant="secondary"
        disabled={guardandoInsumo || !nombreInsumo.trim()}
        onClick={guardarCambiosInsumo}
      />
    </>
  }
>
  <div className="mb-3">
    <label className="form-label">
      Nombre del insumo
    </label>

    <input
      type="text"
      className="form-control"
      value={nombreInsumo}
      maxLength={100}
      onChange={(e) => setNombreInsumo(e.target.value)}
    />
  </div>

  <div className="mb-3">
    <label className="form-label">
      Unidad de medida
    </label>

    <select
      className="form-select"
      value={unidadInsumo}
      onChange={(e) => setUnidadInsumo(e.target.value)}
    >
      <option value="g">Gramos (g)</option>
      <option value="ml">Mililitros (ml)</option>
      <option value="unidad">Unidad</option>
    </select>
  </div>

  {errorModal && (
    <div className="alert alert-danger" role="alert">
      {errorModal}
    </div>
  )}
</Modal>

{/* ========================================
    MODAL ELIMINAR INSUMO
    ======================================== */}

<Modal
  show={modalEliminar}
  title="Eliminar insumo"
  onClose={() => setModalEliminar(false)}
  footer={
    <>
      <Button
        text="Cancelar"
        variant="outline-secondary"
        onClick={() => setModalEliminar(false)}
      />

      <Button
        text="Eliminar"
        variant="danger"
        disabled
        title="La eliminación todavía no está disponible en el backend"
      />
    </>
  }
>
  <p>
    ¿Estás segura de que deseas eliminar el insumo{" "}
    <strong>{insumoSeleccionado?.nombre}</strong>?
  </p>

  <div className="alert alert-warning mb-0">
    La eliminación todavía no está habilitada en el backend.
    Por ahora este formulario es solamente visual.
  </div>
</Modal>


{/* ========================================
    MODAL AGREGAR INSUMO
    ======================================== */}

<Modal
  show={modalAgregar}
  title="Agregar insumo"
  onClose={() => {
    if (!guardandoInsumo) {
      setModalAgregar(false);
    }
  }}
  footer={
    <>
      <Button
        text="Cancelar"
        variant="outline-secondary"
        disabled={guardandoInsumo}
        onClick={() => setModalAgregar(false)}
      />

      <Button
        text={guardandoInsumo ? "Guardando..." : "Agregar insumo"}
        variant="secondary"
        disabled={guardandoInsumo || !nombreInsumo.trim()}
        onClick={guardarNuevoInsumo}
      />
    </>
  }
>
  {/* NOMBRE DEL INSUMO */}

  <div className="mb-3">
    <label className="form-label" htmlFor="nuevo-insumo-nombre">
      Nombre del insumo
    </label>

    <input
      id="nuevo-insumo-nombre"
      type="text"
      className="form-control"
      placeholder="Ej. Café en grano"
      value={nombreInsumo}
      maxLength={100}
      onChange={(e) => setNombreInsumo(e.target.value)}
    />
  </div>

  {/* UNIDAD DE MEDIDA */}

  <div className="mb-3">
    <label className="form-label" htmlFor="nuevo-insumo-unidad">
      Unidad de medida
    </label>

    <select
      id="nuevo-insumo-unidad"
      className="form-select"
      value={unidadInsumo}
      onChange={(e) => setUnidadInsumo(e.target.value)}
    >
      <option value="g">Gramos (g)</option>
      <option value="ml">Mililitros (ml)</option>
      <option value="unidad">Unidad</option>
    </select>
  </div>

  {/* MENSAJE DE ERROR */}

  {errorModal && (
    <div className="alert alert-danger" role="alert">
      {errorModal}
    </div>
  )}
</Modal>



    </div>
  );
}
