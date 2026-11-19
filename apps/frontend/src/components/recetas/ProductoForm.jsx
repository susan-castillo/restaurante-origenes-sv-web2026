import Button from "../Common/Button.jsx";
import Modal from "../Common/Modal.jsx";

export default function ProductoForm({
  show,
  nombre,
  categoria,
  precio,
  tipo,
  guardando,
  error,
  onCambiarNombre,
  onCambiarCategoria,
  onCambiarPrecio,
  onCambiarTipo,
  onClose,
  onGuardar,
}) {
  return (
    <Modal
      show={show}
      title="Agregar producto"
      onClose={() => {
        if (!guardando) {
          onClose();
        }
      }}
      footer={
        <>
          <Button
            text="Cancelar"
            variant="outline-secondary"
            disabled={guardando}
            onClick={onClose}
          />
          <Button
            text={guardando ? "Guardando..." : "Agregar producto"}
            variant="secondary"
            disabled={guardando || !nombre.trim() || precio.trim() === ""}
            onClick={onGuardar}
          />
        </>
      }
    >
      {/* NOMBRE DEL PRODUCTO */}
      <div className="mb-3">
        <label className="form-label" htmlFor="producto-nombre">
          Nombre del producto
        </label>
        <input
          id="producto-nombre"
          type="text"
          className="form-control"
          placeholder="Ej. Cappuccino"
          value={nombre}
          maxLength={100}
          onChange={(e) => onCambiarNombre(e.target.value)}
        />
      </div>
      {/* CATEGORÍA */}
      <div className="mb-3">
        <label className="form-label" htmlFor="producto-categoria">
          Categoría
        </label>
        <input
          id="producto-categoria"
          type="text"
          className="form-control"
          placeholder="Ej. Bebidas calientes"
          value={categoria}
          maxLength={50}
          onChange={(e) => onCambiarCategoria(e.target.value)}
        />
      </div>
      {/* PRECIO */}
      <div className="mb-3">
        <label className="form-label" htmlFor="producto-precio">
          Precio de venta ($)
        </label>
        <input
          id="producto-precio"
          type="number"
          className="form-control"
          placeholder="Ej. 2.75"
          min="0"
          max="999999.99"
          step="0.01"
          value={precio}
          onChange={(e) => onCambiarPrecio(e.target.value)}
        />
      </div>
      {/* TIPO DE PRODUCTO */}
      <div className="mb-3">
        <label className="form-label" htmlFor="producto-tipo">
          Tipo de producto
        </label>
        <select
          id="producto-tipo"
          className="form-select"
          value={tipo}
          onChange={(e) => onCambiarTipo(e.target.value)}
        >
          <option value="ELABORADO">Elaborado (requiere receta)</option>
          <option value="REVENTA">Reventa (sin receta)</option>
        </select>
      </div>
      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
