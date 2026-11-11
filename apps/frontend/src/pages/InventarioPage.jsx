

import { useEffect, useRef, useState } from "react";
import { escucharCambiosInventario } from "../services/inventarioEventos.js";

// ==========================================

// SERVICIOS

// ==========================================

import {

  obtenerInventario,

    obtenerInsumos,

  crearInsumo,

  actualizarInsumo,
  cambiarEstadoInsumo,

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

import {Pencil, Ban, BookOpen, RotateCcw, Trash2} from "lucide-react";

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
  { value: "deshabilitados", label: "Deshabilitados" },

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
  const [revisionInventario, setRevisionInventario] = useState(0);

  useEffect(() => escucharCambiosInventario(() => {
    setRevisionInventario((revision) => revision + 1);
  }), []);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");
  const [insumosDeshabilitados, setInsumosDeshabilitados] = useState([]);
  const [cargandoDeshabilitados, setCargandoDeshabilitados] = useState(false);
  const [errorDeshabilitados, setErrorDeshabilitados] = useState("");
  const [habilitandoId, setHabilitandoId] = useState(null);
  const deshabilitadosCargaRef = useRef(null);

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
const [deshabilitandoInsumo, setDeshabilitandoInsumo] = useState(false);
const [errorEstadoInsumo, setErrorEstadoInsumo] = useState("");

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

  // Evita peticiones repetidas al cambiar entre pestañas.
  const productosCargaRef = useRef(null);
  const catalogoCargaRef = useRef(null);
  const recetasCacheRef = useRef(new Map());
  const recetasPendientesRef = useRef(new Map());
  const recetasVersionRef = useRef(new Map());
  const recetasErroresCacheRef = useRef(new Map());

  const extraerItems = (respuesta) => {
    const items = Array.isArray(respuesta) ? respuesta : respuesta?.items;
    if (!Array.isArray(items)) throw new Error("La API no devolvió una receta válida.");
    return items;
  };

  async function consultarReceta(id, { forzar = false } = {}) {
    if (!forzar && recetasCacheRef.current.has(id)) {
      return recetasCacheRef.current.get(id);
    }
    if (recetasPendientesRef.current.has(id)) {
      return recetasPendientesRef.current.get(id);
    }
    const version = recetasVersionRef.current.get(id) ?? 0;
    const tarea = obtenerReceta(id).then((respuesta) => {
      const items = extraerItems(respuesta);
      if ((recetasVersionRef.current.get(id) ?? 0) === version) {
        recetasCacheRef.current.set(id, items);
      }
      return items;
    }).finally(() => recetasPendientesRef.current.delete(id));
    recetasPendientesRef.current.set(id, tarea);
    return tarea;
  }

  async function consultarCatalogoInsumos() {
    if (!catalogoCargaRef.current) {
      catalogoCargaRef.current = obtenerInsumos().then((datos) => {
        if (!Array.isArray(datos)) throw new Error("No se pudo cargar el catálogo de insumos.");
        return datos;
      }).catch((error) => {
        catalogoCargaRef.current = null;
        throw error;
      });
    }
    return catalogoCargaRef.current;
  }

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
    const insumos = await consultarCatalogoInsumos();
    setCatalogoInsumos(insumos);
    if (!nueva) {
      const id = Number(producto.id ?? producto.platillo_id);
      const items = await consultarReceta(id);
      setIngredientesFormulario(items.map((item) => ({
        insumo_id: String(item.insumo_id),
        cantidad: String(item.cantidad),
      })));
    }
  } catch (err) {
    setErrorRecetaModal(err.message || "No se pudo cargar la receta.");
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

        // Guardar y refrescar solo esta receta, no todas las tarjetas.
    await guardarReceta(id, items);
    recetasVersionRef.current.set(id, (recetasVersionRef.current.get(id) ?? 0) + 1);
    recetasCacheRef.current.delete(id);
    recetasErroresCacheRef.current.delete(id);
    // Si había una lectura anterior pendiente, no la reutilizamos.
    recetasPendientesRef.current.delete(id);
    const ingredientes = await consultarReceta(id, { forzar: true });
    setRecetas((actuales) => ({ ...actuales, [id]: ingredientes }));

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

  }, [revisionInventario]);

  // Consultar los deshabilitados solo cuando se abre su filtro.
  // El servicio de insumos devuelve todo el catálogo (activos e inactivos).
  useEffect(() => {
    if (filtro !== "deshabilitados") return;
    let vigente = true;

    async function cargarDeshabilitados() {
      setCargandoDeshabilitados(true);
      setErrorDeshabilitados("");
      try {
        if (!deshabilitadosCargaRef.current) {
          deshabilitadosCargaRef.current = obtenerInsumos()
            .then((datos) => {
              if (!Array.isArray(datos)) {
                throw new Error("La API no devolvió un catálogo de insumos válido.");
              }
              return datos.filter((item) => item.activo === false);
            })
            .catch((err) => {
              deshabilitadosCargaRef.current = null;
              throw err;
            });
        }
        const datos = await deshabilitadosCargaRef.current;
        if (vigente) setInsumosDeshabilitados(datos);
      } catch (err) {
        if (vigente) setErrorDeshabilitados(err.message || "No se pudieron cargar los insumos deshabilitados.");
      } finally {
        if (vigente) setCargandoDeshabilitados(false);
      }
    }

    cargarDeshabilitados();
    return () => { vigente = false; };
  }, [filtro]);

  // ========================================

  // CARGAR PRODUCTOS DEL BACKEND

  // ========================================

