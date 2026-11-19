import { useEffect, useRef, useState } from "react";
import Button from "../Common/Button.jsx";
import Feedback from "../Common/Feedback.jsx";

const moneda = (valor) => `$${Number(valor ?? 0).toFixed(2)}`;

function Fila({ etiqueta, valor, negrita = false }) {
  return (
    <div className={`pos-doc-fila ${negrita ? "fw-bold" : ""}`}>
      <span>{etiqueta}</span>
      <span>{valor}</span>
    </div>
  );
}

export default function VistaPreviaFacturaModal({
  abierto,
  carrito = [],
  datosCobro,
  sucursal,
  empleado,
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
  const total = carrito.reduce(
    (suma, item) =>
      suma + Number(item.precio) * Number(item.cantidad),
    0
  );

  // Los precios se consideran con IVA incluido.
  // Verificar que coincida con la lógica del backend.
  const subtotal = total / 1.13;
  const iva = total - subtotal;

  const cantidadProductos = carrito.reduce(
    (suma, item) => suma + Number(item.cantidad),
    0
  );

  const nombreSucursal = sucursal?.nombre || "No disponible";
  const nombreEmpleado = empleado?.nombre || "No disponible";
  const fecha = new Date().toLocaleString("es-SV", {
    timeZone: "America/El_Salvador",
    dateStyle: "short",
    timeStyle: "short",
  });

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
        <div className="pos-preview-encabezado d-flex justify-content-between align-items-start gap-3 border-bottom p-3 p-md-4 flex-shrink-0">
          <div>
            <h2
              id="pos-preview-titulo"
              className="font-origenes fs-3 mb-1"
            >
              Revisar {esCCF ? "crédito fiscal" : "factura"}
            </h2>
            <p className="text-muted small mb-0">
              Verifica los datos antes de registrar la venta.
            </p>
          </div>
          <span className="badge bg-warning-subtle text-dark">
            Pendiente
          </span>
        </div>
        <div className="pos-preview-contenido container-fluid p-0 flex-grow-1">
          <div className="row g-0 h-100">
            {/* DOCUMENTO */}
            <section className="pos-preview-izquierda col-12 col-lg-7 p-3 p-md-4">
              <div className="pos-preview-documento-scroll">
                <div
                  className={`pos-preview-documento ${
                    esCCF ? "pos-preview-ccf" : "pos-preview-ticket"
                  }`}
                >
                  {esCCF ? (
                    <>
                      {/* ENCABEZADO CCF */}
                      <div className="pos-doc-ccf-encabezado">
                        <div>
                          <h3 className="fw-bold fs-6 mb-2">
                            RESTAURANTE ORÍGENES
                          </h3>
                          <div className="small">{nombreSucursal}</div>
                          <div className="small">
                            {sucursal?.direccion || ""}
                          </div>
                          {sucursal?.nit && (
                            <div className="small">
                              NIT: {sucursal.nit}
                            </div>
                          )}
                          {sucursal?.nrc && (
                            <div className="small">
                              NRC: {sucursal.nrc}
                            </div>
                          )}
                        </div>
                        <div className="pos-doc-ccf-numero">
                          <strong>COMPROBANTE DE</strong>
                          <strong>CRÉDITO FISCAL</strong>
                          <span className="pos-doc-pendiente">
                            N.º PENDIENTE
                          </span>
                          <small>DOCUMENTO INTERNO</small>
                        </div>
                      </div>
                      {/* DATOS CLIENTE */}
                      <div className="pos-doc-ccf-cliente">
                        <div>
                          <strong>Cliente:</strong>{" "}
                          {cliente?.nombre || ""}
                        </div>
                        <div>
                          <strong>Fecha:</strong> {fecha}
                        </div>
                        <div>
                          <strong>NIT:</strong> {cliente?.nit || ""}
                        </div>
                        <div>
                          <strong>NRC:</strong> {cliente?.nrc || ""}
                        </div>
                        <div>
                          <strong>Empleado:</strong> {nombreEmpleado}
                        </div>
                        <div>
                          <strong>Pago:</strong> {metodoPago}
                        </div>
                      </div>
                      {/* TABLA CCF */}
                      <div className="pos-doc-tabla-scroll">
                        <table className="pos-doc-tabla">
                          <thead>
                            <tr>
                              <th>Cant.</th>
                              <th>Descripción</th>
                              <th>Precio unit.</th>
                              <th>Ventas exentas</th>
                              <th>Ventas afectas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {carrito.map((item) => (
                              <tr key={item.id}>
                                <td>{item.cantidad}</td>
                                <td>{item.nombre}</td>
                                <td>{moneda(item.precio)}</td>
                                <td>—</td>
                                <td>
                                  {moneda(
                                    item.cantidad * item.precio
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* PIE CCF */}
                      <div className="pos-doc-ccf-pie">
                        <div className="pos-doc-entregado">
                          <strong>ENTREGADO POR</strong>
                          <p>Nombre: {nombreEmpleado}</p>
                          <p>Firma: __________________</p>
                          <hr />
                          <strong>OBSERVACIONES</strong>
                          <p>Cancelado: _____________</p>
                        </div>
                        <div className="pos-doc-totales">
                          <Fila
                            etiqueta="Sumas:"
                            valor={moneda(subtotal)}
                          />
                          <Fila
                            etiqueta="IVA (13%):"
                            valor={moneda(iva)}
                          />
                          <Fila
                            etiqueta="Sub-total:"
                            valor={moneda(subtotal)}
                          />
                          <Fila
                            etiqueta="(-) IVA retenido:"
                            valor="$0.00"
                          />
                          <Fila
                            etiqueta="Ventas exentas:"
                            valor="$0.00"
                          />
                          <Fila
                            etiqueta="VENTA TOTAL:"
                            valor={moneda(total)}
                            negrita
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* FACTURA CONSUMIDOR FINAL */}
                      <header className="pos-doc-ticket-header">
                        <h3>RESTAURANTE ORÍGENES</h3>
                        <p>Sucursal: {nombreSucursal}</p>
                        {sucursal?.direccion && (
                          <p>{sucursal.direccion}</p>
                        )}
                        {sucursal?.nit && (
                          <p>NIT: {sucursal.nit}</p>
                        )}
                        {sucursal?.nrc && (
                          <p>NRC: {sucursal.nrc}</p>
                        )}
                      </header>
                      <hr />
                      <h4 className="pos-doc-titulo">
                        FACTURA CONSUMIDOR FINAL
                      </h4>
                      <hr />
                      <Fila etiqueta="Número:" valor="Pendiente" />
                      <Fila etiqueta="Fecha:" valor={fecha} />
                      <Fila
                        etiqueta="Empleado:"
                        valor={nombreEmpleado}
                      />
                      <Fila
                        etiqueta="Sucursal:"
                        valor={nombreSucursal}
                      />
                      <Fila etiqueta="Pago:" valor={metodoPago} />
                      <hr />
                      <div className="pos-doc-fila fw-bold">
                        <span>PRODUCTO / CANTIDAD</span>
                        <span>TOTAL</span>
                      </div>
                      {carrito.map((item) => (
                        <div
                          key={item.id}
                          className="pos-doc-producto"
                        >
                          <strong>{item.nombre}</strong>
                          <Fila
                            etiqueta={`${item.cantidad} × ${moneda(
                              item.precio
                            )}`}
                            valor={moneda(
                              item.cantidad * item.precio
                            )}
                          />
                        </div>
                      ))}
                      <hr />
                      <Fila
                        etiqueta="Subtotal:"
                        valor={moneda(subtotal)}
                      />
                      <Fila
                        etiqueta="IVA (13%):"
                        valor={moneda(iva)}
                      />
                      <hr />
                      <Fila
                        etiqueta="TOTAL:"
                        valor={moneda(total)}
                        negrita
                      />
                      <hr />
                      <footer className="pos-doc-ticket-footer">
                        <strong>¡Gracias por su compra!</strong>
                        <p>Restaurante Orígenes</p>
                      </footer>
                    </>
                  )}
                  <p className="pos-doc-aviso">
                    VISTA PREVIA — DOCUMENTO SIN EMITIR
                    <br />
                    Documento interno — No válido como DTE
                  </p>
                </div>
              </div>
            </section>
            {/* RESUMEN Y BOTONES */}
            <section className="pos-preview-derecha col-12 col-lg-5 d-flex flex-column p-3 p-md-4">
              <div className="pos-preview-resumen flex-grow-1">
                <h3 className="fs-5 fw-bold mb-4">
                  Resumen de la venta
                </h3>
                <Fila
                  etiqueta="Productos:"
                  valor={cantidadProductos}
                />
                <Fila
                  etiqueta="Documento:"
                  valor={esCCF ? "CCF" : "Factura"}
                />
                <Fila
                  etiqueta="Forma de pago:"
                  valor={metodoPago}
                />
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
              <div className="pos-preview-acciones d-flex flex-column gap-2 flex-shrink-0 border-top pt-3 mt-3">
                <Feedback color="danger">{error}</Feedback>
                <Button
                  variant="secondary"
                  className="w-100 py-3 fw-bold text-white"
                  onClick={confirmarVenta}
                  disabled={confirmando}
                >
                  {confirmando ? "Registrando venta..." : "Confirmar venta"}
                </Button>
                <Button
                  variant="outline-secondary"
                  className="w-100 py-3 pos-btn-volver"
                  onClick={volver}
                  disabled={confirmando}
                >
                  Volver al cobro
                </Button>
                <p className="text-muted text-center small mb-0">
                  La venta se registrará únicamente al confirmar.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}