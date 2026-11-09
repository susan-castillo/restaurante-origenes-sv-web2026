
const moneda = (valor) => `$${Number(valor ?? 0).toFixed(2)}`;

export default function VentaCompletadaModal({
  venta,
  onNuevaVenta,
  onImprimir,
}) {
  if (!venta) return null;

  const documento = venta.tipo_doc === "CCF" ? "CCF" : "Factura";

  return (
    <div className="pos-modal-overlay">
      <div
        className="pos-venta-completada bg-white rounded-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-venta-completada-titulo"
      >
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

        <h2
          id="pos-venta-completada-titulo"
          className="font-origenes mb-2"
        >
          ¡Venta completada!
        </h2>

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

        <button
          type="button"
          className="btn pos-venta-imprimir w-100 py-3 fw-bold mb-2"
          onClick={() => onImprimir(venta)}
          disabled={!onImprimir}
        >
          Imprimir comprobante
        </button>

        <button
          type="button"
          className="btn pos-btn-cobrar w-100 py-3 fw-bold"
          onClick={onNuevaVenta}
        >
          Nueva venta
        </button>
      </div>
    </div>
  );
}
