
import { useEffect, useRef, useState } from "react";

const clienteInicial = {
  nombre: "",
  nit: "",
  nrc: "",
};

export default function CobroModal({
  abierto,
  onCerrar,
  onConfirmar,
  total = 0,
}) {
  const [tipoDocumento, setTipoDocumento] = useState("FACTURA");
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [cliente, setCliente] = useState(clienteInicial);
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState("");

  const enviandoRef = useRef(false);

  // Reiniciar el formulario cada vez que se abre
  useEffect(() => {
    if (!abierto) return;

    setTipoDocumento("FACTURA");
    setMetodoPago("EFECTIVO");
    setCliente({ ...clienteInicial });
    setError("");
  }, [abierto]);

  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return;

    function manejarTecla(evento) {
      if (evento.key === "Escape" && !enviandoRef.current) {
        onCerrar();
      }
    }

    window.addEventListener("keydown", manejarTecla);

    return () => {
      window.removeEventListener("keydown", manejarTecla);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  function cerrarModal() {
    if (enviandoRef.current) return;
    onCerrar();
  }

  function actualizarCliente(campo, valor) {
    setCliente((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function confirmarCobro(evento) {
    evento.preventDefault();

    if (enviandoRef.current) return;

    setError("");

    if (tipoDocumento === "CCF") {
      if (
        !cliente.nombre.trim() ||
        !cliente.nit.trim() ||
        !cliente.nrc.trim()
      ) {
        setError("Completa los datos del cliente para emitir el CCF.");
        return;
      }

      if (
        cliente.nombre.trim().length > 150 ||
        cliente.nit.trim().length > 20 ||
        cliente.nrc.trim().length > 20
      ) {
        setError("Uno de los datos del cliente supera la longitud permitida.");
        return;
      }
    }

    enviandoRef.current = true;
    setCobrando(true);

    try {
      await onConfirmar({
        tipoDocumento,
        metodoPago,
        cliente,
      });
    } catch (err) {
      setError(err.message || "No se pudo registrar la venta.");
    } finally {
      enviandoRef.current = false;
      setCobrando(false);
    }
  }

  return (
    <div
      className="pos-modal-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          cerrarModal();
        }
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
                onChange={(e) =>
                  actualizarCliente("nombre", e.target.value)
                }
              />

              <div className="row g-2">
                <div className="col-6">
                  <input
                    className="form-control pos-modal-input"
                    placeholder="NIT"
                    aria-label="NIT"
                    value={cliente.nit}
                    maxLength={20}
                    required
                    disabled={cobrando}
                    onChange={(e) =>
                      actualizarCliente("nit", e.target.value)
                    }
                  />
                </div>

                <div className="col-6">
                  <input
                    className="form-control pos-modal-input"
                    placeholder="NRC"
                    aria-label="NRC"
                    value={cliente.nrc}
                    maxLength={20}
                    required
                    disabled={cobrando}
                    onChange={(e) =>
                      actualizarCliente("nrc", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <h3 className="pos-modal-seccion">2. FORMA DE PAGO</h3>

          <div className="row g-2 mb-4">
            {["EFECTIVO", "TARJETA", "BITCOIN"].map((metodo) => (
              <div className="col-4" key={metodo}>
                <button
                  type="button"
                  disabled={cobrando}
                  aria-pressed={metodoPago === metodo}
                  className={`pos-modal-opcion w-100 ${
                    metodoPago === metodo ? "seleccionado" : ""
                  }`}
                  onClick={() => setMetodoPago(metodo)}
                >
                  {metodo.charAt(0) + metodo.slice(1).toLowerCase()}
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn pos-btn-cobrar w-100 py-3 fw-bold"
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
          </button>

          <button
            type="button"
            className="btn btn-link text-muted w-100 mt-2"
            onClick={cerrarModal}
            disabled={cobrando}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