useEffect(() => {
  if (vista !== "recetas") return;
  let activo = true;

  async function iniciarCarga() {
    try {
      setCargandoProductos(true);
      setErrorProductos("");

      // La promesa se reutiliza incluso si el usuario cambia de pestaña
      // antes de que termine. No se hacen nuevos GET al volver.
      if (!productosCargaRef.current) {
        productosCargaRef.current = obtenerProductos().then((datos) => {
          if (!Array.isArray(datos)) {
            throw new Error("La API no devolvió una lista de productos.");
          }
          return datos;
        }).catch((err) => {
          productosCargaRef.current = null;
          throw err;
        });
      }

      const datos = await productosCargaRef.current;
      if (!activo) return;
      setProductos(datos);

      // Se muestran las tarjetas enseguida; recetas se cargan progresivamente.
      setCargandoProductos(false);
      const elaborados = datos.filter((p) => p.tipo === "ELABORADO");
      const POR_LOTE = 3; // máximo 3 consultas simultáneas

      for (let i = 0; i < elaborados.length; i += POR_LOTE) {
        if (!activo) break;
        const lote = elaborados.slice(i, i + POR_LOTE);
        await Promise.all(lote.map(async (producto) => {
          const id = Number(producto.id ?? producto.platillo_id);
          if (!Number.isInteger(id) || id <= 0) return;
          // Un error anterior se reintenta solo cuando el usuario lo pide.
          if (recetasErroresCacheRef.current.has(id)) {
            if (activo) setErroresRecetas((prev) => ({
              ...prev, [id]: recetasErroresCacheRef.current.get(id),
            }));
            return;
          }
          // No volver a descargar una receta que ya esté cargada.
          if (recetasCacheRef.current.has(id)) {
            if (activo) setRecetas((prev) => ({
              ...prev, [id]: recetasCacheRef.current.get(id),
            }));
            return;
          }
          const version = recetasVersionRef.current.get(id) ?? 0;
          try {
            const items = await consultarReceta(id);
            if (activo && (recetasVersionRef.current.get(id) ?? 0) === version) {
              setRecetas((prev) => ({ ...prev, [id]: items }));
              recetasErroresCacheRef.current.delete(id);
              setErroresRecetas((prev) => ({ ...prev, [id]: "" }));
            }
          } catch (err) {
            const mensaje = err.message || "No se pudo cargar la receta.";
            recetasErroresCacheRef.current.set(id, mensaje);
            if (activo) setErroresRecetas((prev) => ({
              ...prev, [id]: mensaje,
            }));
          }
        }));
      }
    } catch (err) {
      if (activo) setErrorProductos(err.message || "No se pudieron cargar los productos.");
    } finally {
      if (activo) setCargandoProductos(false);
    }
  }
  iniciarCarga();
  return () => { activo = false; };
}, [vista]);

