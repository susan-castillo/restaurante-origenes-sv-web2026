import { useId, useRef } from "react";
import { Camera } from "lucide-react";

export default function CampoImagen({ valor, onCambiar, disabled = false }) {
  const id = useId();
  const selector = useRef(null);

  function seleccionarArchivo(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    const ruta = `/img/platillos/${encodeURIComponent(archivo.name)}`;
    onCambiar(ruta, archivo);
    evento.target.value = "";
  }

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        Foto del producto (opcional)
      </label>

      <div className="input-group">
        <input
          id={id}
          type="text"
          className="form-control"
          placeholder="Pega el enlace directo de la foto"
          value={valor ?? ""}
          maxLength={255}
          disabled={disabled}
          onChange={(evento) => onCambiar(evento.target.value, null)}
        />

        <button
          type="button"
          className="btn btn-outline-secondary"
          title="Elegir una foto"
          aria-label="Elegir una foto de mi computadora"
          disabled={disabled}
          onClick={() => selector.current?.click()}
        >
          <Camera size={18} aria-hidden="true" />
        </button>
      </div>

      <input
        ref={selector}
        type="file"
        accept="image/*"
        hidden
        disabled={disabled}
        onChange={seleccionarArchivo}
      />
    </div>
  );
}