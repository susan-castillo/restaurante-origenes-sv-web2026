
import { useEffect, useState } from "react";
import { obtenerPlatillosPOS } from "../services/posService.js";

export default function PosPage() {
  const [platillos, setPlatillos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarPlatillos() {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerPlatillosPOS();

        if (!Array.isArray(datos)) {
          throw new Error("La API no devolvió una lista de platillos.");
        }

        setPlatillos(datos);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los platillos.");
      } finally {
        setCargando(false);
      }
    }

    cargarPlatillos();
  }, []);

  return (
    <div className="container-fluid py-4 px-4">
      <div className="mb-4">
        <h2 className="fw-semibold">Punto de venta</h2>
        <p className="text-muted">
          Gestiona los pedidos y registra las ventas
          de Restaurante Orígenes.
        </p>
      </div>

      <div className="row g-4">
        {/* Catálogo */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-4">Catálogo de platillos</h5>

              {cargando && (
                <p className="text-muted">Cargando platillos...</p>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {!cargando && !error && platillos.length === 0 && (
                <p className="text-muted">
                  No hay platillos disponibles.
                </p>
              )}

              {!cargando && !error && (
                <div className="row g-3">
                  {platillos.map((platillo) => (
                    <div
                      className="col-md-6 col-xl-4"
                      key={platillo.id}
                    >
                      <div className="card h-100">
                        <div className="card-body d-flex flex-column">
                          <h6 className="fw-semibold">
                            {platillo.nombre}
                          </h6>

                          <p className="text-muted small mb-3">
                            {platillo.categoria || "Sin categoría"}
                          </p>

                          <div className="mt-auto">
                            <strong>
                              ${Number(platillo.precio).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pedido */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5>Pedido actual</h5>

              <p className="text-muted">
                Todavía no hay productos agregados.
              </p>

              <hr />

              <div className="d-flex justify-content-between">
                <strong>Total</strong>
                <strong>$0.00</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
