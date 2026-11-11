
import { useEffect, useRef, useState } from "react";

const moneda = (valor) => `$${Number(valor ?? 0).toFixed(2)}`;

export default function VistaPreviaFacturaModal({
  abierto,
  carrito = [],
  datosCobro,
  sucursal,
  onConfirmar,
  onVolver,
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const enviandoRef = useRef(false);

  useEffect(() => {
    if (abierto) setError("");
  }, [abierto]);

  if (!abierto || !datosCobro) return null;

  const { tipoDocumento, metodoPago, cliente } = datosCobro;
  const esCCF = tipoDocumento === "CCF";

  const subtotal = carrito.reduce(
    (suma, item) =>
      suma + Number(item.precio) * Number(item.cantidad),
    0
  );

  // Vista previa: confirmar que coincide con el cálculo del backend.
  const total = subtotal;
  const ivaIncluido = total - total / 1.13;

  const cantidadProductos = carrito.reduce(
    (suma, item) => suma + Number(item.cantidad),
    0
  );

  async function confirmarVenta() {
    if (enviandoRef.current) return;

    enviandoRef.current = true;
    setConfirmando(true);
    setError("");

    try {
      await onConfirmar();
    } catch (err) {
      setError(err.message || "No se pudo registrar la venta.");
    } finally {
      enviandoRef.current = false;
      setConfirmando(false);
    }
  }

  function volver() {
    if (!enviandoRef.current) onVolver();
  }

  return (
    <div className="pos-modal-overlay">
      <div
        className="pos-preview-modal bg-white rounded-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-preview-titulo"
      >
        <div className="pos-preview-encabezado">
          <div>
            <h2
              id="pos-preview-titulo"
              className="font-origenes fs-3 mb-1"
            >
              Revisar factura
            </h2>
            <p className="text-muted small mb-0">
              Verifica los datos antes de registrar la venta.
            </p>
          </div>

          <span className="badge bg-warning-subtle text-dark">
            Pendiente
          </span>
        </div>

        <div className="pos-preview-contenido">
          {/* IZQUIERDA: COMPROBANTE */}
          <section className="pos-preview-izquierda">
            <div className="pos-preview-documento-scroll">
              <div
                className={`pos-preview-documento ${
                  esCCF ? "pos-preview-ccf" : "pos-preview-ticket"
                }`}
              >
                <header className="text-center mb-3">
                  <h3 className="fs-6 fw-bold mb-1">
                    RESTAURANTE ORÍGENES
                  </h3>

                  <p className="small mb-1">
                    {sucursal?.nombre || "Restaurante Orígenes"}
                  </p>

                  {sucursal?.direccion && (
                    <p className="small text-muted mb-1">
                      {sucursal.direccion}
                    </p>
                  )}

                  <strong className="d-block mt-3">
                    {esCCF
                      ? "COMPROBANTE DE CRÉDITO FISCAL"
                      : "FACTURA"}
                  </strong>

                  <small className="text-muted">
                    VISTA PREVIA - SIN EMITIR
                  </small>
                </header>

                <hr />

                <div className="small mb-3">
                  <div>
                    <strong>Número:</strong> Pendiente
                  </div>
                  <div>
                    <strong>Pago:</strong> {metodoPago}
                  </div>
                  <div>
                    <strong>Fecha:</strong>{" "}
                    {new Date().toLocaleString("es-SV")}
                  </div>
                </div>

                {esCCF && (
                  <div className="pos-preview-cliente mb-3">
                    <strong className="d-block mb-2">
                      DATOS DEL CLIENTE
                    </strong>
                    <div>Cliente: {cliente?.nombre}</div>
                    <div>NIT: {cliente?.nit}</div>
                    <div>NRC: {cliente?.nrc}</div>
                  </div>
                )}

                <hr />

                <div className="fw-bold small mb-3">
                  DETALLE DE PRODUCTOS
                </div>

                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className="pos-preview-item"
                  >
                    <div className="fw-semibold small">
                      {item.nombre}
                    </div>

                    <div className="d-flex justify-content-between gap-2 small">
                      <span>
                        {item.cantidad} × {moneda(item.precio)}
                      </span>

                      <span>
                        {moneda(item.cantidad * item.precio)}
                      </span>
                    </div>
                  </div>
                ))}

                <hr />

                <div className="d-flex justify-content-between small mb-2">
                  <span>Subtotal estimado</span>
                  <span>{moneda(subtotal)}</span>
                </div>

                <div className="d-flex justify-content-between small mb-2">
                  <span>IVA incluido (estimado)</span>
                  <span>{moneda(ivaIncluido)}</span>
                </div>

                <div className="d-flex justify-content-between fw-bold mt-3">
                  <span>TOTAL</span>
                  <span>{moneda(total)}</span>
                </div>

                <hr />

                <p className="text-center small text-muted mb-0 mt-4">
                  Documento interno - No válido como DTE.
                  <br />
                  Vista previa, no representa una venta registrada.
                </p>
              </div>
            </div>
          </section>

          {/* DERECHA: RESUMEN Y ACCIONES */}
          <section className="pos-preview-derecha">
            <div className="pos-preview-resumen">
              <h3 className="fs-5 fw-bold mb-4">
                Resumen de la venta
              </h3>

              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Productos</span>
                <strong>{cantidadProductos}</strong>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Documento</span>
                <strong>{esCCF ? "CCF" : "Factura"}</strong>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Forma de pago</span>
                <strong>{metodoPago}</strong>
              </div>

              <hr />

              <h4 className="fs-6 fw-bold mb-3">
                Productos seleccionados
              </h4>

              <div className="pos-preview-lista">
                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className="d-flex justify-content-between gap-3 mb-3"
                  >
                    <span className="small">
                      {item.cantidad} × {item.nombre}
                    </span>

                    <strong className="small text-nowrap">
                      {moneda(item.cantidad * item.precio)}
                    </strong>
                  </div>
                ))}
              </div>

              <hr />

              <p className="text-muted small mb-1">
                Total estimado
              </p>

              <div className="pos-preview-total">
                {moneda(total)}
              </div>
            </div>

            <div className="pos-preview-acciones">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="btn pos-btn-cobrar w-100 py-3 fw-bold"
                onClick={confirmarVenta}
                disabled={confirmando}
              >
                {confirmando
                  ? "Registrando venta..."
                  : "Confirmar venta"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary w-100 py-3"
                onClick={volver}
                disabled={confirmando}
              >
                Volver al cobro
              </button>

              <p className="text-muted text-center small mb-0">
                La venta se registrará únicamente al confirmar.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
