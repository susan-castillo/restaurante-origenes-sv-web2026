
import { useEffect, useState } from "react";

// ==========================================
// SERVICIOS
// ==========================================

import {
  obtenerInventario,
    obtenerInsumos,
  crearInsumo,
  actualizarInsumo,
} from "../services/insumosService";
import {
  obtenerProductos,
  obtenerReceta,
  crearProducto,
    guardarReceta,
} from "../services/recetasService";

// ==========================================
// COMPONENTES GENERALES
// ==========================================

import Button from "../components/Common/Button.jsx";
import Card from "../components/Common/Card.jsx";
import Tabs from "../components/Common/Tabs.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";
import { Pencil, Trash2, BookOpen } from "lucide-react";
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
// MODAL AGREGAR PRODUCTO
// ========================================

const [modalAgregarProducto, setModalAgregarProducto] = useState(false);

const [nombreProducto, setNombreProducto] = useState("");
const [categoriaProducto, setCategoriaProducto] = useState("");
const [precioProducto, setPrecioProducto] = useState("");
const [tipoProducto, setTipoProducto] = useState("ELABORADO");

const [guardandoProducto, setGuardandoProducto] = useState(false);
const [errorProductoModal, setErrorProductoModal] = useState("");

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
 // MODAL CREAR Y EDITAR RECETAS
 // ========================================

const [modalReceta, setModalReceta] = useState(false);
const [productoReceta, setProductoReceta] = useState(null);

const [catalogoInsumos, setCatalogoInsumos] = useState([]);
const [ingredientesFormulario, setIngredientesFormulario] = useState([]);

const [cargandoDatosReceta, setCargandoDatosReceta] = useState(false);
const [guardandoReceta, setGuardandoReceta] = useState(false);
const [errorRecetaModal, setErrorRecetaModal] = useState("");


  // ========================================
  // CARGAR INVENTARIO DEL BACKEND
  // ========================================

  
 // ========================================
 // ABRIR MODAL DE RECETA
 // ========================================

async function abrirModalReceta(producto, nueva = false) {
  setProductoReceta(producto);
  setIngredientesFormulario([]);
  setErrorRecetaModal("");
  setModalReceta(true);
  setCargandoDatosReceta(true);

  try {
    // Obtener los insumos disponibles
    const insumos = await obtenerInsumos();

    if (!Array.isArray(insumos)) {
      throw new Error("No se pudo cargar el catálogo de insumos.");
    }

    setCatalogoInsumos(insumos);

    // Al editar, cargar los ingredientes existentes
    if (!nueva) {
      const id = Number(producto.id ?? producto.platillo_id);
      const respuesta = await obtenerReceta(id);

      const items = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.items;

      if (!Array.isArray(items)) {
        throw new Error("La API devolvió una receta no válida.");
      }

      setIngredientesFormulario(
        items.map((item) => ({
          insumo_id: String(item.insumo_id),
          cantidad: String(item.cantidad),
        }))
      );
    }
  } catch (err) {
    setErrorRecetaModal(
      err.message || "No se pudo cargar la receta."
    );
  } finally {
    setCargandoDatosReceta(false);
  }
}

// ========================================
// AÑADIR INGREDIENTE
// ========================================

function agregarIngrediente() {
  setIngredientesFormulario((actuales) => {
    if (actuales.length >= 50) return actuales;

    return [
      ...actuales,
      { insumo_id: "", cantidad: "" },
    ];
  });
}

// ========================================
// MODIFICAR INGREDIENTE
// ========================================

function cambiarIngrediente(index, campo, valor) {
  setIngredientesFormulario((actuales) =>
    actuales.map((item, i) =>
      i === index
        ? { ...item, [campo]: valor }
        : item
    )
  );
}

// ========================================
// QUITAR INGREDIENTE
// ========================================

function quitarIngrediente(index) {
  setIngredientesFormulario((actuales) =>
    actuales.filter((_, i) => i !== index)
  );
}

