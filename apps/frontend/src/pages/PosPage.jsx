import { useEffect, useMemo, useState } from "react";
import { obtenerPlatillosPOS, crearVentaPOS } from "../services/posService.js";
import { getEstadoCaja } from "../services/cajasService.js";
import { useAuth } from "../context/AuthContext.jsx";
import PlatilloCard from "../components/pos/PlatilloCard.jsx";
import CobroModal from "../components/pos/CobroModal.jsx";
import VentaCompletadaModal from "../components/pos/VentaCompletadaModal.jsx";
import { generarComprobantePDF } from "../utils/generarComprobantePDF.js";
import "../styles/pos.scss";

const moneda = (valor) => `$${Number(valor ?? 0).toFixed(2)}`;

export default function PosPage() {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const sucursalId = usuario?.sucursal_id;

  // Estados del catálogo
  const [platillos, setPlatillos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");

  // Estados del carrito y cobro
  const [carrito, setCarrito] = useState([]);
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState(null);

  // Estados de caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cargandoCaja, setCargandoCaja] = useState(true);
  const [errorCaja, setErrorCaja] = useState("");

  // Cargar catálogo
  useEffect(() => {
    let activo = true;

    async function cargarPlatillos() {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerPlatillosPOS();

        if (!Array.isArray(datos)) {
          throw new Error("La API no devolvió una lista de platillos.");
        }

        if (activo) setPlatillos(datos);
      } catch (err) {
        if (activo) {
          setError(err.message || "No se pudieron cargar los platillos.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarPlatillos();

    return () => {
      activo = false;
    };
  }, []);

  // Verificar estado de caja
  useEffect(() => {
    let activo = true;

    async function verificarCaja() {
      if (cargandoAuth) return;

      if (!sucursalId) {
        setCajaAbierta(false);
        setCargandoCaja(false);
        setErrorCaja("El usuario no tiene una sucursal asignada.");
        return;
      }

      try {
        setCargandoCaja(true);
        setCajaAbierta(false);
        setErrorCaja("");

        const estado = await getEstadoCaja(sucursalId);

        if (activo) setCajaAbierta(estado.abierta === true);
      } catch (err) {
        if (activo) {
          setCajaAbierta(false);
          setErrorCaja(
            err.message || "No se pudo consultar el estado de caja."
          );
        }
      } finally {
        if (activo) setCargandoCaja(false);
      }
    }

    verificarCaja();

    return () => {
      activo = false;
    };
  }, [sucursalId, cargandoAuth]);

  // Categorías disponibles
  const categorias = useMemo(
    () => [
      "Todos",
      ...new Set(platillos.map((p) => p.categoria).filter(Boolean)),
    ],
    [platillos]
  );

  // Buscar y filtrar platillos
  const platillosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return platillos.filter((platillo) => {
      const coincideNombre = String(platillo.nombre ?? "")
        .toLowerCase()
        .includes(texto);

      const coincideCategoria =
        categoria === "Todos" || platillo.categoria === categoria;

      return coincideNombre && coincideCategoria;
    });
  }, [platillos, busqueda, categoria]);

  const habilitado =
    !cargandoAuth && !cargandoCaja && cajaAbierta && !errorCaja;

  // Agregar un producto al carrito
  function agregarProducto(platillo) {
    if (!habilitado || modalCobroAbierto) return;

    const precio = Number(platillo.precio);

    if (!Number.isFinite(precio) || precio < 0) return;

    setVentaCompletada(null);

    setCarrito((anterior) => {
      const existente = anterior.find((item) => item.id === platillo.id);

      if (existente) {
        return anterior.map((item) =>
          item.id === platillo.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [
        ...anterior,
        {
          id: platillo.id,
          nombre: platillo.nombre,
          precio,
          cantidad: 1,
        },
      ];
    });
  }

  // Modificar la cantidad de un producto
  function cambiarCantidad(id, cambio) {
    if (!habilitado || modalCobroAbierto) return;

    setCarrito((anterior) =>
      anterior
        .map((item) =>
          item.id === id
            ? { ...item, cantidad: item.cantidad + cambio }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }

  // Eliminar un producto del carrito
  function eliminarProducto(id) {
    if (!habilitado || modalCobroAbierto) return;

    setCarrito((anterior) =>
      anterior.filter((item) => item.id !== id)
    );
  }

  // Resumen visual del carrito
  const totalEstimado = carrito.reduce(
    (suma, item) => suma + item.precio * item.cantidad,
    0
  );

  const cantidadProductos = carrito.reduce(
    (suma, item) => suma + item.cantidad,
    0
  );

  // Registrar la venta mediante el backend
  async function confirmarCobro({ tipoDocumento, metodoPago, cliente }) {
    if (!habilitado || carrito.length === 0) {
      throw new Error("No se puede registrar la venta.");
    }

    const datosVenta = {
      tipo_doc: tipoDocumento,
      metodo_pago: metodoPago,
      items: carrito.map((item) => ({
        platillo_id: item.id,
        cantidad: item.cantidad,
      })),
    };

    if (tipoDocumento === "CCF") {
      datosVenta.cliente = {
        nombre: cliente.nombre.trim(),
        nit: cliente.nit.trim(),
        nrc: cliente.nrc.trim(),
      };
    }

    const venta = await crearVentaPOS(datosVenta);

    setVentaCompletada(venta);
    setCarrito([]);
    setModalCobroAbierto(false);

    return venta;
  }

  return (
    <main className="pos-page container-fluid py-4 px-3 px-lg-4">
      <header className="mb-4">
        <h1 className="font-origenes text-dark mb-2">
          Punto de venta
        </h1>
        <p className="text-muted mb-0">
          Gestiona los pedidos y registra las ventas de Restaurante Orígenes.
        </p>
      </header>

      {/* Estado de caja */}
      {cargandoCaja && (
        <div className="alert alert-info">
          Verificando estado de caja...
        </div>
      )}

      {!cargandoCaja && errorCaja && (
        <div className="alert alert-danger">{errorCaja}</div>
      )}

      {!cargandoCaja && !errorCaja && !cajaAbierta && (
        <div className="alert alert-warning">
          No hay una caja abierta en la sucursal.
          Debes abrir una caja para realizar ventas.
        </div>
      )}
      <div className="row g-4">
        {/* Catálogo */}
        <section className="col-12 col-xl-8">
          <div className="input-group pos-buscador mb-3">
            <span className="input-group-text bg-white border-end-0">
              ⌕
            </span>
            <input
              type="search"
              className="form-control border-start-0"
              placeholder="Buscar producto..."
              aria-label="Buscar producto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="d-flex flex-wrap gap-2 mb-4">
            {categorias.map((item) => (
              <button
                key={item}
                type="button"
                className={`btn rounded-pill px-3 pos-filtro ${
                  categoria === item ? "btn-dark" : "btn-outline-dark"
                }`}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {cargando && (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {!cargando && !error && platillosFiltrados.length === 0 && (
            <div className="alert alert-light border">
              No se encontraron platillos.
            </div>
          )}

          {!cargando && !error && (
            <div className="row g-3">
              {platillosFiltrados.map((platillo) => (
                <div
                  key={platillo.id}
                  className="col-12 col-md-6 col-lg-4 d-flex"
                >
                  <div
                    className="w-100"
                    style={{
                      opacity: habilitado ? 1 : 0.65,
                      pointerEvents:
                        habilitado && !modalCobroAbierto ? "auto" : "none",
                    }}
                  >
                    <PlatilloCard
                      platillo={platillo}
                      onAgregar={() => agregarProducto(platillo)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Carrito */}
        <aside className="col-12 col-xl-4">
          <div className="pos-carrito bg-white rounded-4 shadow-sm border p-4 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-4">
              <h2 className="font-origenes fs-3 mb-0">
                Venta actual
              </h2>
              <span className="badge bg-cream text-dark rounded-pill px-3 py-2">
                {cantidadProductos} productos
              </span>
            </div>

            <div className="pos-carrito-contenido flex-grow-1">
              {carrito.length === 0 ? (
                <div className="d-flex flex-column justify-content-center align-items-center text-center text-muted py-5 gap-2">
                  <div className="pos-carrito-icono rounded-circle bg-light d-flex align-items-center justify-content-center mb-2">
                    🛒
                  </div>
                  <strong className="text-dark">
                    Tu carrito está vacío
                  </strong>
                  <small>
                    Selecciona un producto para agregarlo.
                  </small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {carrito.map((item) => (
                    <div
                      key={item.id}
                      className="pos-carrito-producto rounded-4 p-3"
                    >
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div>
                          <h3 className="fs-6 fw-bold mb-1">
                            {item.nombre}
                          </h3>
                          <small className="text-muted">
                            {moneda(item.precio)} c/u
                          </small>
                        </div>
                        <strong className="fs-5 text-dark">
                          {moneda(item.precio * item.cantidad)}
                        </strong>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <button
                            type="button"
                            className="btn pos-cantidad-btn"
                            disabled={!habilitado || modalCobroAbierto}
                            onClick={() => cambiarCantidad(item.id, -1)}
                            aria-label={`Quitar una unidad de ${item.nombre}`}
                          >
                            −
                          </button>

                          <span className="fw-semibold">
                            {item.cantidad}
                          </span>

                          <button
                            type="button"
                            className="btn pos-cantidad-btn"
                            disabled={!habilitado || modalCobroAbierto}
                            onClick={() => cambiarCantidad(item.id, 1)}
                            aria-label={`Agregar una unidad de ${item.nombre}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn pos-eliminar-btn"
                          disabled={!habilitado || modalCobroAbierto}
                          onClick={() => eliminarProducto(item.id)}
                          aria-label={`Eliminar ${item.nombre}`}
                          title="Eliminar producto"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 10v7" />
                            <path d="M14 10v7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen */}
            <div className="pos-carrito-resumen border-top pt-4 mt-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <strong className="fs-6">
                  Total estimado
                </strong>
                <strong className="fs-5 text-dark pos-carrito-total">
                  {moneda(totalEstimado)}
                </strong>
              </div>

              <button
                type="button"
                className="btn pos-btn-cobrar w-100 py-3 fw-bold"
                disabled={!habilitado || carrito.length === 0}
                onClick={() => setModalCobroAbierto(true)}
              >
                Cobrar {moneda(totalEstimado)}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal de cobro */}
      <CobroModal
        abierto={modalCobroAbierto}
        onCerrar={() => setModalCobroAbierto(false)}
        onConfirmar={confirmarCobro}
        total={totalEstimado}
      />
      {/* Modal de venta completa */}
      <VentaCompletadaModal
        venta={ventaCompletada}
        onNuevaVenta={() => setVentaCompletada(null)}
        onImprimir={generarComprobantePDF}
      />
    </main>
  );
}
