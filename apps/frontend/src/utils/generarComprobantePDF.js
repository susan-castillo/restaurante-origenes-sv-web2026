
import { jsPDF } from "jspdf";

const moneda = (valor) => `$${Number(valor ?? 0).toFixed(2)}`;

function fechaVenta(fecha) {
  if (!fecha) return "Sin fecha";

  return new Date(fecha).toLocaleString("es-SV", {
    timeZone: "America/El_Salvador",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function guardarPDF(doc, venta) {
  const tipo = venta.tipo_doc === "CCF" ? "CCF" : "Factura";
  doc.save(`${tipo}_${venta.numero}.pdf`);
}

// ========================================
// FACTURA CONSUMIDOR FINAL - TICKET 80 MM
// ========================================

function generarFactura(venta) {
  const ancho = 80;
  const margen = 5;
  const anchoContenido = ancho - margen * 2;

  const detalles = venta.detalle_venta || [];
  const sucursal = venta.sucursales || {};

  const empleado =
    venta.usuarios?.nombre ||
    venta.usuario?.nombre ||
    venta.empleado?.nombre ||
    "No disponible";

  // Datos fiscales opcionales: no inventar información
  const nit = sucursal.nit || venta.nit_emisor;
  const nrc = sucursal.nrc || venta.nrc_emisor;

  // Primera pasada: calcular la altura necesaria.
  // Segunda pasada: dibujar en un documento con esa altura.
  function dibujar(doc) {
    let y = 10;

    function configurarFuente(tamano, negrita = false) {
      doc.setFont("helvetica", negrita ? "bold" : "normal");
      doc.setFontSize(tamano);
      doc.setTextColor(35, 35, 35);
    }

    function texto(contenido, opciones = {}) {
      const {
        tamano = 9,
        negrita = false,
        centrado = false,
        espacio = 2,
      } = opciones;

      configurarFuente(tamano, negrita);

      const lineas = doc.splitTextToSize(
        String(contenido ?? ""),
        anchoContenido
      );

      const altoLinea = tamano * 0.42;

      if (doc) {
        doc.text(
          lineas,
          centrado ? ancho / 2 : margen,
          y,
          { align: centrado ? "center" : "left" }
        );
      }

      y += lineas.length * altoLinea + espacio;
    }

    function separador() {
      y += 2;
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.2);
      doc.line(margen, y, ancho - margen, y);
      y += 6;
    }

    function fila(etiqueta, valor, opciones = {}) {
      const { negrita = false, tamano = 9 } = opciones;

      configurarFuente(tamano, negrita);

      const valorTexto = String(valor ?? "");
      const anchoValor = doc.getTextWidth(valorTexto);
      const anchoEtiqueta = doc.getTextWidth(etiqueta);
      const espacioDisponible = anchoContenido - anchoValor - 3;

      if (anchoEtiqueta > espacioDisponible) {
        doc.text(etiqueta, margen, y);
        y += 4.5;
        doc.text(valorTexto, ancho - margen, y, {
          align: "right",
        });
      } else {
        doc.text(etiqueta, margen, y);
        doc.text(valorTexto, ancho - margen, y, {
          align: "right",
        });
      }

      y += negrita ? 7 : 6;
    }

    // ----------------------------------------
    // ENCABEZADO DEL RESTAURANTE
    // ----------------------------------------

    texto("RESTAURANTE ORIGENES", {
      tamano: 14,
      negrita: true,
      centrado: true,
      espacio: 4,
    });

    texto(`Correo Emisor: origenessv@gmail.com`, {
      tamano: 8,
      centrado: true,
      espacio: 2,
    });

    texto(`Nit: 0617-191172-002-7`, {
      tamano: 8,
      centrado: true,
      espacio: 2,
    });

    texto(`Sucursal: ${sucursal.nombre || "No disponible"}`, {
      tamano: 8,
      centrado: true,
      espacio: 2,
    });

    if (sucursal.direccion) {
      texto(sucursal.direccion, {
        tamano: 8,
        centrado: true,
        espacio: 2,
      });
    }

    if (nit) {
      texto(`NIT: ${nit}`, {
        tamano: 8,
        centrado: true,
        espacio: 1,
      });
    }

    if (nrc) {
      texto(`NRC: ${nrc}`, {
        tamano: 8,
        centrado: true,
        espacio: 1,
      });
    }

    separador();

    // ----------------------------------------
    // TIPO DE DOCUMENTO
    // ----------------------------------------

    texto("FACTURA CONSUMIDOR FINAL", {
      tamano: 11,
      negrita: true,
      centrado: true,
      espacio: 2,
    });
    // ----------------------------------------
    // INFORMACION DE LA VENTA
    // ----------------------------------------

    fila("Numero:", venta.numero ?? "Pendiente", {
      tamano: 8.5,
    });

    fila("Fecha:", fechaVenta(venta.creado_en), {
      tamano: 8,
    });

    fila("Empleado:", empleado, {
      tamano: 8.5,
    });

    fila("Sucursal:", sucursal.nombre || "No disponible", {
      tamano: 8,
    });

    fila("Pago:", venta.metodo_pago || "No disponible", {
      tamano: 8.5,
    });

    separador();

    // ----------------------------------------
    // DETALLE DE PRODUCTOS
    // ----------------------------------------

    configurarFuente(8.5, true);

    doc.text("PRODUCTO / CANTIDAD", margen, y);
    doc.text("TOTAL", ancho - margen, y, {
      align: "right",
    });

    y += 8;

    for (const item of detalles) {
      const nombre = item.platillos?.nombre || "Producto";
      const cantidad = Number(item.cantidad);
      const precio = Number(item.precio_unitario);

      texto(nombre, {
        tamano: 9,
        negrita: true,
        espacio: 1,
      });

      fila(
        `${cantidad} x ${moneda(precio)}`,
        moneda(cantidad * precio),
        { tamano: 8 }
      );

      y += 2;
    }

    separador();

    // ----------------------------------------
    // SUBTOTAL E IVA
    // ----------------------------------------

    fila("Subtotal:", moneda(venta.subtotal), {
      tamano: 9,
    });

    fila("IVA (13%):", moneda(venta.iva), {
      tamano: 9,
    });

    separador();

    // ----------------------------------------
    // TOTAL
    // ----------------------------------------

    fila("TOTAL:", moneda(venta.total), {
      tamano: 12,
      negrita: true,
    });

    separador();

    // ----------------------------------------
    // PIE DE FACTURA
    // ----------------------------------------

    texto("¡Gracias por su compra!", {
      tamano: 10,
      negrita: true,
      centrado: true,
      espacio: 5,
    });

    texto("RESTAURANTE ORIGENES", {
      tamano: 8,
      centrado: true,
      espacio: 3,
    });

    texto("Documento interno - No valido como DTE", {
      tamano: 7,
      centrado: true,
      espacio: 3,
    });

    return y;
  }

  // Calcular altura con un documento temporal suficientemente largo
  const documentoTemporal = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [ancho, 1000],
  });

  const alturaContenido = dibujar(documentoTemporal);
  const altoFinal = Math.max(100, alturaContenido + 8);

  // Crear el PDF definitivo con la altura correcta
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [ancho, altoFinal],
  });

  dibujar(doc);
  guardarPDF(doc, venta);
}

