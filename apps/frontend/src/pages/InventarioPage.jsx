import { useEffect, useRef, useState } from "react";
import { escucharCambiosInventario } from "../services/inventarioEventos.js";
import { authService } from "../services/authService.js";
import { getSucursales } from "../services/sucursales.js";
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
import Button from "../components/Common/Button.jsx";
import Tabs from "../components/Common/Tabs.jsx";
import InsumosFiltros from "../components/insumos/InsumosFiltros.jsx";
import InsumosTabla from "../components/insumos/InsumosTabla.jsx";
import InsumoForm from "../components/insumos/InsumoForm.jsx";
import InsumoEstadoConfirmacion from "../components/insumos/InsumoEstadoConfirmacion.jsx";
import RecetasListado from "../components/recetas/RecetasListado.jsx";
import ProductoForm from "../components/recetas/ProductoForm.jsx";
import RecetaForm from "../components/recetas/RecetaForm.jsx";

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

function obtenerEstado(item) {
  const stock = Number(item.stock_actual);
  const minimo = Number(item.stock_minimo);
  if (stock <= 0) {
    return { texto: "Agotado", variante: "danger", codigo: "agotados" };
  }
  if (stock < minimo) {
    return { texto: "Bajo mínimo", variante: "warning", codigo: "bajo" };
  }
  return { texto: "Disponible", variante: "success", codigo: "disponible" };
}

