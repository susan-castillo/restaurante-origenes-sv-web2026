import Button from "../Common/Button.jsx";
import Modal from "../Common/Modal.jsx";

export default function InsumoEstadoConfirmacion({
  show,
  insumo,
  guardando,
  error,
  onClose,
  onConfirmar,
}) {
  return (
    <Modal
      show={show}
      title="Deshabilitar insumo"
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
            text={guardando ? "Deshabilitando..." : "Deshabilitar"}
            variant="danger"
            disabled={guardando}
            onClick={onConfirmar}
          />
        </>
      }
    >
      <p>
        ¿Estás segura de que deseas deshabilitar el insumo <strong>{insumo?.nombre}</strong>?
      </p>
      <div className="alert alert-warning mb-0">
        El insumo dejará de aparecer en las existencias activas, pero no se borrará de la base de
        datos.
      </div>
      {error && (
        <div className="alert alert-danger mt-2" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
