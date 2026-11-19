import { useEffect, useState } from "react";
import Card from "../Common/Card"; // Ajustar ruta

function obtenerImagen(platillo) {
  const ruta = platillo.imagen;
  if (!ruta) return null;

  if (
    ruta.startsWith("http://") ||
    ruta.startsWith("https://")
  ) {
    return ruta;
  }

  return ruta.startsWith("/") ? ruta : `/${ruta}`;
}

export default function PlatilloCard({
  platillo,
  onAgregar,
  onVerDetalle
}) {
  const inicial =
    platillo.nombre?.charAt(0).toUpperCase() || "P";

  const precio = Number(platillo.precio);

  const precioValido =
    platillo.precio != null &&
    platillo.precio !== "" &&
    Number.isFinite(precio) &&
    precio >= 0;

  const imagen = obtenerImagen(platillo);

  const [errorImagen, setErrorImagen] = useState(false);

  useEffect(() => {
    setErrorImagen(false);
  }, [imagen]);

  const disponible = platillo.disponible === true;
  const puedeAgregar = disponible && precioValido;

  function abrirDetalle() {
    onVerDetalle?.(platillo);
  }

  function manejarTeclado(event) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      abrirDetalle();
    }
  }

  function agregarAlCarrito(event) {
    event.stopPropagation();

    if (puedeAgregar) {
      onAgregar?.();
    }
  }

  return (
    <Card
      className="pos-producto-card rounded-4 shadow-sm border-0 w-100"
      bodyClassName="d-flex flex-column p-3"
      onClick={abrirDetalle}
      onKeyDown={manejarTeclado}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${platillo.nombre}`}

      header={
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

          <button
            type="button"
            className="pos-producto-agregar rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center"
            onClick={agregarAlCarrito}
            disabled={!puedeAgregar}
            aria-label={`Agregar ${platillo.nombre}`}
          >
            +
          </button>

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
      }
    >
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

        <small
          className={
            disponible
              ? "text-muted text-end"
              : "text-danger fw-semibold text-end"
          }
        >
          {disponible ? "Disponible" : "No disponible"}
        </small>
      </div>
    </Card>
  );
}