// ========================================
// GUARDAR RECETA
// ========================================

async function guardarCambiosReceta() {
  if (!productoReceta || guardandoReceta) return;

  const id = Number(
    productoReceta.id ?? productoReceta.platillo_id
  );

  if (!Number.isInteger(id) || id <= 0) {
    setErrorRecetaModal("El producto no tiene un ID válido.");
    return;
  }

  const items = ingredientesFormulario.map((item) => ({
    insumo_id: Number(item.insumo_id),
    cantidad: Number(item.cantidad),
  }));

  // Validar ingredientes y cantidades
  for (let i = 0; i < items.length; i++) {
    if (!Number.isInteger(items[i].insumo_id) ||
        items[i].insumo_id <= 0) {
      setErrorRecetaModal(
        `Selecciona un insumo para el ingrediente ${i + 1}.`
      );
      return;
    }

    if (
      ingredientesFormulario[i].cantidad.trim() === "" ||
      !Number.isFinite(items[i].cantidad) ||
      items[i].cantidad <= 0
    ) {
      setErrorRecetaModal(
        `Ingresa una cantidad válida para el ingrediente ${i + 1}.`
      );
      return;
    }
  }

  // Evitar ingredientes duplicados
  const ids = items.map((item) => item.insumo_id);

  if (new Set(ids).size !== ids.length) {
    setErrorRecetaModal(
      "No puedes agregar el mismo insumo dos veces."
    );
    return;
  }

  try {
    setGuardandoReceta(true);
    setErrorRecetaModal("");

    // Guardar en el backend
    await guardarReceta(id, items);

    // Actualizar la tarjeta con los datos guardados
    const respuesta = await obtenerReceta(id);

    const ingredientes = Array.isArray(respuesta)
      ? respuesta
      : respuesta?.items;

    if (Array.isArray(ingredientes)) {
      setRecetas((actuales) => ({
        ...actuales,
        [id]: ingredientes,
      }));
    }

    setErroresRecetas((actuales) => ({
      ...actuales,
      [id]: "",
    }));

    setModalReceta(false);
    setProductoReceta(null);

  } catch (err) {
    setErrorRecetaModal(
      err.message || "No se pudo guardar o actualizar la receta."
    );
  } finally {
    setGuardandoReceta(false);
  }
}


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

  async function cargarProductosYRecetas() {
    try {
      setCargandoProductos(true);
      setErrorProductos("");
      setErroresRecetas({});
      setRecetas({});

      const datos = await obtenerProductos();

      if (!activo) return;

      if (!Array.isArray(datos)) {
        throw new Error(
          "La API no devolvió una lista de productos."
        );
      }

      setProductos(datos);

      // Cargar automáticamente las recetas
      const productosElaborados = datos.filter(
        (producto) => producto.tipo === "ELABORADO"
      );

      const resultados = await Promise.allSettled(
        productosElaborados.map(async (producto) => {
          const id = Number(producto.id ?? producto.platillo_id);

          if (!Number.isInteger(id) || id <= 0) {
            throw new Error(`Producto con id inválido: ${producto.nombre}`);
          }

          const respuesta = await obtenerReceta(id);

          const ingredientes = Array.isArray(respuesta)
            ? respuesta
            : respuesta?.items;

          if (!Array.isArray(ingredientes)) {
            throw new Error("La receta no devolvió un arreglo válido.");
          }

          return { id, ingredientes };
        })
      );

      if (!activo) return;

      const nuevasRecetas = {};
      const nuevosErrores = {};

      resultados.forEach((resultado, index) => {
        const producto = productosElaborados[index];
        const id = Number(producto.id ?? producto.platillo_id);

        if (resultado.status === "fulfilled") {
          nuevasRecetas[id] = resultado.value.ingredientes;
        } else {
          nuevasRecetas[id] = [];
          nuevosErrores[id] =
            resultado.reason?.message || "No se pudo cargar la receta.";
        }
      });

      setRecetas(nuevasRecetas);
      setErroresRecetas(nuevosErrores);

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

  cargarProductosYRecetas();

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


const productosFiltrados = productos
  .filter((producto) => {
    if (filtroProductos === "todos") {
      return true;
    }

    return producto.tipo === filtroProductos;
  })
  .sort((a, b) => {
    const idA = Number(a.id ?? a.platillo_id);
    const idB = Number(b.id ?? b.platillo_id);

    return idB - idA;
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
 // AGREGAR PRODUCTO
 // ========================================

function abrirAgregarProducto() {
  setNombreProducto("");
  setCategoriaProducto("");
  setPrecioProducto("");
  setTipoProducto("ELABORADO");
  setErrorProductoModal("");

  setModalAgregarProducto(true);
}


async function guardarNuevoProducto() {
  const nombre = nombreProducto.trim();
  const categoria = categoriaProducto.trim();
  const precio = Number(precioProducto);

  if (!nombre || nombre.length > 100) {
    setErrorProductoModal("Ingresa un nombre válido.");
    return;
  }

  if (
    precioProducto.trim() === "" ||
    !Number.isFinite(precio) ||
    precio < 0 ||
    precio > 999999.99
  ) {
    setErrorProductoModal("Ingresa un precio válido.");
    return;
  }

  try {
    setGuardandoProducto(true);
    setErrorProductoModal("");

    const nuevoProducto = await crearProducto({
      nombre,
      categoria,
      precio,
      tipo: tipoProducto,
      activo: true,
    });

    setModalAgregarProducto(false);
    setFiltroProductos("todos");

    // Actualizar productos visibles sin volver a crearlos
    try {
      const datos = await obtenerProductos();

      if (Array.isArray(datos)) {
        setProductos(datos);
      } else {
        setProductos((actuales) => [
          nuevoProducto,
          ...actuales,
        ]);
      }
    } catch {
      setProductos((actuales) => [
        nuevoProducto,
        ...actuales,
      ]);
    }

    // Si es elaborado, configurar su receta
    if (tipoProducto === "ELABORADO") {
      const id = Number(
        nuevoProducto?.id ?? nuevoProducto?.platillo_id
      );

      if (Number.isInteger(id) && id > 0) {
        await abrirModalReceta(nuevoProducto, true);
      } else {
        setErrorProductos(
          "Producto creado. Actualiza la lista para configurar su receta."
        );
      }
    }

  } catch (err) {
    setErrorProductoModal(
      err.message || "No se pudo crear el producto."
    );
  } finally {
    setGuardandoProducto(false);
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

{vista === "existencias" ? (
  <Button
    text="Agregar insumo"
    variant="secondary"
    className="text-white"
    onClick={abrirAgregar}
  />
) : (
  <Button
    text="Agregar producto"
    variant="secondary"
    className="text-white"
    onClick={abrirAgregarProducto}
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

            
{/* ========================================
    TARJETAS DE PRODUCTOS Y RECETAS
    ======================================== */}

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

        // ====================================
        // DATOS DEL PRODUCTO
        // ====================================
        const id = Number(
          producto.id ?? producto.platillo_id
        );

        if (!Number.isInteger(id) || id <= 0) {
          console.warn(
            "Producto sin identificador válido:",
            producto
          );
          return null;
        }

        const esElaborado =
          producto.tipo === "ELABORADO";

        const recetaAbierta =
          Object.prototype.hasOwnProperty.call(
            recetas,
            id
          );

        const cargandoEstaReceta =
          cargandoReceta === id;

        // ====================================
        // RENDERIZAR TARJETA
        // ====================================

        return (

          <div
            className="col-12 col-md-6"
            key={id}
          >

            <Card
              className={`receta-card ${
                esElaborado
                  ? "receta-card--elaborado"
                  : "receta-card--reventa"
              }`}
            >

              {/* ENCABEZADO */}

              <div className="receta-card-encabezado">

                <span className="receta-tipo-texto">
                  {esElaborado
                    ? "ELABORADO"
                    : "REVENTA"}
                </span>

                <span className="receta-precio">
                  ${Number(producto.precio).toFixed(2)}
                </span>

              </div>

              {/* INFORMACIÓN DEL PRODUCTO */}

<div className="receta-producto-acciones">

  <h3 className="receta-nombre">
    {producto.nombre}
  </h3>

  {esElaborado && (
    <button
      type="button"
      className="receta-icono-editar"
      title="Agregar o editar receta"
      aria-label={`Editar receta de ${producto.nombre}`}
      onClick={() => abrirModalReceta(producto)}
    >
      <BookOpen size={19} />
    </button>
  )}

</div>

              <p className="receta-descripcion">
                {producto.categoria || "Sin categoría"}
              </p>

              {/* =================================
                  RECETA DEL PRODUCTO ELABORADO
                  ================================= */}

<div className="receta-detalle">

  {esElaborado ? (
    <>
      <div className="receta-ingredientes">
        <h4>Receta por unidad</h4>

        {erroresRecetas[id] ? (
          <p className="text-danger mb-0" role="alert">
            {erroresRecetas[id]}
          </p>
        ) : !Object.prototype.hasOwnProperty.call(recetas, id) ? (
          <p className="mb-0">Cargando receta...</p>
        ) : recetas[id].length === 0 ? (
          <p className="mb-0">Sin ingredientes registrados.</p>
        ) : (
          <div className="receta-ingredientes-lista">
            {recetas[id].map((item, index) => (
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
                  {Number(item.cantidad).toLocaleString("es-SV", {
                    maximumFractionDigits: 3,
                  })}{" "}
                  {item.insumo?.unidad ??
                    item.unidad ??
                    ""}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="receta-reventa-info">
      <h4>Producto de reventa</h4>
      <p className="mb-0">
        Este producto no requiere receta de preparación.
      </p>
    </div>
  )}

</div>

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



{/* ========================================
    MODAL AGREGAR PRODUCTO
    ======================================== */}

<Modal
  show={modalAgregarProducto}
  title="Agregar producto"
  onClose={() => {
    if (!guardandoProducto) {
      setModalAgregarProducto(false);
    }
  }}
  footer={
    <>
      <Button
        text="Cancelar"
        variant="outline-secondary"
        disabled={guardandoProducto}
        onClick={() => setModalAgregarProducto(false)}
      />

      <Button
        text={guardandoProducto ? "Guardando..." : "Agregar producto"}
        variant="secondary"
        disabled={
          guardandoProducto ||
          !nombreProducto.trim() ||
          precioProducto.trim() === ""
        }
        onClick={guardarNuevoProducto}
      />
    </>
  }
>
  {/* NOMBRE DEL PRODUCTO */}

  <div className="mb-3">
    <label
      className="form-label"
      htmlFor="producto-nombre"
    >
      Nombre del producto
    </label>

    <input
      id="producto-nombre"
      type="text"
      className="form-control"
      placeholder="Ej. Cappuccino"
      value={nombreProducto}
      maxLength={100}
      onChange={(e) => setNombreProducto(e.target.value)}
    />
  </div>

  {/* CATEGORÍA */}

  <div className="mb-3">
    <label
      className="form-label"
      htmlFor="producto-categoria"
    >
      Categoría
    </label>

    <input
      id="producto-categoria"
      type="text"
      className="form-control"
      placeholder="Ej. Bebidas calientes"
      value={categoriaProducto}
      maxLength={50}
      onChange={(e) => setCategoriaProducto(e.target.value)}
    />
  </div>

  {/* PRECIO */}

  <div className="mb-3">
    <label
      className="form-label"
      htmlFor="producto-precio"
    >
      Precio de venta ($)
    </label>

    <input
      id="producto-precio"
      type="number"
      className="form-control"
      placeholder="Ej. 2.75"
      min="0"
      max="999999.99"
      step="0.01"
      value={precioProducto}
      onChange={(e) => setPrecioProducto(e.target.value)}
    />
  </div>

  {/* TIPO DE PRODUCTO */}

  <div className="mb-3">
    <label
      className="form-label"
      htmlFor="producto-tipo"
    >
      Tipo de producto
    </label>

    <select
      id="producto-tipo"
      className="form-select"
      value={tipoProducto}
      onChange={(e) => setTipoProducto(e.target.value)}
    >
      <option value="ELABORADO">
        Elaborado (requiere receta)
      </option>

      <option value="REVENTA">
        Reventa (sin receta)
      </option>
    </select>
  </div>

  {/* MENSAJE DE ERROR */}

  {errorProductoModal && (
    <div className="alert alert-danger" role="alert">
      {errorProductoModal}
    </div>
  )}
</Modal>


{/* ========================================
    MODAL AGREGAR / EDITAR RECETA
    ======================================== */}

<Modal
  show={modalReceta}
  title={`Receta: ${productoReceta?.nombre || ""}`}
  size="lg"
  onClose={() => {
    if (!guardandoReceta) setModalReceta(false);
  }}
  footer={
    <>
      <Button
        text="Cancelar"
        variant="outline-secondary"
        disabled={guardandoReceta}
        onClick={() => setModalReceta(false)}
      />

      <Button
        text={guardandoReceta ? "Guardando..." : "Guardar receta"}
        variant="secondary"
        disabled={
          guardandoReceta ||
          cargandoDatosReceta ||
          Boolean(errorRecetaModal)
        }
        onClick={guardarCambiosReceta}
      />
    </>
  }
>
  <p className="text-muted mb-3">
    Selecciona los ingredientes y las cantidades
    necesarias para preparar una unidad del producto.
  </p>

  {cargandoDatosReceta ? (
    <p role="status">Cargando ingredientes...</p>
  ) : (
    <>
      {ingredientesFormulario.map((item, index) => {
        const insumoSeleccionado = catalogoInsumos.find(
          (insumo) => insumo.id === Number(item.insumo_id)
        );

        return (
          <div
            key={index}
            className="row g-2 align-items-end mb-3"
          >
            {/* INSUMO */}

            <div className="col-12 col-md-6">
              <label className="form-label">
                Ingrediente {index + 1}
              </label>

              <select
                className="form-select"
                value={item.insumo_id}
                onChange={(e) =>
                  cambiarIngrediente(
                    index,
                    "insumo_id",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar insumo
                </option>

                {catalogoInsumos.map((insumo) => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* CANTIDAD */}

            <div className="col-8 col-md-4">
              <label className="form-label">
                Cantidad
                {insumoSeleccionado
                  ? ` (${insumoSeleccionado.unidad})`
                  : ""}
              </label>

              <input
                type="number"
                className="form-control"
                min="0.001"
                step="0.001"
                value={item.cantidad}
                placeholder="Ej. 18"
                onChange={(e) =>
                  cambiarIngrediente(
                    index,
                    "cantidad",
                    e.target.value
                  )
                }
              />
            </div>

            {/* ELIMINAR INGREDIENTE */}

            <div className="col-4 col-md-2">
              <button
                type="button"
                className="btn btn-outline-danger w-100"
                title="Quitar ingrediente"
                aria-label={`Quitar ingrediente ${index + 1}`}
                onClick={() => quitarIngrediente(index)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      })}

      <Button
        text="+ Añadir ingrediente"
        variant="outline-secondary"
        disabled={ingredientesFormulario.length >= 50}
        onClick={() => {
          setErrorRecetaModal("");
          agregarIngrediente();
        }}
      />

      {ingredientesFormulario.length === 0 && (
        <p className="text-muted mt-3">
          Esta receta todavía no tiene ingredientes.
        </p>
      )}
    </>
  )}

  {errorRecetaModal && (
    <div className="alert alert-danger mt-3" role="alert">
      {errorRecetaModal}
    </div>
  )}
</Modal>



    </div>
  );
}
