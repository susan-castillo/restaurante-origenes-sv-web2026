
import { useEffect, useState } from "react";

// SERVICIOS
import { obtenerInventario } from "../services/insumosService";

// COMPONENTES GENERALES
import Button from "../components/Common/Button.jsx";
import Tabs from "../components/Common/Tabs.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";

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
  // ESTADOS
  // ========================================

  const [vista, setVista] = useState("existencias");
  const [filtro, setFiltro] = useState("todos");

  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
  // RENDERIZADO
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
            disabled
            title="Formulario pendiente de implementar"
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

                            {/* ACCIÓN */}

                            <td>
                              <span className="inventario-accion">
                                Ver insumo
                              </span>
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

          /* ===================================
             PRODUCTOS Y RECETAS
             =================================== */

          <section className="inventario-recetas-pendiente">

            <h2>Productos y recetas</h2>

            <p>
              Aquí se mostrarán los productos
              elaborados y de reventa del restaurante.
            </p>

          </section>

        )}

      </main>

    </div>
  );
}
