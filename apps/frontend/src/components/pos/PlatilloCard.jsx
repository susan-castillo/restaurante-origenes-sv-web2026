
import { useEffect, useState } from "react";

function obtenerImagen(platillo) {
  const ruta = platillo.imagen;

  if (!ruta) return null;

  if (
    ruta.startsWith("http://") ||
    ruta.startsWith("https://")
  ) {
    return ruta;
  }

  return ruta.startsWith("/")
    ? ruta
    : `/${ruta}`;
}

export default function PlatilloCard({
  platillo,
  onAgregar,
}) {
  const inicial =
    platillo.nombre?.charAt(0).toUpperCase() || "P";

  const precio = Number(platillo.precio);

  const precioValido =
    Number.isFinite(precio) && precio >= 0;

  const imagen = obtenerImagen(platillo);

  const [errorImagen, setErrorImagen] = useState(false);

  useEffect(() => {
    setErrorImagen(false);
  }, [imagen]);

  const disponibilidad =
    platillo.stock ?? platillo.disponibles;

  return (
    <article className="card pos-producto-card rounded-4 shadow-sm border-0 w-100 h-100">
      {/* IMAGEN */}
      <div className="pos-producto-imagen d-flex align-items-center justify-content-center position-relative">
        {imagen && !errorImagen ? (
          <img
            src={imagen}
            alt={platillo.nombre}
            className="pos-producto-foto"
            loading="lazy"
            onError={() => setErrorImagen(true)}
          />
        ) : (
          <div className="pos-producto-inicial rounded-circle d-flex align-items-center justify-content-center">
            {inicial}
          </div>
        )}

        {/* BOTÓN AGREGAR */}
        <button
          type="button"
          className="pos-producto-agregar rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center"
          onClick={onAgregar}
          disabled={!precioValido}
          aria-label={`Agregar ${platillo.nombre}`}
        >
          +
        </button>

        {/* CATEGORÍA Y TIPO */}
        <div className="pos-producto-etiquetas d-flex flex-wrap gap-2">
          <span className="badge bg-white text-dark rounded-pill">
            {platillo.categoria || "Sin categoría"}
          </span>

          <span className="badge bg-dark text-white rounded-pill">
            {platillo.tipo === "ELABORADO"
              ? "Elaborado"
              : platillo.tipo === "REVENTA"
                ? "Reventa"
                : "Sin tipo"}
          </span>
        </div>
      </div>

      {/* INFORMACIÓN */}
      <div className="card-body d-flex flex-column p-3">
        <h3 className="card-title fs-6 fw-bold text-dark mb-2">
          {platillo.nombre}
        </h3>

        <p className="card-text pos-producto-descripcion small mb-3">
          {platillo.descripcion ||
            "Producto de Restaurante Orígenes"}
        </p>

        <div className="d-flex justify-content-between align-items-center gap-2 mt-auto">
          <strong className="pos-producto-precio fs-5">
            {precioValido
              ? `$${precio.toFixed(2)}`
              : "Sin precio"}
          </strong>

          {disponibilidad != null && (
            <small className="text-muted text-end">
              {disponibilidad} disponibles
            </small>
          )}
        </div>
      </div>
    </article>
  );
}
