import * as sucursalService from "../services/sucursalService.js";

// Controlador para listar sucursales
export const getSucursales = async (req, res) => {
  try {
    // Incluir inactivas
    const incluirInactivas = req.query.todas === "true";

    // Le pasamos req.usuario (que lo inyecta verifyToken)
    const sucursales = await sucursalService.getSucursales(
      req.usuario,
      incluirInactivas,
    );
    return res.status(200).json(sucursales);
  } catch (error) {
    console.error("Error al obtener sucursales:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener la lista de sucursales." });
  }
};

export async function getSucursalPorId(req, res) {
  const id = req.params.id;

  const sucursalId = Number(id);

  if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
    return res.status(400).json({ error: "El id de la sucursal es invalido" });
  }

  try {
    const sucursal = await sucursalService.obtenerSucursalPorId(sucursalId);

    if (!sucursal) {
      return res
        .status(404)
        .json({ error: `No se encontro sucursal con id: ${sucursalId}` });
    }

    return res.status(200).json(sucursal);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error interno al obtener la sucursal" });
  }
}

export async function registrarSucursal(req, res) {
  const { nombreSucursal, direccionSucursal } = req.body;

  if (
    !nombreSucursal ||
    typeof nombreSucursal !== "string" ||
    nombreSucursal.trim() === ""
  ) {
    return res
      .status(400)
      .json({ error: "El nombre de la sucursal es obligattorio" });
  }

  try {
    const sucursal = await sucursalService.crearSucursal(
      nombreSucursal,
      direccionSucursal,
    );

    return res
      .status(201)
      .json({ mensaje: "Sucursal creada exitosamente", sucursal: sucursal });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Hubo un error interno al registrar la sucursal" });
  }
}

export async function actualizarSucursal(req, res) {
  const idSucursal = Number(req.params.id);
  const { nombre, direccion } = req.body;

  if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
    return res.status(400).json({ error: "ID de sucursal invalido" });
  }

  if (nombre === undefined && direccion === undefined) {
    return res.status(400).json({ error: "Se debe enviar al menos un campo" });
  }

  if (nombre !== undefined) {
    if (typeof nombre !== "string" || nombre.trim() === "") {
      return res
        .status(400)
        .json({ error: "El nombre de la sucursal no puede estar vacio" });
    }
  }

  try {
    const sucursal = await sucursalService.actualizarSucursal(
      idSucursal,
      nombre,
      direccion,
    );

    return res.status(200).json({
      mensaje: "Sucursal actualizada exitosamente!",
      sucursal: sucursal,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "La sucursal que intentas actualizar no existe" });
    }
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error interno al actualizar la sucursal" });
  }
}

export async function desactivarSucursal(req, res) {
  const idSucursal = Number(req.params.id);

  if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
    return res.status(400).json({ error: "ID de sucursal invalido" });
  }

  try {
    const sucursal = await sucursalService.desactivarSucursal(idSucursal);

    return res.status(200).json({
      mensaje: "Sucursal desactivada exitosamente",
      sucursal: sucursal,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "La sucursal que desea desactivar no existe" });
    }
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error interno al desactivar la sucursal" });
  }
}
