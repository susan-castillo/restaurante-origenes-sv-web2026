import Modal from "../Common/Modal.jsx";
import Button from "../Common/Button.jsx";

const moneda = (valor) => `$${Number(valor ?? 0).toFixed(2)}`;

export default function VentaCompletadaModal({
  venta,
  onNuevaVenta,
  onImprimir,
}) {
  if (!venta) return null;

  const documento = venta.tipo_doc === "CCF" ? "CCF" : "Factura";

  return (
    <Modal show title="¡Venta completada!" showCloseButton={false}>
      <div className="text-center">
        <div className="pos-venta-exito-icono">
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <p className="text-muted mb-4">
          La venta se registró correctamente.
        </p>

        <div className="pos-venta-completada-resumen mb-4">
          <span className="text-muted">
            {documento} #{venta.numero}
          </span>
          <strong className="pos-venta-completada-total">
            {moneda(venta.total)}
          </strong>
          <small className="text-muted">
            Pago: {venta.metodo_pago}
          </small>
        </div>

        <Button
          variant="outline-secondary"
          className="w-100 py-3 fw-bold mb-2 pos-btn-volver"
          onClick={() => onImprimir?.(venta)}
          disabled={!onImprimir}
        >
          Imprimir comprobante
        </Button>
        <Button
          variant="secondary"
          className="w-100 py-3 fw-bold text-white"
          onClick={onNuevaVenta}
        >
          Nueva venta
        </Button>
      </div>
    </Modal>
  );
}