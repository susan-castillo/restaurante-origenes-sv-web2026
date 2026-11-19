import Tabs from "../Common/Tabs.jsx";
import ProductoCard from "./ProductoCard.jsx";

export default function RecetasListado({
  opciones,
  filtro,
  onFiltrar,
  productos,
  cargando,
  error,
  recetas,
  erroresRecetas,
  cargandoReceta,
  onEditarReceta,
  onReintentar,
}) {
  return (
    <section className="recetas-seccion">
      {/* FILTROS DE PRODUCTOS */}
      <div className="recetas-filtros">
        <Tabs variant="pills" options={opciones} value={filtro} onChange={onFiltrar} />
      </div>
      {/* MENSAJE DE CARGA */}
      {cargando && (
        <div className="inventario-mensaje" role="status">
          Cargando productos...
        </div>
      )}
      {/* MENSAJE DE ERROR */}
      {!cargando && error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {/* TARJETAS DE PRODUCTOS Y RECETAS */}
      {!cargando && !error && (
        <div
          className="row g-3"
          style={{
            maxHeight: "calc(2 * 390px + 1rem)",
            overflowY: "auto",
            overflowX: "hidden",
            alignContent: "flex-start",
          }}
        >
          {productos.length === 0 ? (
            <div className="col-12">
              <p className="inventario-mensaje">No hay productos registrados para este filtro.</p>
            </div>
          ) : (
            productos.map((producto) => {
              const id = Number(producto.id ?? producto.platillo_id);
              if (!Number.isInteger(id) || id <= 0) {
                console.warn("Producto sin identificador válido:", producto);
                return null;
              }
              return (
                <div key={id} className="col-12 col-md-4">
                  <ProductoCard
                    producto={producto}
                    ingredientes={recetas[id]}
                    error={erroresRecetas[id]}
                    reintentando={cargandoReceta === id}
                    onEditarReceta={() => onEditarReceta(producto)}
                    onReintentar={() => onReintentar(id)}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
