import { BookOpen } from "lucide-react";
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

  return (
    <Card
      className={`receta-card ${esElaborado ? "receta-card--elaborado" : "receta-card--reventa"}`}
    >
      {/* ENCABEZADO */}
      <div className="receta-card-encabezado">
        <span className="receta-tipo-texto">{esElaborado ? "ELABORADO" : "REVENTA"}</span>
        <span className="receta-precio">${Number(producto.precio).toFixed(2)}</span>
      </div>
      {/* INFORMACIÓN DEL PRODUCTO */}
      <div className="receta-producto-acciones">
        <h3 className="receta-nombre">{producto.nombre}</h3>
        {esElaborado && (
          <button
            type="button"
            className="receta-icono-editar"
            title="Agregar o editar receta"
            aria-label={`Editar receta de ${producto.nombre}`}
            onClick={onEditarReceta}
          >
            <BookOpen size={19} />
          </button>
        )}
      </div>
      <p className="receta-descripcion">{producto.categoria || "Sin categoría"}</p>
      {/* RECETA DEL PRODUCTO ELABORADO */}
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
                  <div key={item.insumo_id ?? index} className="receta-ingrediente">
                    <span>{item.insumo?.nombre ?? item.nombre ?? `Insumo ${item.insumo_id}`}</span>
                    <strong>
                      {Number(item.cantidad).toLocaleString("es-SV", { maximumFractionDigits: 3 })}{" "}
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
            <p className="mb-0">Este producto no requiere receta de preparación.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