// ========================================

  // FILTRAR EXISTENCIAS

  // ========================================

  const inventarioFiltrado = filtro === "deshabilitados"
    ? insumosDeshabilitados.map((item) => ({
        ...item,
        insumo_id: item.id,
      }))
    : inventario.filter((item) => {
        if (filtro === "todos") return true;
        return obtenerEstado(item).codigo === filtro;
      });

  const cargandoExistencias = filtro === "deshabilitados" ? cargandoDeshabilitados : cargando;
  const errorExistencias = filtro === "deshabilitados" ? errorDeshabilitados : error;

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
  try {
    setCargandoReceta(id);
    recetasErroresCacheRef.current.delete(id);
    const items = await consultarReceta(id);
    setRecetas((prev) => ({ ...prev, [id]: items }));
    setErroresRecetas((prev) => ({ ...prev, [id]: "" }));
  } catch (err) {
    const mensaje = err.message || "No se pudo cargar la receta.";
    recetasErroresCacheRef.current.set(id, mensaje);
    setErroresRecetas((prev) => ({ ...prev, [id]: mensaje }));
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
  setErrorEstadoInsumo("");
  setModalEliminar(true);

}

async function confirmarDeshabilitarInsumo() {
  if (!insumoSeleccionado || deshabilitandoInsumo) return;

  const id = insumoSeleccionado.insumo_id;
  try {
    setDeshabilitandoInsumo(true);
    setErrorEstadoInsumo("");

    // Desactivación lógica: se conserva el registro en la base de datos.
    await cambiarEstadoInsumo(id, false);

    // Actualizar la vista sin otra petición de inventario.
    setInventario((actuales) =>
      actuales.filter((item) => item.insumo_id !== id)
    );
    // Actualizar los listados locales y permitir refrescar el catálogo.
    setInsumosDeshabilitados((anteriores) => [
      { ...insumoSeleccionado, id, activo: false },
      ...anteriores.filter((item) => item.id !== id),
    ]);
    deshabilitadosCargaRef.current = null;
    catalogoCargaRef.current = null;

    setModalEliminar(false);
    setInsumoSeleccionado(null);
  } catch (err) {
    setErrorEstadoInsumo(err.message || "No se pudo deshabilitar el insumo.");
  } finally {
    setDeshabilitandoInsumo(false);
  }
}

