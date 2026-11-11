import { useEffect } from "react";
import Feedback from "../Common/Feedback.jsx";

const formatoCantidad = (valor) =>
  Number(valor ?? 0).toLocaleString("es-SV", {
    maximumFractionDigits: 3,
  });

export default function PlatilloDetalleModal({
  abierto,
  platillo,
  cargando,
  error,
  onCerrar,
}) {
  useEffect(() => {
    if (!abierto) return;

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") onCerrar();
    };

    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const ingredientes = platillo?.ingredientes ?? [];
  const disponible = platillo?.disponible === true;

  return (
    <div
      className="pos-detalle-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <section
        className="pos-detalle-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-detalle-titulo"
      >
        <button
          type="button"
          className="pos-detalle-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
        >
          ×
        </button>

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" />
            <p className="mt-3 mb-0">Cargando ingredientes...</p>
          </div>
        ) : error ? (
          <Feedback color="danger">{error}</Feedback>
        ) : platillo ? (
          <>
            <header className="pos-detalle-encabezado">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <span className="pos-detalle-tipo">
                  {platillo.tipo === "ELABORADO" ? "ELABORADO" : "REVENTA"}
                </span>
                <strong className="pos-detalle-precio">
                  ${Number(platillo.precio).toFixed(2)}
                </strong>
              </div>

              <h2 id="pos-detalle-titulo" className="pos-detalle-nombre">
                {platillo.nombre}
              </h2>
              <p className="pos-detalle-categoria">
                {platillo.categoria || "Sin categoría"}
              </p>
            </header>

            <div className="pos-detalle-tabla">
              <div className="pos-detalle-columnas">
                <strong>RECETA POR UNIDAD</strong>
                <strong>INVENTARIO SUCURSAL</strong>
              </div>

              {ingredientes.map((ingrediente) => (
                <div className="pos-detalle-fila" key={ingrediente.insumo_id}>
                  <div className="pos-detalle-receta">
                    <span>{ingrediente.nombre}</span>
                    <strong>
                      {formatoCantidad(ingrediente.cantidad_requerida)}{" "}
                      {ingrediente.unidad}
                    </strong>
                  </div>

                  <div
                    className={`pos-detalle-stock ${
                      ingrediente.suficiente ? "" : "insuficiente"
                    }`}
                  >
                    <strong>
                      {formatoCantidad(ingrediente.stock_actual)}{" "}
                      {ingrediente.unidad}
                    </strong>
                    <span aria-hidden="true">
                      {ingrediente.suficiente ? "✓" : "!"}
                    </span>
                  </div>
                </div>
              ))}

              {ingredientes.length === 0 && (
                <p className="text-muted py-3 mb-0">
                  Este platillo no tiene ingredientes configurados.
                </p>
              )}
            </div>

            <footer className="pos-detalle-pie">
              <span className={disponible ? "" : "pos-detalle-alerta"}>
                {disponible
                  ? "Ingredientes suficientes"
                  : "⚠ Ingredientes insuficientes"}
              </span>
              <span
                className={`pos-detalle-estado ${
                  disponible ? "" : "no-disponible"
                }`}
              >
                {disponible ? "Disponible" : "No disponible"}
              </span>
            </footer>
          </>
        ) : null}
      </section>
    </div>
  );
}