export default function InventarioPage() {
  const [vista, setVista] = useState("existencias");

  // ESTADOS DE EXISTENCIAS

  const [filtro, setFiltro] = useState("todos");
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  // Identificar rol y sucursal desde la sesión autenticada.
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("todas");
  const [errorSucursales, setErrorSucursales] = useState("");
  const esAdminCentral = usuario?.rol === "ADMIN" && usuario?.sucursal_id == null;

  useEffect(() => {
    let vigente = true;

    async function inicializar() {
      try {
        setCargandoSesion(true);
        const respuesta = await authService.me();
        const sesion = respuesta?.usuario ?? respuesta;
        if (!sesion || typeof sesion !== "object" || !sesion.rol) {
          throw new Error("La sesión no devolvió el rol del usuario.");
        }
        if (!vigente) return;
        setUsuario(sesion);
        if (sesion.rol === "ADMIN" && sesion.sucursal_id == null) {
          setSucursalSeleccionada("todas");
          const lista = await getSucursales();
          if (!vigente) return;
          setSucursales(lista);
          setErrorSucursales("");
        } else {
          setSucursalSeleccionada(sesion.sucursal_id == null ? "" : String(sesion.sucursal_id));
          setSucursales([]);
        }
      } catch (err) {
        if (vigente)
          setErrorSucursales(err.message || "No se pudo cargar la sesión o las sucursales.");
      } finally {
        if (vigente) setCargandoSesion(false);
      }
    }
    inicializar();
    return () => {
      vigente = false;
    };
  }, []);
  // El controlador actual del backend requiere un ID concreto para cada consulta.
  // Para la vista "todas", consultamos cada sucursal y unimos los resultados.

  async function consultarInventarioActual(buscar = busquedaAplicada) {
    if (esAdminCentral) {
      if (sucursales.length === 0) {
        throw new Error("No hay sucursales disponibles para consultar el inventario.");
      }
      const seleccionadas =
        sucursalSeleccionada === "todas"
          ? sucursales
          : sucursales.filter((s) => String(s.id) === sucursalSeleccionada);
      if (seleccionadas.length === 0) {
        throw new Error("Selecciona una sucursal válida.");
      }
      const resultados = await Promise.all(
        seleccionadas.map(async (sucursal) => {
          const filas = await obtenerInventario(sucursal.id, buscar);
          if (!Array.isArray(filas)) throw new Error("La API no devolvió una lista de inventario.");
          return filas.map((fila) => ({
            ...fila,
            sucursal_id: sucursal.id,
            sucursal_nombre: sucursal.nombre,
          }));
        }),
      );
      return resultados.flat();
    }
    if (!usuario?.sucursal_id) {
      throw new Error("Tu usuario no tiene una sucursal asignada.");
    }
    // No enviar sucursal_id para usuarios normales: el backend usa la del token.
    return obtenerInventario(null, buscar);
  }
  const [inventario, setInventario] = useState([]);
  const [revisionInventario, setRevisionInventario] = useState(0);

  useEffect(() => {
    const temporizador = setTimeout(() => setBusquedaAplicada(busquedaInsumo.trim()), 350);
    return () => clearTimeout(temporizador);
  }, [busquedaInsumo]);

  useEffect(
    () =>
      escucharCambiosInventario(() => {
        setRevisionInventario((revision) => revision + 1);
      }),
    [],
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [insumosDeshabilitados, setInsumosDeshabilitados] = useState([]);
  const [cargandoDeshabilitados, setCargandoDeshabilitados] = useState(false);
  const [errorDeshabilitados, setErrorDeshabilitados] = useState("");
  const [habilitandoId, setHabilitandoId] = useState(null);
  const deshabilitadosCargaRef = useRef(null);

  // ESTADOS DE PRODUCTOS Y RECETAS

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState("");
  const [filtroProductos, setFiltroProductos] = useState("todos");
  const [recetas, setRecetas] = useState({});
  const [cargandoReceta, setCargandoReceta] = useState(null);
  const [erroresRecetas, setErroresRecetas] = useState({});

  // MODAL AGREGAR PRODUCTO

  const [modalAgregarProducto, setModalAgregarProducto] = useState(false);
  const [nombreProducto, setNombreProducto] = useState("");
  const [categoriaProducto, setCategoriaProducto] = useState("");
  const [precioProducto, setPrecioProducto] = useState("");
  const [tipoProducto, setTipoProducto] = useState("ELABORADO");
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [errorProductoModal, setErrorProductoModal] = useState("");

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

  // MODAL CREAR Y EDITAR RECETAS

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
    const tarea = obtenerReceta(id)
      .then((respuesta) => {
        const items = extraerItems(respuesta);
        if ((recetasVersionRef.current.get(id) ?? 0) === version) {
          recetasCacheRef.current.set(id, items);
        }
        return items;
      })
      .finally(() => recetasPendientesRef.current.delete(id));
    recetasPendientesRef.current.set(id, tarea);
    return tarea;
  }

  async function consultarCatalogoInsumos() {
    if (!catalogoCargaRef.current) {
      catalogoCargaRef.current = obtenerInsumos()
        .then((datos) => {
          if (!Array.isArray(datos)) throw new Error("No se pudo cargar el catálogo de insumos.");
          return datos;
        })
        .catch((error) => {
          catalogoCargaRef.current = null;
          throw error;
        });
    }
    return catalogoCargaRef.current;
  }

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
        setIngredientesFormulario(
          items.map((item) => ({
            insumo_id: String(item.insumo_id),
            cantidad: String(item.cantidad),
          })),
        );
      }
    } catch (err) {
      setErrorRecetaModal(err.message || "No se pudo cargar la receta.");
    } finally {
      setCargandoDatosReceta(false);
    }
  }

  function agregarIngrediente() {
    setIngredientesFormulario((actuales) => {
      if (actuales.length >= 50) return actuales;
      return [...actuales, { insumo_id: "", cantidad: "" }];
    });
  }

  function cambiarIngrediente(index, campo, valor) {
    setIngredientesFormulario((actuales) =>
      actuales.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)),
    );
  }

  function quitarIngrediente(index) {
    setIngredientesFormulario((actuales) => actuales.filter((_, i) => i !== index));
  }

  async function guardarCambiosReceta() {
    if (!productoReceta || guardandoReceta) return;
    const id = Number(productoReceta.id ?? productoReceta.platillo_id);
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
      if (!Number.isInteger(items[i].insumo_id) || items[i].insumo_id <= 0) {
        setErrorRecetaModal(`Selecciona un insumo para el ingrediente ${i + 1}.`);
        return;
      }
      if (
        ingredientesFormulario[i].cantidad.trim() === "" ||
        !Number.isFinite(items[i].cantidad) ||
        items[i].cantidad <= 0
      ) {
        setErrorRecetaModal(`Ingresa una cantidad válida para el ingrediente ${i + 1}.`);
        return;
      }
    }
    // Evitar ingredientes duplicados
    const ids = items.map((item) => item.insumo_id);
    if (new Set(ids).size !== ids.length) {
      setErrorRecetaModal("No puedes agregar el mismo insumo dos veces.");
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
      setErroresRecetas((actuales) => ({ ...actuales, [id]: "" }));
      setModalReceta(false);
      setProductoReceta(null);
    } catch (err) {
      setErrorRecetaModal(err.message || "No se pudo guardar o actualizar la receta.");
    } finally {
      setGuardandoReceta(false);
    }
  }

  useEffect(() => {
    if (cargandoSesion) return;
    if (errorSucursales) {
      setError(errorSucursales);
      setCargando(false);
      setInventario([]);
      return;
    }
    let activo = true;

    async function cargarInventario() {
      try {
        setCargando(true);
        setError("");
        const datos = await consultarInventarioActual(busquedaAplicada);
        if (!activo) return;
        if (!Array.isArray(datos)) {
          throw new Error("La API no devolvió una lista de inventario.");
        }
        setInventario(datos);
      } catch (err) {
        if (activo) {
          setError(err.message || "No se pudo cargar el inventario.");
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
  }, [
    revisionInventario,
    busquedaAplicada,
    cargandoSesion,
    usuario,
    sucursalSeleccionada,
    sucursales,
    errorSucursales,
  ]);
  // Buscar insumos deshabilitados en el catálogo global usando los filtros del backend.

  useEffect(() => {
    if (filtro !== "deshabilitados") return;
    let vigente = true;

    async function cargarDeshabilitados() {
      setCargandoDeshabilitados(true);
      setErrorDeshabilitados("");
      try {
        const datos = await obtenerInsumos({ activo: false, buscar: busquedaAplicada });
        if (!Array.isArray(datos))
          throw new Error("La API no devolvió un catálogo de insumos válido.");
        if (vigente) setInsumosDeshabilitados(datos.filter((item) => item.activo === false));
      } catch (err) {
        if (vigente)
          setErrorDeshabilitados(
            err.message || "No se pudieron cargar los insumos deshabilitados.",
          );
      } finally {
        if (vigente) setCargandoDeshabilitados(false);
      }
    }
    cargarDeshabilitados();
    return () => {
      vigente = false;
    };
  }, [filtro, busquedaAplicada, revisionInventario]);

  // CARGAR PRODUCTOS DEL BACKEND

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
          productosCargaRef.current = obtenerProductos()
            .then((datos) => {
              if (!Array.isArray(datos)) {
                throw new Error("La API no devolvió una lista de productos.");
              }
              return datos;
            })
            .catch((err) => {
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
          await Promise.all(
            lote.map(async (producto) => {
              const id = Number(producto.id ?? producto.platillo_id);
              if (!Number.isInteger(id) || id <= 0) return;
              // Un error anterior se reintenta solo cuando el usuario lo pide.
              if (recetasErroresCacheRef.current.has(id)) {
                if (activo)
                  setErroresRecetas((prev) => ({
                    ...prev,
                    [id]: recetasErroresCacheRef.current.get(id),
                  }));
                return;
              }
              // No volver a descargar una receta que ya esté cargada.
              if (recetasCacheRef.current.has(id)) {
                if (activo)
                  setRecetas((prev) => ({ ...prev, [id]: recetasCacheRef.current.get(id) }));
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
                if (activo) setErroresRecetas((prev) => ({ ...prev, [id]: mensaje }));
              }
            }),
          );
        }
      } catch (err) {
        if (activo) setErrorProductos(err.message || "No se pudieron cargar los productos.");
      } finally {
        if (activo) setCargandoProductos(false);
      }
    }
    iniciarCarga();
    return () => {
      activo = false;
    };
  }, [vista]);

  const inventarioFiltrado =
    filtro === "deshabilitados"
      ? insumosDeshabilitados.map((item) => ({ ...item, insumo_id: item.id }))
      : inventario.filter((item) => {
          if (filtro === "todos") return true;
          return obtenerEstado(item).codigo === filtro;
        });
  const cargandoExistencias = filtro === "deshabilitados" ? cargandoDeshabilitados : cargando;
  const errorExistencias = filtro === "deshabilitados" ? errorDeshabilitados : error;

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
      setInventario((actuales) => actuales.filter((item) => item.insumo_id !== id));
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
        anteriores.filter((insumo) => Number(insumo.id) !== id),
      );
      deshabilitadosCargaRef.current = null;
      catalogoCargaRef.current = null;
      try {
        const datos = await consultarInventarioActual(busquedaAplicada);
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
      const datos = await consultarInventarioActual(busquedaAplicada);
      setInventario(datos);
      setModalEditar(false);
      setInsumoSeleccionado(null);
    } catch (err) {
      setErrorModal(err.message || "No se pudo actualizar el insumo.");
    } finally {
      setGuardandoInsumo(false);
    }
  }

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
      await crearInsumo({ nombre, unidad: unidadInsumo });
      // Volver a consultar las existencias
      const datos = await consultarInventarioActual(busquedaAplicada);
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
      setErrorModal(err.message || "No se pudo registrar el insumo.");
    } finally {
      setGuardandoInsumo(false);
    }
  }

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
      const actualizados = [
        nuevoProducto,
        ...anteriores.filter(
          (p) =>
            Number(p.id ?? p.platillo_id) !== Number(nuevoProducto.id ?? nuevoProducto.platillo_id),
        ),
      ];
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
        const id = Number(nuevoProducto?.id ?? nuevoProducto?.platillo_id);
        if (Number.isInteger(id) && id > 0) {
          await abrirModalReceta(nuevoProducto, true);
        } else {
          setErrorProductos("Producto creado. Actualiza la lista para configurar su receta.");
        }
      }
    } catch (err) {
      setErrorProductoModal(err.message || "No se pudo crear el producto.");
    } finally {
      setGuardandoProducto(false);
    }
  }

  return (
    <div className="inventario-page" style={{ minWidth: 0, flex: "1 1 0%", maxWidth: "100%" }}>
      {/* ENCABEZADO */}
      <header className="inventario-header">
        <div>
          <h1 className="inventario-titulo">Inventario y recetas</h1>
          <p className="inventario-subtitulo">Existencias de la sucursal</p>
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
      <Tabs options={vistas} value={vista} onChange={setVista} />
      {/* CONTENIDO PRINCIPAL */}
      <main className="inventario-contenido">
        {vista === "existencias" ? (
          <section>
            <InsumosFiltros
              opciones={filtros}
              filtro={filtro}
              onFiltrar={setFiltro}
              busqueda={busquedaInsumo}
              onBuscar={setBusquedaInsumo}
              esAdminCentral={esAdminCentral}
              sucursalAsignada={usuario?.sucursal_id}
              sucursales={sucursales}
              sucursalSeleccionada={sucursalSeleccionada}
              onCambiarSucursal={setSucursalSeleccionada}
              cargandoSesion={cargandoSesion}
              errorSucursales={errorSucursales}
            />
            <InsumosTabla
              insumos={inventarioFiltrado}
              filtro={filtro}
              esAdminCentral={esAdminCentral}
              cargando={cargandoExistencias}
              error={errorExistencias}
              habilitandoId={habilitandoId}
              obtenerEstado={obtenerEstado}
              onEditar={abrirEditar}
              onDeshabilitar={abrirEliminar}
              onHabilitar={habilitarInsumo}
            />
          </section>
        ) : (
          <RecetasListado
            opciones={filtrosProductos}
            filtro={filtroProductos}
            onFiltrar={setFiltroProductos}
            productos={productosFiltrados}
            cargando={cargandoProductos}
            error={errorProductos}
            recetas={recetas}
            erroresRecetas={erroresRecetas}
            cargandoReceta={cargandoReceta}
            onEditarReceta={abrirModalReceta}
            onReintentar={verReceta}
          />
        )}
      </main>

      <InsumoForm
        show={modalAgregar || modalEditar}
        editando={modalEditar}
        nombre={nombreInsumo}
        unidad={unidadInsumo}
        guardando={guardandoInsumo}
        error={errorModal}
        onCambiarNombre={setNombreInsumo}
        onCambiarUnidad={setUnidadInsumo}
        onClose={() => (modalEditar ? setModalEditar(false) : setModalAgregar(false))}
        onGuardar={modalEditar ? guardarCambiosInsumo : guardarNuevoInsumo}
      />
      <InsumoEstadoConfirmacion
        show={modalEliminar}
        insumo={insumoSeleccionado}
        guardando={deshabilitandoInsumo}
        error={errorEstadoInsumo}
        onClose={() => setModalEliminar(false)}
        onConfirmar={confirmarDeshabilitarInsumo}
      />
      <ProductoForm
        show={modalAgregarProducto}
        nombre={nombreProducto}
        categoria={categoriaProducto}
        precio={precioProducto}
        tipo={tipoProducto}
        guardando={guardandoProducto}
        error={errorProductoModal}
        onCambiarNombre={setNombreProducto}
        onCambiarCategoria={setCategoriaProducto}
        onCambiarPrecio={setPrecioProducto}
        onCambiarTipo={setTipoProducto}
        onClose={() => setModalAgregarProducto(false)}
        onGuardar={guardarNuevoProducto}
      />
      <RecetaForm
        show={modalReceta}
        producto={productoReceta}
        catalogoInsumos={catalogoInsumos}
        ingredientes={ingredientesFormulario}
        cargando={cargandoDatosReceta}
        guardando={guardandoReceta}
        error={errorRecetaModal}
        onAgregarIngrediente={() => {
          setErrorRecetaModal("");
          agregarIngrediente();
        }}
        onCambiarIngrediente={cambiarIngrediente}
        onQuitarIngrediente={quitarIngrediente}
        onClose={() => setModalReceta(false)}
        onGuardar={guardarCambiosReceta}
      />
    </div>
  );
}
