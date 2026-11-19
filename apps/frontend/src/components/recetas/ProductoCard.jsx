import { useEffect, useState } from "react";
import { BookOpen, Pencil } from "lucide-react";
import Card from "../Common/Card.jsx";

export default function ProductoCard({
  producto,
  ingredientes,
  error,
  reintentando,
  onEditarReceta,
  onReintentar,
}) {
  const esElaborado = producto.tipo === "ELABORADO";
  const inicial = producto.nombre?.trim().charAt(0).toUpperCase() || "P";

  const ruta = producto.imagen?.trim() || "";
  const imagen =
    ruta && !ruta.startsWith("/") && !/^https?:\/\//i.test(ruta)
      ? "/" + ruta
      : ruta;

  const [errorImagen, setErrorImagen] = useState(false);

  useEffect(() => {
    setErrorImagen(false);
  }, [imagen]);

  return (
    <Card
      className={`receta-card ${
        esElaborado ? "receta-card--elaborado" : "receta-card--reventa"
      }`}
    >
      {/* FOTO O INICIAL DEL PRODUCTO */}
      {imagen && !errorImagen ? (
        <img
          className="receta-card-imagen"
          src={imagen}
          alt={producto.nombre}
          loading="lazy"
          onError={() => setErrorImagen(true)}
        />
      ) : (
        <div
          className="receta-card-imagen receta-card-sin-foto"
          aria-hidden="true"
        >
          <span className="receta-card-inicial">{inicial}</span>
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="receta-card-encabezado">
        <span className="receta-tipo-texto">
          {esElaborado ? "ELABORADO" : "REVENTA"}
        </span>
        <span className="receta-precio">
          ${Number(producto.precio).toFixed(2)}
        </span>
      </div>

      {/* INFORMACIÓN DEL PRODUCTO */}
      <div className="receta-producto-acciones">
        <h3 className="receta-nombre">{producto.nombre}</h3>

        <button
          type="button"
          className="receta-icono-editar"
          title={esElaborado ? "Editar receta y foto" : "Editar producto de reventa"}
          aria-label={`Editar ${producto.nombre}`}
          onClick={onEditarReceta}
        >
          {esElaborado ? <BookOpen size={19} /> : <Pencil size={19} />}
        </button>
      </div>

      <p className="receta-descripcion">
        {producto.categoria || "Sin categoría"}
      </p>

      {/* DETALLE DE LA RECETA O DEL PRODUCTO DE REVENTA */}
      <div className="receta-detalle">
        {esElaborado ? (
          <div className="receta-ingredientes">
            <h4>Receta por unidad</h4>

            {error ? (
              <div role="alert" className="text-danger">
                <p className="mb-1">{error}</p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onReintentar}
                  disabled={reintentando}
                >
                  Reintentar receta
                </button>
              </div>
            ) : ingredientes === undefined ? (
              <p className="mb-0">Cargando receta...</p>
            ) : ingredientes.length === 0 ? (
              <p className="mb-0">Sin ingredientes registrados.</p>
            ) : (
              <div className="receta-ingredientes-lista">
                {ingredientes.map((item, index) => (
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
                      {item.insumo?.unidad ?? item.unidad ?? ""}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
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
  );
}