async function habilitarInsumo(item) {
  const id = Number(item.id ?? item.insumo_id);
  if (!Number.isInteger(id) || id <= 0 || habilitandoId !== null) return;

  try {
    setHabilitandoId(id);
    setErrorDeshabilitados("");
    await cambiarEstadoInsumo(id, true);

    // Refrescar existencias una sola vez para recuperar su stock real.
    setInsumosDeshabilitados((anteriores) =>
      anteriores.filter((insumo) => Number(insumo.id) !== id)
    );
    deshabilitadosCargaRef.current = null;
    catalogoCargaRef.current = null;

    try {
      const datos = await obtenerInventario();
      if (!Array.isArray(datos)) throw new Error("La API no devolvió una lista de inventario.");
      setInventario(datos);
      setError("");
    } catch (err) {
      setError(err.message || "No se pudieron actualizar las existencias.");
    }
  } catch (err) {
    setErrorDeshabilitados(err.message || "No se pudo habilitar el insumo.");
  } finally {
    setHabilitandoId(null);
  }
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
    catalogoCargaRef.current = null; // nuevos ingredientes disponibles en recetas

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

        // Actualizar catálogo local sin otro GET de /platillos.
    // Mantener la promesa en caché sincronizada con la creación.
    const anteriores = await (productosCargaRef.current ?? Promise.resolve(productos));
    const actualizados = [nuevoProducto, ...anteriores.filter((p) =>
      Number(p.id ?? p.platillo_id) !== Number(nuevoProducto.id ?? nuevoProducto.platillo_id)
    )];
    productosCargaRef.current = Promise.resolve(actualizados);
    setProductos(actualizados);
    if (tipoProducto === "ELABORADO") {
      const nuevoId = Number(nuevoProducto.id ?? nuevoProducto.platillo_id);
      if (Number.isInteger(nuevoId) && nuevoId > 0) {
        recetasCacheRef.current.set(nuevoId, []);
        setRecetas((prev) => ({ ...prev, [nuevoId]: [] }));
      }
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

    <div className="inventario-page" style={{ minWidth: 0, flex: "1 1 0%", maxWidth: "100%" }}>

      {/* ENCABEZADO */}

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

      {/* PESTAÑAS PRINCIPALES */}

      <Tabs

        options={vistas}

        value={vista}

        onChange={setVista}

      />

      {/* CONTENIDO PRINCIPAL */}

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

            {cargandoExistencias && (

              <div

                className="inventario-mensaje"

                role="status"

              >

                Cargando existencias...

              </div>

            )}

            {/* MENSAJE DE ERROR */}

            {!cargandoExistencias && errorExistencias && (

              <div

                className="alert alert-danger"

                role="alert"

              >

                {errorExistencias}

              </div>

            )}

            {/* TABLA DE EXISTENCIAS */}

            {!cargandoExistencias && !errorExistencias && (

              <div className="inventario-tabla-contenedor" style={{ maxHeight: "608px", overflowY: "auto" }}>

                <table className="inventario-tabla">

                  <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff" }}>

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

                          {filtro === "deshabilitados"
                            ? "No hay insumos deshabilitados."
                            : filtro === "todos"
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

                              {filtro === "deshabilitados"
                                ? "—"
                                : <>{stock.toLocaleString("es-SV")} {item.unidad}</>}

                            </td>

                            {/* STOCK MÍNIMO */}

                            <td>

                              {filtro === "deshabilitados"
                                ? "—"
                                : <>{minimo.toLocaleString("es-SV")} {item.unidad}</>}

                            </td>

                            {/* ESTADO */}

                            <td>

                              <StatusBadge

                                text={filtro === "deshabilitados" ? "Deshabilitado" : estado.texto}

                                variant={filtro === "deshabilitados" ? "danger" : estado.variante}

                              />

                            </td>

{/* ACCIONES */}
<td>
  {filtro === "deshabilitados" ? (
    <div className="inventario-acciones">
      <button
        type="button"
        className="inventario-icono inventario-icono--editar"
        title="Volver a habilitar insumo"
        aria-label={`Habilitar ${item.nombre}`}
        onClick={() => habilitarInsumo(item)}
        disabled={habilitandoId !== null}
      >
        <RotateCcw size={18} />
      </button>
    </div>
  ) : (


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

    {/* DESHABILITAR (sin borrar de la base de datos) */}

    <button

      type="button"

      className="inventario-icono inventario-icono--eliminar"

      title="Deshabilitar insumo"

      aria-label={`Deshabilitar ${item.nombre}`}

      onClick={() => abrirEliminar(item)}

    >

      <Ban size={18} />

    </button>

  </div>


  )}
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

{/* TARJETAS DE PRODUCTOS Y RECETAS */}

{!cargandoProductos && !errorProductos && (

  <div className="row g-3" style={{ maxHeight: "calc(2 * 390px + 1rem)", overflowY: "auto", overflowX: "hidden", alignContent: "flex-start" }}>

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

            className="col-12 col-md-4"

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

              {/* RECETA DEL PRODUCTO ELABORADO */}

<div className="receta-detalle">

  {esElaborado ? (

    <>

      <div className="receta-ingredientes">

        <h4>Receta por unidad</h4>

        {erroresRecetas[id] ? (

          <div role="alert" className="text-danger">
            <p className="mb-1">{erroresRecetas[id]}</p>
            <button type="button" className="btn btn-sm btn-outline-secondary"
              onClick={() => verReceta(id)} disabled={cargandoReceta === id}>
              Reintentar receta
            </button>
          </div>

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

{/* MODAL EDITAR INSUMO */}

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

{/* MODAL DESHABILITAR INSUMO */}

<Modal

  show={modalEliminar}

  title="Deshabilitar insumo"

  onClose={() => { if (!deshabilitandoInsumo) setModalEliminar(false); }}

  footer={

    <>

      <Button

        text="Cancelar"

        variant="outline-secondary"

        disabled={deshabilitandoInsumo}

        onClick={() => setModalEliminar(false)}

      />

      <Button

        text={deshabilitandoInsumo ? "Deshabilitando..." : "Deshabilitar"}

        variant="danger"

        disabled={deshabilitandoInsumo}

        onClick={confirmarDeshabilitarInsumo}

      />

    </>

  }

>

  <p>

    ¿Estás segura de que deseas deshabilitar el insumo{" "}

    <strong>{insumoSeleccionado?.nombre}</strong>?

  </p>

  <div className="alert alert-warning mb-0">

    El insumo dejará de aparecer en las existencias activas, pero no se borrará de la base de datos.

  </div>

  {errorEstadoInsumo && (
    <div className="alert alert-danger mt-2" role="alert">{errorEstadoInsumo}</div>
  )}

</Modal>

{/* MODAL AGREGAR INSUMO */}

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

{/* MODAL AGREGAR PRODUCTO */}

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

{/* MODAL AGREGAR / EDITAR RECETA */}

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
