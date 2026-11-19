import Tabs from "../Common/Tabs.jsx";

export default function InsumosFiltros({
  opciones,
  filtro,
  onFiltrar,
  busqueda,
  onBuscar,
  esAdminCentral,
  sucursalAsignada,
  sucursales,
  sucursalSeleccionada,
  onCambiarSucursal,
  cargandoSesion,
  errorSucursales,
}) {
  return (
    <div className="inventario-filtros">
      <Tabs variant="pills" options={opciones} value={filtro} onChange={onFiltrar} />
      <input
        type="search"
        className="form-control mt-3"
        placeholder="Buscar insumo por nombre..."
        aria-label="Buscar insumos"
        value={busqueda}
        onChange={(event) => onBuscar(event.target.value)}
        maxLength={100}
      />
      {esAdminCentral && (
        <div className="mt-3" style={{ maxWidth: 360 }}>
          <label htmlFor="inventario-sucursal" className="form-label">
            Sucursal
          </label>
          <select
            id="inventario-sucursal"
            className="form-select"
            value={sucursalSeleccionada}
            onChange={(event) => onCambiarSucursal(event.target.value)}
            disabled={cargandoSesion || sucursales.length === 0}
          >
            <option value="todas">Todas las sucursales</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={String(sucursal.id)}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
          {errorSucursales && (
            <p className="text-danger mt-2" role="alert">
              {errorSucursales}
            </p>
          )}
        </div>
      )}
      {!esAdminCentral && sucursalAsignada != null && (
        <p className="mt-3 mb-0 text-muted">Inventario de tu sucursal asignada</p>
      )}
    </div>
  );
}
