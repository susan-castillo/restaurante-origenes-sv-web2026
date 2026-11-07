
import { useEffect, useState } from "react";

import { obtenerInventario } from "../services/insumosService";

// COMPONENTES GENERALES
import Button from "../components/Common/Button.jsx";
import Tabs from "../components/Common/Tabs.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";

export default function InventarioPage() {

  // =====================================
  // ESTADOS
  // =====================================

  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [vista, setVista] = useState("existencias");
  const [filtro, setFiltro] = useState("todos");

  // =====================================
  // OBTENER DATOS DEL BACKEND
  // =====================================

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
            "El servicio no devolvió una lista de existencias."
          );
        }

        setInventario(datos);
      } catch (err) {
        if (activo) {
          setError(err.message || "Error al cargar inventario");
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

  // =====================================
  // ESTADOS DE STOCK
  // =====================================

  function obtenerEstado(item) {
    const stock = Number(item.existencia);
    const minimo = Number(item.stock_minimo);

    if (stock <= 0) {
      return {
        texto: "Agotado",
        variant: "danger",
        codigo: "agotados",
      };
    }

    if (stock < minimo) {
      return {
        texto: "Bajo mínimo",
        variant: "warning",
        codigo: "bajo",
      };
    }

    return {
      texto: "Disponible",
      variant: "success",
      codigo: "disponible",
    };
  }

  // =====================================
  // FILTROS
  // =====================================

  const inventarioFiltrado = inventario.filter((item) => {
    if (filtro === "todos") return true;

    const estado = obtenerEstado(item);

    return estado.codigo === filtro;
  });

  // =====================================
  // RENDERIZADO
  // =====================================

  return (
    <div className="inventario-page">

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

        <Button
          text="Agregar insumo"
          variant="secondary"
          disabled
          title="Formulario pendiente de implementar"
        />
      </header>

      {/* PESTAÑAS PRINCIPALES */}
      <Tabs
        options={[
          {
            value: "existencias",
            label: "Existencias",
          },
          {
            value: "recetas",
            label: "Productos y recetas",
          },
        ]}
        value={vista}
        onChange={setVista}
      />

      {/* CONTENIDO */}
      <main className="inventario-contenido">

        {vista === "existencias" ? (
          <section>

            {/* FILTROS */}
            <div className="inventario-filtros">
              <Tabs
                variant="pills"
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "bajo", label: "Bajo mínimo" },
                  { value: "agotados", label: "Agotados" },
                ]}
                value={filtro}
                onChange={setFiltro}
              />
            </div>

            {/* CARGANDO */}
            {cargando && (
              <p className="inventario-mensaje">
                Cargando existencias...
              </p>
            )}

            {/* ERROR */}
            {!cargando && error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* TABLA */}
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
                          No hay existencias para mostrar.
                        </td>
                      </tr>
                    ) : (
                      inventarioFiltrado.map((item) => {
                        const stock = Number(item.existencia);
                        const minimo = Number(item.stock_minimo);
                        const estado = obtenerEstado(item);

                        return (
                          <tr key={item.id}>
                            <td className="inventario-nombre">
                              {item.nombre}
                            </td>

                            <td>
                              {stock.toLocaleString("es-SV")}{" "}
                              {item.unidad}
                            </td>

                            <td>
                              {minimo.toLocaleString("es-SV")}{" "}
                              {item.unidad}
                            </td>

                            <td>
                              <StatusBadge
                                text={estado.texto}
                                variant={estado.variant}
                              />
                            </td>

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
          <section className="inventario-recetas-pendiente">
            <h2>Productos y recetas</h2>
            <p>
              Este módulo se implementará después
              de finalizar las existencias.
            </p>
          </section>
        )}

      </main>
    </div>
  );
}
