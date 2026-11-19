import { Trash2 } from "lucide-react";
import Button from "../Common/Button.jsx";
import Modal from "../Common/Modal.jsx";

export default function RecetaForm({
  show,
  producto,
  catalogoInsumos,
  ingredientes,
  cargando,
  guardando,
  error,
  onAgregarIngrediente,
  onCambiarIngrediente,
  onQuitarIngrediente,
  onClose,
  onGuardar,
}) {
  return (
    <Modal
      show={show}
      title={`Receta: ${producto?.nombre || ""}`}
      size="lg"
      onClose={() => {
        if (!guardando) onClose();
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
            text={guardando ? "Guardando..." : "Guardar receta"}
            variant="secondary"
            disabled={guardando || cargando || Boolean(error)}
            onClick={onGuardar}
          />
        </>
      }
    >
      <p className="text-muted mb-3">
        Selecciona los ingredientes y las cantidades necesarias para preparar una unidad del
        producto.
      </p>
      {cargando ? (
        <p role="status">Cargando ingredientes...</p>
      ) : (
        <>
          {ingredientes.map((item, index) => {
            const insumoSeleccionado = catalogoInsumos.find(
              (insumo) => insumo.id === Number(item.insumo_id),
            );
            return (
              <div key={index} className="row g-2 align-items-end mb-3">
                {/* INSUMO */}
                <div className="col-12 col-md-6">
                  <label className="form-label">Ingrediente {index + 1}</label>
                  <select
                    className="form-select"
                    value={item.insumo_id}
                    onChange={(e) => onCambiarIngrediente(index, "insumo_id", e.target.value)}
                  >
                    <option value="">Seleccionar insumo</option>
                    {catalogoInsumos.map((insumo) => (
                      <option key={insumo.id} value={insumo.id}>
                        {insumo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {/* CANTIDAD */}
                <div className="col-8 col-md-4">
                  <label className="form-label">
                    Cantidad
                    {insumoSeleccionado ? ` (${insumoSeleccionado.unidad})` : ""}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min="0.001"
                    step="0.001"
                    value={item.cantidad}
                    placeholder="Ej. 18"
                    onChange={(e) => onCambiarIngrediente(index, "cantidad", e.target.value)}
                  />
                </div>
                {/* ELIMINAR INGREDIENTE */}
                <div className="col-4 col-md-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger w-100"
                    title="Quitar ingrediente"
                    aria-label={`Quitar ingrediente ${index + 1}`}
                    onClick={() => onQuitarIngrediente(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
          <Button
            text="+ Añadir ingrediente"
            variant="outline-secondary"
            disabled={ingredientes.length >= 50}
            onClick={onAgregarIngrediente}
          />
          {ingredientes.length === 0 && (
            <p className="text-muted mt-3">Esta receta todavía no tiene ingredientes.</p>
          )}
        </>
      )}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
