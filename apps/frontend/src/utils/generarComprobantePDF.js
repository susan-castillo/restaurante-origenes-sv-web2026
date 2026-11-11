
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

function encabezado(doc, venta, ancho) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("RESTAURANTE ORIGENES", ancho / 2, 16, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    venta.sucursales?.nombre || "Restaurante Origenes",
    ancho / 2,
    23,
    { align: "center" }
  );

  const direccion = venta.sucursales?.direccion || "";

  if (direccion) {
    doc.text(direccion, ancho / 2, 29, {
      align: "center",
      maxWidth: ancho - 20,
    });
  }
}

function generarFactura(venta) {
  const ancho = 80;
  const alto = Math.max(
    145,
    105 + (venta.detalle_venta?.length || 0) * 13
  );

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [ancho, alto],
  });

  encabezado(doc, venta, ancho);

  let y = 42;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`FACTURA #${venta.numero}`, 5, y);

  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Fecha: ${fechaVenta(venta.creado_en)}`, 5, y);

  y += 6;
  doc.text(`Pago: ${venta.metodo_pago}`, 5, y);

  y += 5;
  doc.line(5, y, 75, y);

  y += 8;

  for (const item of venta.detalle_venta || []) {
    const nombre = item.platillos?.nombre || "Producto";

    doc.setFont("helvetica", "bold");
    doc.text(nombre, 5, y, { maxWidth: 65 });

    y += 5;

    doc.setFont("helvetica", "normal");
    doc.text(
      `${item.cantidad} x ${moneda(item.precio_unitario)}`,
      5,
      y
    );

    doc.text(
      moneda(Number(item.cantidad) * Number(item.precio_unitario)),
      75,
      y,
      { align: "right" }
    );

    y += 9;
  }

  doc.line(5, y, 75, y);
  y += 7;

  doc.text("Subtotal:", 5, y);
  doc.text(moneda(venta.subtotal), 75, y, { align: "right" });

  y += 6;
  doc.text("IVA:", 5, y);
  doc.text(moneda(venta.iva), 75, y, { align: "right" });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", 5, y);
  doc.text(moneda(venta.total), 75, y, { align: "right" });

  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Gracias por su compra", ancho / 2, y, {
    align: "center",
  });

  y += 7;
  doc.setFontSize(6);
  doc.text("Documento interno - No valido como DTE", ancho / 2, y, {
    align: "center",
  });

  guardarPDF(doc, venta);
}

function generarCCF(venta) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const ancho = 210;
  const margen = 14;

  // Encabezado del restaurante
  doc.setDrawColor(130);
  doc.rect(margen, 12, 86, 48);
  doc.rect(104, 12, 92, 48);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RESTAURANTE ORIGENES", 18, 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(venta.sucursales?.nombre || "", 18, 30);

  const direccion = doc.splitTextToSize(
    venta.sucursales?.direccion || "",
    78
  );

  doc.text(direccion, 18, 37);

  // Datos del documento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("COMPROBANTE DE CREDITO FISCAL", 150, 21, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Numero: ${venta.numero}`, 108, 31);
  doc.text(`Fecha: ${fechaVenta(venta.creado_en)}`, 108, 38);
  doc.text(`Pago: ${venta.metodo_pago}`, 108, 45);

  // Datos del cliente
  doc.rect(margen, 64, 182, 43);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DATOS DEL CLIENTE", 18, 72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Cliente: ${venta.cliente_nombre || ""}`, 18, 81);
  doc.text(`NIT: ${venta.cliente_nit || ""}`, 18, 89);
  doc.text(`NRC: ${venta.cliente_nrc || ""}`, 18, 97);

  // Encabezados de tabla
  let y = 115;

  doc.setFillColor(235, 235, 235);
  doc.rect(margen, y, 182, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text("Cant.", 18, y + 7);
  doc.text("Codigo", 35, y + 7);
  doc.text("Descripcion", 65, y + 7);
  doc.text("Precio", 150, y + 7, { align: "right" });
  doc.text("Total", 191, y + 7, { align: "right" });

  y += 17;

  doc.setFont("helvetica", "normal");

  for (const item of venta.detalle_venta || []) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.text(String(item.cantidad), 18, y);
    doc.text(String(item.platillo_id), 35, y);

    doc.text(
      item.platillos?.nombre || "Producto",
      65,
      y,
      { maxWidth: 65 }
    );

    doc.text(moneda(item.precio_unitario), 150, y, {
      align: "right",
    });

    doc.text(
      moneda(Number(item.cantidad) * Number(item.precio_unitario)),
      191,
      y,
      { align: "right" }
    );

    y += 10;
  }

  y = Math.max(y + 12, 220);

  if (y > 260) {
    doc.addPage();
    y = 30;
  }

  doc.line(margen, y, 196, y);
  y += 9;

  doc.setFontSize(9);
  doc.text("Subtotal:", 140, y);
  doc.text(moneda(venta.subtotal), 191, y, {
    align: "right",
  });

  y += 8;
  doc.text("IVA (13%):", 140, y);
  doc.text(moneda(venta.iva), 191, y, {
    align: "right",
  });

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", 140, y);
  doc.text(moneda(venta.total), 191, y, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Documento interno - No valido como DTE autorizado",
    ancho / 2,
    285,
    { align: "center" }
  );

  guardarPDF(doc, venta);
}

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
