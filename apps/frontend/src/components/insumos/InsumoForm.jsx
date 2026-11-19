import Button from "../Common/Button.jsx";
import Modal from "../Common/Modal.jsx";

export default function InsumoForm({
  show,
  editando,
  nombre,
  unidad,
  guardando,
  error,
  onCambiarNombre,
  onCambiarUnidad,
  onClose,
  onGuardar,
}) {
  const textoGuardar = editando ? "Guardar cambios" : "Agregar insumo";
  const idNombre = editando ? "editar-insumo-nombre" : "nuevo-insumo-nombre";
  const idUnidad = editando ? "editar-insumo-unidad" : "nuevo-insumo-unidad";

  return (
    <Modal
      show={show}
      title={editando ? "Editar insumo" : "Agregar insumo"}
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
            text={guardando ? "Guardando..." : textoGuardar}
            variant="secondary"
            disabled={guardando || !nombre.trim()}
            onClick={onGuardar}
          />
        </>
      }
    >
      <div className="mb-3">
        <label className="form-label" htmlFor={idNombre}>
          Nombre del insumo
        </label>
        <input
          id={idNombre}
          type="text"
          className="form-control"
          maxLength={100}
          placeholder={editando ? undefined : "Ej. Café en grano"}
          value={nombre}
          onChange={(event) => onCambiarNombre(event.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor={idUnidad}>
          Unidad de medida
        </label>
        <select
          id={idUnidad}
          className="form-select"
          value={unidad}
          onChange={(event) => onCambiarUnidad(event.target.value)}
        >
          <option value="g">Gramos (g)</option>
          <option value="ml">Mililitros (ml)</option>
          <option value="unidad">Unidad</option>
        </select>
      </div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
