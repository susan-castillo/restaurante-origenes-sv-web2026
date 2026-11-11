import { useEffect, useRef, useState } from "react";
import Button from "../Common/Button.jsx";
import Feedback from "../Common/Feedback.jsx";

const clienteInicial = {
  nombre: "",
  nit: "",
  nrc: "",
};

// Tarjetas ficticias para demostración
const TARJETAS_PRUEBA = {
  "1111111111111111": "APROBADA",
  "0000000000000000": "FONDOS_INSUFICIENTES",
};

export default function CobroModal({ abierto, onCerrar, onConfirmar, total = 0 }) {
  const [tipoDocumento, setTipoDocumento] = useState("FACTURA");
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [cliente, setCliente] = useState(clienteInicial);
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState("");
  const enviandoRef = useRef(false);

  useEffect(() => {
    if (!abierto) return;
    setTipoDocumento("FACTURA");
    setMetodoPago("EFECTIVO");
    setCliente({ ...clienteInicial });
    setNumeroTarjeta("");
    setError("");
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    function manejarTecla(evento) {
      if (evento.key === "Escape" && !enviandoRef.current) {
        onCerrar();
      }
    }

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  function cerrarModal() {
    if (!enviandoRef.current) onCerrar();
  }

  function actualizarCliente(campo, valor) {
    const nuevoValor =
      campo === "nit" || campo === "nrc"
        ? valor.replace(/\D/g, "")
        : valor;

    setCliente((anterior) => ({
      ...anterior,
      [campo]: nuevoValor,
    }));
    setError("");
  }

  function seleccionarMetodo(metodo) {
    setMetodoPago(metodo);
    setNumeroTarjeta("");
    setError("");
  }

  function actualizarTarjeta(valor) {
    const digitos = valor.replace(/\D/g, "").slice(0, 16);
    const formateado = digitos.match(/.{1,4}/g)?.join(" ") ?? "";
    setNumeroTarjeta(formateado);
    setError("");
  }

  async function confirmarCobro(evento) {
    evento.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    // Validar datos del CCF
    if (tipoDocumento === "CCF") {
      const { nombre, nit, nrc } = cliente;

      if (!nombre.trim() || !nit.trim() || !nrc.trim()) {
        setError("Completa los datos del cliente para emitir el CCF.");
        return;
      }
      if (nombre.trim().length > 150) {
        setError("El nombre o razón social es demasiado largo.");
        return;
      }
      if (!/^(?:\d{9}|\d{14})$/.test(nit)) {
        setError("El NIT debe contener exactamente 9 o 14 dígitos.");
        return;
      }
      if (!/^\d{1,9}$/.test(nrc)) {
        setError("El NRC debe contener entre 1 y 9 dígitos.");
        return;
      }
    }

    // Validación ficticia de tarjeta
    if (metodoPago === "TARJETA") {
      const numero = numeroTarjeta.replace(/\s/g, "");
      const resultado = TARJETAS_PRUEBA[numero];

      if (resultado === "FONDOS_INSUFICIENTES") {
        setError("Pago denegado: fondos insuficientes.");
        return;
      }
      if (resultado !== "APROBADA") {
        setError("Tarjeta no reconocida.");
        return;
      }
    }

    enviandoRef.current = true;
    setCobrando(true);

    try {
      await onConfirmar({ tipoDocumento, metodoPago, cliente });
    } catch (err) {
      setError(err.message || "No se pudo procesar el cobro.");
    } finally {
      enviandoRef.current = false;
      setCobrando(false);
    }
  }

  return (
    <div
      className="pos-modal-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) cerrarModal();
      }}
    >
      <div
        className="pos-cobro-modal bg-white rounded-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-cobro-titulo"
      >
        <h2 id="pos-cobro-titulo" className="font-origenes mb-2">
          Completar cobro
        </h2>
        <p className="text-muted mb-4">
          Total a cobrar: <strong>${Number(total).toFixed(2)}</strong>
        </p>

        <form onSubmit={confirmarCobro}>
          <h3 className="pos-modal-seccion">1. DOCUMENTO</h3>
          <div className="row g-2 mb-3">
            {["FACTURA", "CCF"].map((tipo) => (
              <div className="col-6" key={tipo}>
                <button
                  type="button"
                  disabled={cobrando}
                  aria-pressed={tipoDocumento === tipo}
                  className={`pos-modal-opcion w-100 ${
                    tipoDocumento === tipo ? "seleccionado" : ""
                  }`}
                  onClick={() => {
                    setTipoDocumento(tipo);
                    setError("");
                  }}
                >
                  {tipo === "FACTURA" ? "Factura" : "CCF"}
                </button>
              </div>
            ))}
          </div>

          {tipoDocumento === "CCF" && (
            <div className="mb-4">
              <input
                className="form-control pos-modal-input mb-2"
                placeholder="Nombre o razón social"
                aria-label="Nombre o razón social"
                value={cliente.nombre}
                maxLength={150}
                required
                disabled={cobrando}
                onChange={(e) => actualizarCliente("nombre", e.target.value)}
              />
              <div className="row g-2">
                <div className="col-6">
                  <input
                    className="form-control pos-modal-input"
                    placeholder="NIT"
                    aria-label="NIT"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cliente.nit}
                    maxLength={14}
                    required
                    disabled={cobrando}
                    onChange={(e) => actualizarCliente("nit", e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <input
                    className="form-control pos-modal-input"
                    placeholder="NRC"
                    aria-label="NRC"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cliente.nrc}
                    maxLength={9}
                    required
                    disabled={cobrando}
                    onChange={(e) => actualizarCliente("nrc", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <h3 className="pos-modal-seccion">2. FORMA DE PAGO</h3>
          <div className="row g-2 mb-3">
            {["EFECTIVO", "TARJETA", "BITCOIN"].map((metodo) => (
              <div className="col-4" key={metodo}>
                <button
                  type="button"
                  disabled={cobrando}
                  aria-pressed={metodoPago === metodo}
                  className={`pos-modal-opcion w-100 ${
                    metodoPago === metodo ? "seleccionado" : ""
                  }`}
                  onClick={() => seleccionarMetodo(metodo)}
                >
                  {metodo.charAt(0) + metodo.slice(1).toLowerCase()}
                </button>
              </div>
            ))}
          </div>

          {metodoPago === "TARJETA" && (
            <div className="pos-pago-extra mb-4">
              <h4 className="fs-6 fw-bold mb-2">Pago con tarjeta</h4>
              <p className="text-muted small">
                Ingresa el número de una tarjeta de prueba.
              </p>
              <label
                htmlFor="numero-tarjeta"
                className="form-label small fw-semibold"
              >
                Número de tarjeta
              </label>
              <input
                id="numero-tarjeta"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className="form-control pos-modal-input"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                value={numeroTarjeta}
                disabled={cobrando}
                onChange={(e) => actualizarTarjeta(e.target.value)}
              />
            </div>
          )}

          {metodoPago === "BITCOIN" && (
            <div className="pos-pago-extra text-center mb-4">
              <h4 className="fs-6 fw-bold mb-3">Pago con Bitcoin</h4>
              <p className="text-muted small">
                Escanea el siguiente código QR para visualizar el pago.
              </p>
              <img
                src="/qrBitcoin.png"
                alt="Código QR de Bitcoin"
                className="pos-bitcoin-qr"
              />
              <p className="text-muted small mt-3 mb-0">
                Pago de demostración. No se verifican transacciones reales.
              </p>
            </div>
          )}

          <Feedback color="danger">{error}</Feedback>

          <Button
            type="submit"
            variant="secondary"
            className="w-100 py-3 fw-bold text-white"
            disabled={cobrando}
          >
            {cobrando ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                />
                Procesando cobro...
              </>
            ) : (
              "Confirmar cobro"
            )}
          </Button>
          <Button
            type="button"
            variant="link"
            className="text-muted w-100 mt-2"
            onClick={cerrarModal}
            disabled={cobrando}
          >
            Cancelar
          </Button>
        </form>
      </div>
    </div>
  );
}
