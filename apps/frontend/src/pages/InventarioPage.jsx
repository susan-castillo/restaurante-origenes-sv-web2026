
import { useEffect, useState } from "react";
import { obtenerInventario } from "../services/insumosService";
import "../styles/inventario.css";

function InventarioPage() {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarInventario() {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerInventario();
        setInventario(datos);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarInventario();
  }, []);

  return (
    <div className="inventario-page">
      <header className="inventario-header">
        <div>
          <h1>Inventario y recetas</h1>
          <p>Existencias de la sucursal</p>
        </div>
      </header>

      <div className="inventario-tabs">
        <button className="tab-activo">
          Existencias
        </button>
        <button disabled>
          Productos y recetas
        </button>
      </div>

      <section className="inventario-contenido">
        {cargando && (
          <p className="mensaje-inventario">
            Cargando existencias...
          </p>
        )}

        {error && (
          <div className="inventario-error">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <div className="inventario-tabla-contenedor">
            <table className="inventario-tabla">
              <thead>
                <tr>
                  <th>INSUMO</th>
                  <th>EXISTENCIA</th>
                  <th>MÍNIMO</th>
                  <th>ESTADO</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>

              <tbody>
                {inventario.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="tabla-vacia">
                      No hay existencias registradas.
                    </td>
                  </tr>
                ) : (
                  inventario.map((item) => {
                    const stock = Number(item.existencia);
                    const minimo = Number(item.stock_minimo);
                    const stockBajo = stock < minimo;
                    const agotado = stock <= 0;

                    return (
                      <tr key={item.id}>
                        <td className="nombre-insumo">
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
                          <span
                            className={
                              agotado || stockBajo
                                ? "estado-bajo"
                                : "estado-disponible"
                            }
                          >
                            {agotado
                              ? "Agotado"
                              : stockBajo
                                ? "Stock bajo"
                                : "Disponible"}
                          </span>
                        </td>

                        <td>
                          <span className="accion-pendiente">
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
    </div>
  );
}

export default InventarioPage;