// ========================================
// COMPROBANTE DE CREDITO FISCAL
// Se conserva el diseño anterior
// ========================================


function generarCCF(venta) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const W = 210;
  const H = 297;
  const L = 10;
  const R = 200;
  const detalles = venta.detalle_venta || [];
  const sucursal = venta.sucursales || {};

  const empleado =
    venta.usuarios?.nombre ||
    venta.usuario?.nombre ||
    venta.empleado?.nombre ||
    "No disponible";

  const nitEmisor = sucursal.nit || venta.nit_emisor || "";
  const nrcEmisor = sucursal.nrc || venta.nrc_emisor || "";

  const fecha = fechaVenta(venta.creado_en);
  const pago = venta.metodo_pago || "No disponible";

  function fuente(size = 8, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(25, 25, 25);
  }

  function texto(valor, x, y, opciones = {}) {
    const {
      size = 8,
      bold = false,
      align = "left",
      maxWidth,
    } = opciones;

    fuente(size, bold);

    doc.text(String(valor ?? ""), x, y, {
      align,
      ...(maxWidth ? { maxWidth } : {}),
    });
  }

  function ajustar(valor, maxWidth, size = 8) {
    fuente(size);

    let resultado = String(valor ?? "");

    while (
      resultado.length > 1 &&
      doc.getTextWidth(resultado) > maxWidth
    ) {
      resultado = resultado.slice(0, -1);
    }

    if (resultado !== String(valor ?? "")) {
      resultado = resultado.slice(0, -3) + "...";
    }

    return resultado;
  }

  function linea(x1, y1, x2, y2, grosor = 0.25) {
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(grosor);
    doc.line(x1, y1, x2, y2);
  }

  function recuadro(x, y, w, h, grosor = 0.35) {
    doc.setDrawColor(35, 35, 35);
    doc.setLineWidth(grosor);
    doc.rect(x, y, w, h);
  }

  function campo(etiqueta, valor, x, y, ancho = 88) {
    texto(etiqueta, x, y, { size: 8, bold: true });

    const inicio = x + Math.max(22, etiqueta.length * 1.8 + 4);

    linea(inicio, y + 1.5, x + ancho, y + 1.5, 0.18);

    if (valor !== undefined && valor !== null && valor !== "") {
      texto(
        ajustar(valor, x + ancho - inicio - 2, 8),
        inicio + 1,
        y,
        { size: 8 }
      );
    }
  }

  // ----------------------------------------
  // ENCABEZADO
  // ----------------------------------------

  texto("RESTAURANTE ORIGENES", 56, 19, {
    size: 14,
    bold: true,
    align: "center",
  });

  texto(
    ajustar(sucursal.nombre || "Sucursal no disponible", 87, 9),
    56,
    26,
    { size: 9, align: "center" }
  );

  const direccion = doc.splitTextToSize(
    sucursal.direccion || "Direccion no disponible",
    86
  );

  fuente(8);
  doc.text(direccion.slice(0, 3), 56, 32, {
    align: "center",
  });

  if (nitEmisor) {
    texto(`NIT: ${nitEmisor}`, 56, 46, {
      size: 8,
      align: "center",
    });
  }

  if (nrcEmisor) {
    texto(`NRC: ${nrcEmisor}`, 56, 51, {
      size: 8,
      align: "center",
    });
  }

  // Recuadro superior derecho
  doc.setLineWidth(0.7);
  doc.roundedRect(119, 12, 81, 46, 5, 5);

  texto("COMPROBANTE DE", 159.5, 21, {
    size: 10,
    bold: true,
    align: "center",
  });

  texto("CREDITO FISCAL", 159.5, 27, {
    size: 10,
    bold: true,
    align: "center",
  });

  doc.setTextColor(165, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`No. ${venta.numero ?? "PENDIENTE"}`, 159.5, 38, {
    align: "center",
  });

  texto("DOCUMENTO INTERNO", 159.5, 47, {
    size: 8,
    bold: true,
    align: "center",
  });

  texto("No valido como DTE", 159.5, 52, {
    size: 7,
    align: "center",
  });

  // ----------------------------------------
  // DATOS DEL RECEPTOR
  // ----------------------------------------

  campo("Cliente:", venta.cliente_nombre, 10, 69, 92);
  campo("Fecha:", fecha, 109, 69, 91);

  campo("Direccion:", "", 10, 78, 92);
  campo("Registro No.:", venta.cliente_nrc, 109, 78, 91);

  campo("Departamento:", "", 10, 87, 92);
  campo("NIT:", venta.cliente_nit, 109, 87, 91);

  campo("Empleado:", empleado, 10, 96, 92);
  campo("Pago:", pago, 109, 96, 91);

  // ----------------------------------------
  // TABLA DE PRODUCTOS
  // ----------------------------------------

  // Limites exactos de columnas.
  // Cada precio se alinea DENTRO de su celda.
  const columnas = {
    inicio: 10,
    cantidad: 30,
    descripcion: 112,
    precio: 145,
    exentas: 172,
    final: 200,
  };

  const tablaY = 105;
  const encabezadoH = 14;
  const tablaFinal = 211;

  function encabezadoTabla(y) {
    doc.setFillColor(240, 240, 240);
    doc.rect(L, y, R - L, encabezadoH, "F");

    recuadro(L, y, R - L, encabezadoH);

    for (const x of [
      columnas.cantidad,
      columnas.descripcion,
      columnas.precio,
      columnas.exentas,
    ]) {
      linea(x, y, x, y + encabezadoH);
    }

    texto("CANT.", 20, y + 8, {
      size: 7,
      bold: true,
      align: "center",
    });

    texto("DESCRIPCION", 71, y + 8, {
      size: 8,
      bold: true,
      align: "center",
    });

    texto("PRECIO", 128.5, y + 6, {
      size: 7,
      bold: true,
      align: "center",
    });

    texto("UNITARIO", 128.5, y + 10, {
      size: 7,
      bold: true,
      align: "center",
    });

    texto("VENTAS", 158.5, y + 6, {
      size: 7,
      bold: true,
      align: "center",
    });

    texto("EXENTAS", 158.5, y + 10, {
      size: 7,
      bold: true,
      align: "center",
    });

    texto("VENTAS", 186, y + 6, {
      size: 7,
      bold: true,
      align: "center",
    });

    texto("AFECTAS", 186, y + 10, {
      size: 7,
      bold: true,
      align: "center",
    });
  }

  function cuerpoTabla(inicio, final) {
    recuadro(L, inicio, R - L, final - inicio);

    for (const x of [
      columnas.cantidad,
      columnas.descripcion,
      columnas.precio,
      columnas.exentas,
    ]) {
      linea(x, inicio, x, final);
    }
  }

  encabezadoTabla(tablaY);
  cuerpoTabla(tablaY + encabezadoH, tablaFinal);

  let y = tablaY + encabezadoH + 7;
  let paginaContinuacion = false;

  for (const item of detalles) {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);
    const nombre = item.platillos?.nombre || "Producto";

    fuente(8);

    const nombres = doc.splitTextToSize(nombre, 77);
    const altoFila = Math.max(8, nombres.length * 4.5 + 3);

    if (y + altoFila > tablaFinal - 4) {
      doc.addPage();
      paginaContinuacion = true;

      texto(
        `CCF No. ${venta.numero ?? ""} - CONTINUACION`,
        105,
        16,
        { size: 10, bold: true, align: "center" }
      );

      encabezadoTabla(25);
      cuerpoTabla(39, 211);
      y = 46;
    }

    texto(String(cantidad), 20, y, {
      size: 8,
      align: "center",
    });

    fuente(8);
    doc.text(nombres, 33, y);

    // Precio unitario: celda 112-145
    texto(moneda(precio), 142, y, {
      size: 8,
      align: "right",
    });

    // Ventas exentas: sin dato, porque el
    // backend no clasifica productos exentos.

    // Ventas afectas: celda 172-200
    texto(moneda(cantidad * precio), 197, y, {
      size: 8,
      align: "right",
    });

    y += altoFila;
  }

  // ----------------------------------------
  // PIE DEL COMPROBANTE
  // ----------------------------------------

  const pieY = 214;
  const pieH = 58;

  recuadro(L, pieY, R - L, pieH);

  // Secciones inferiores
  linea(107, pieY, 107, pieY + pieH);
  linea(L, pieY + 32, 107, pieY + 32);
  linea(107, pieY + 32, R, pieY + 32);

  // ENTREGADO POR
  texto("ENTREGADO POR", 58, pieY + 6, {
    size: 8,
    bold: true,
    align: "center",
  });

  texto(
    `Nombre: ${ajustar(empleado, 66, 8)}`,
    14,
    pieY + 13,
    { size: 8 }
  );

  texto("Firma: ______________________", 14, pieY + 23, {
    size: 8,
  });

  // OBSERVACIONES
  texto("OBSERVACIONES:", 14, pieY + 38, {
    size: 8,
    bold: true,
  });

  texto("CANCELADO:", 14, pieY + 52, {
    size: 8,
  });

  // RESUMEN FISCAL
  const resumen = [
    ["Sumas:", moneda(venta.subtotal)],
    ["IVA (13%):", moneda(venta.iva)],
    ["Sub-total:", moneda(venta.subtotal)],
    ["(-) IVA retenido:", moneda(0)],
    ["Ventas exentas:", moneda(0)],
    ["VENTA TOTAL:", moneda(venta.total)],
  ];

  resumen.forEach(([etiqueta, valor], i) => {
    const yy = pieY + 7 + i * 8;

    texto(etiqueta, 111, yy, {
      size: i === 5 ? 9 : 8,
      bold: i === 5,
    });

    texto(valor, 196, yy, {
      size: i === 5 ? 10 : 8,
      bold: i === 5,
      align: "right",
    });

    if (i === 4) {
      linea(110, yy + 2, 197, yy + 2);
    }
  });

  // ----------------------------------------
  // PIE LEGAL / INFORMATIVO
  // ----------------------------------------

  linea(L, 278, R, 278);

  texto(
    "RESTAURANTE ORIGENES",
    10,
    283,
    { size: 7, bold: true }
  );

  texto(
    "Comprobante generado por el sistema de ventas.",
    10,
    288,
    { size: 6.5 }
  );

  texto(
    "Documento interno - No valido como DTE autorizado.",
    200,
    288,
    { size: 6.5, align: "right" }
  );

  guardarPDF(doc, venta);
}

// ========================================
// FUNCION PRINCIPAL
// ========================================

export function generarComprobantePDF(venta) {
  if (!venta || !Array.isArray(venta.detalle_venta)) {
    throw new Error("La venta no contiene los datos necesarios.");
  }

  if (venta.tipo_doc === "CCF") {
    generarCCF(venta);
  } else if (venta.tipo_doc === "FACTURA") {
    generarFactura(venta);
  } else {
    throw new Error("Tipo de documento no reconocido.");
  }
}
