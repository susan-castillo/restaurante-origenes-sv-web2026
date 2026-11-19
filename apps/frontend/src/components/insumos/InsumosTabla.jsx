import { Ban, Pencil, RotateCcw } from "lucide-react";
import StatusBadge from "../Common/StatusBadge.jsx";

export default function InsumosTabla({
  insumos,
  filtro,
  esAdminCentral,
  cargando,
  error,
  habilitandoId,
  obtenerEstado,
  onEditar,
  onDeshabilitar,
  onHabilitar,
}) {
  if (cargando) {
    return (
      <div className="inventario-mensaje" role="status">
        Cargando existencias...
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="inventario-tabla-contenedor" style={{ maxHeight: "608px", overflowY: "auto" }}>
      <table className="inventario-tabla">
        <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff" }}>
          <tr>
            <th>Insumo</th>
            {esAdminCentral && <th>Sucursal</th>}
            <th>Existencia</th>
            <th>Mínimo</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {insumos.length === 0 ? (
            <tr>
              <td colSpan={esAdminCentral ? 6 : 5} className="inventario-mensaje">
                {filtro === "deshabilitados"
                  ? "No hay insumos deshabilitados."
                  : filtro === "todos"
                    ? "No hay insumos registrados."
                    : "No hay insumos que coincidan con este filtro."}
              </td>
            </tr>
          ) : (
            insumos.map((item) => {
              const stock = Number(item.stock_actual);
              const minimo = Number(item.stock_minimo);
              const estado = obtenerEstado(item);
              return (
                <tr key={`${item.sucursal_id ?? "propia"}-${item.insumo_id}`}>
                  {/* NOMBRE DEL INSUMO */}
                  <td className="inventario-nombre">{item.nombre}</td>
                  {esAdminCentral && (
                    <td>
                      {filtro === "deshabilitados"
                        ? "Catálogo global"
                        : (item.sucursal_nombre ?? "—")}
                    </td>
                  )}
                  {/* EXISTENCIA ACTUAL */}
                  <td>
                    {filtro === "deshabilitados" ? (
                      "—"
                    ) : (
                      <>
                        {stock.toLocaleString("es-SV")} {item.unidad}
                      </>
                    )}
                  </td>
                  {/* STOCK MÍNIMO */}
                  <td>
                    {filtro === "deshabilitados" ? (
                      "—"
                    ) : (
                      <>
                        {minimo.toLocaleString("es-SV")} {item.unidad}
                      </>
                    )}
                  </td>
                  {/* ESTADO */}
                  <td>
                    <StatusBadge
                      text={filtro === "deshabilitados" ? "Deshabilitado" : estado.texto}
                      variant={filtro === "deshabilitados" ? "danger" : estado.variante}
                    />
                  </td>
                  {/* ACCIONES */}
                  <td>
                    {filtro === "deshabilitados" ? (
                      <div className="inventario-acciones">
                        <button
                          type="button"
                          className="inventario-icono inventario-icono--editar"
                          title="Volver a habilitar insumo"
                          aria-label={`Habilitar ${item.nombre}`}
                          onClick={() => onHabilitar(item)}
                          disabled={habilitandoId !== null}
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="inventario-acciones">
                        {/* EDITAR */}
                        <button
                          type="button"
                          className="inventario-icono inventario-icono--editar"
                          title="Editar insumo"
                          aria-label={`Editar ${item.nombre}`}
                          onClick={() => onEditar(item)}
                        >
                          <Pencil size={18} />
                        </button>
                        {/* DESHABILITAR (sin borrar de la base de datos) */}
                        <button
                          type="button"
                          className="inventario-icono inventario-icono--eliminar"
                          title="Deshabilitar insumo"
                          aria-label={`Deshabilitar ${item.nombre}`}
                          onClick={() => onDeshabilitar(item)}
                        >
                          <Ban size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
