// Importamos la clase jsPDF de la librería instalada en package.json para construir documentos PDF en el navegador
import { jsPDF } from "jspdf";

// Función auxiliar para formatear cualquier valor numérico como moneda en dólares con 2 decimales (ej. "$425.00")
const moneda = (valor) => `$${Number(valor ?? 0).toFixed(2)}`;

// Obtiene la fecha y hora actual formateada según la zona horaria oficial de El Salvador
function fechaActualSV() {
    return new Date().toLocaleString("es-SV", {
        timeZone: "America/El_Salvador",
        dateStyle: "medium",
        timeStyle: "short",
    });
}

// ==========================================================
// 1. REPORTE CONSOLIDADO DE PLANILLA QUINCENAL (A4 HORIZONTAL)
// ==========================================================
export function generarReportePlanillaPDF({
                                              filas = [],                               // Arreglo de empleados con sus montos calculados
                                              sucursalNombre = "Sucursal asignada",     // Nombre de la sucursal activa
                                              mesNombre = "",                           // Nombre del mes procesado (ej. "Noviembre")
                                              anio = "",                                // Año procesado (ej. 2026)
                                              quincena = 1,                             // 1 = Primera quincena, 2 = Segunda quincena
                                              estado = "GENERADA",                      // Indica si es "GENERADA" o "VISTA PREVIA"
                                              generadoPor = "Administrador",            // Nombre del usuario autenticado que emite el reporte
                                          }) {
    // Validación de seguridad para evitar generar un PDF vacío si no hay registros
    if (!Array.isArray(filas) || filas.length === 0) {
        throw new Error("No hay datos de planilla para exportar.");
    }

    // Instanciamos el documento PDF en formato A4 horizontal (landscape) y unidad de medida en milímetros
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    // Dimensiones estándar de una hoja A4 horizontal en milímetros y márgenes laterales
    const W = 297;      // Ancho total de página (mm)
    const H = 210;      // Alto total de página (mm)
    const L = 14;       // Margen izquierdo (mm)
    const R = W - 14;   // Margen derecho (283 mm)

    // Helper interno para configurar tipografía (Helvetica), estilo (normal/negrita), tamaño y color RGB
    function fuente(size = 9, bold = false, color = [38, 28, 20]) {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
    }

    // Helper interno para dibujar texto en coordenadas (x, y) con alineación configurable
    function texto(valor, x, y, opciones = {}) {
        const { size = 9, bold = false, align = "left", color = [38, 28, 20] } = opciones;
        fuente(size, bold, color);
        doc.text(String(valor ?? ""), x, y, { align });
    }

    // Helper interno para trazar líneas separadoras horizontales o de firma
    function linea(x1, y1, x2, y2, grosor = 0.25, color = [180, 170, 160]) {
        doc.setDrawColor(...color);
        doc.setLineWidth(grosor);
        doc.line(x1, y1, x2, y2);
    }

    // Coordenadas horizontales (eje X) de cada columna dentro del ancho útil (269 mm)
    const cols = {
        num: L,             // Columna correlativo (#)
        empleado: L + 10,   // Columna nombre completo del trabajador
        cargo: L + 82,      // Columna puesto operativo
        bruto: L + 135,     // Columna salario base quincenal (alineado a la derecha)
        isss: L + 168,      // Columna retención ISSS 3%
        afp: L + 201,       // Columna retención AFP 7.25%
        renta: L + 234,     // Columna retención Impuesto sobre la Renta MH
        neto: R - 3,        // Columna salario líquido a pagar
    };

    // Dibuja el membrete superior del documento (se reutiliza si la planilla abarca varias páginas)
    function dibujarEncabezadoPagina(numPagina) {
        // Rectángulo de fondo color crema (#FAF6F3) con borde suave
        doc.setFillColor(250, 246, 243);
        doc.rect(L, 12, R - L, 26, "F");
        doc.setDrawColor(210, 195, 180);
        doc.setLineWidth(0.3);
        doc.rect(L, 12, R - L, 26);

        // Textos principales de la empresa, sucursal y período fiscal
        texto("RESTAURANTE ORÍGENES SV", L + 5, 20, { size: 14, bold: true });
        texto("PLANILLA DE SALARIOS QUINCENAL — REPÚBLICA DE EL SALVADOR", L + 5, 26, {
            size: 9,
            bold: true,
            color: [120, 85, 58],
        });
        texto(
            `Sucursal: ${sucursalNombre}   |   Período: ${
                quincena === 1 ? "1.ª Quincena" : "2.ª Quincena"
            } de ${mesNombre} ${anio}`,
            L + 5,
            33,
            { size: 8.5 }
        );

        // Bloque derecho con estado de emisión (verde si está guardada, ámbar si es simulación) y paginación
        texto(`Estado: ${estado}`, R - 5, 20, {
            size: 9,
            bold: true,
            align: "right",
            color: estado === "GENERADA" ? [25, 135, 84] : [180, 110, 20],
        });
        texto(`Emitido: ${fechaActualSV()}`, R - 5, 26, { size: 8, align: "right" });
        texto(`Página ${numPagina}`, R - 5, 33, { size: 8, align: "right" });
    }

    // Dibuja la barra oscura de encabezados de columnas de la tabla
    function dibujarCabeceraTabla(y) {
        doc.setFillColor(38, 28, 20);
        doc.rect(L, y, R - L, 9, "F");

        const colorBlanco = [255, 255, 255];
        texto("#", cols.num + 2, y + 6, { size: 8, bold: true, color: colorBlanco });
        texto("EMPLEADO", cols.empleado, y + 6, { size: 8, bold: true, color: colorBlanco });
        texto("CARGO", cols.cargo, y + 6, { size: 8, bold: true, color: colorBlanco });
        texto("SALARIO BRUTO", cols.bruto, y + 6, { size: 8, bold: true, align: "right", color: colorBlanco });
        texto("ISSS (3%)", cols.isss, y + 6, { size: 8, bold: true, align: "right", color: colorBlanco });
        texto("AFP (7.25%)", cols.afp, y + 6, { size: 8, bold: true, align: "right", color: colorBlanco });
        texto("RENTA (MH)", cols.renta, y + 6, { size: 8, bold: true, align: "right", color: colorBlanco });
        texto("LÍQUIDO A PAGAR", cols.neto, y + 6, { size: 8, bold: true, align: "right", color: colorBlanco });
    }

    // Inicializamos la página 1 y posicionamos el cursor vertical 'y' en 59 mm para la primera fila
    let pagina = 1;
    dibujarEncabezadoPagina(pagina);
    dibujarCabeceraTabla(44);

    let y = 59;

    // Acumuladores para calcular la fila de totales al final del reporte
    let totalBruto = 0;
    let totalIsss = 0;
    let totalAfp = 0;
    let totalRenta = 0;
    let totalNeto = 0;

    // Iteramos sobre cada empleado de la planilla
    filas.forEach((item, index) => {
        // Control de salto de página automático si nos acercamos al margen inferior (H - 38)
        if (y > H - 38) {
            doc.addPage();
            pagina += 1;
            dibujarEncabezadoPagina(pagina);
            dibujarCabeceraTabla(44);
            y = 59;
        }

        // Normalizamos propiedades (soporta tanto respuesta directa de simulación como relación Prisma 'usuarios')
        const nombre = item.nombre ?? item.usuarios?.nombre ?? "Empleado";
        const cargo = item.cargo ?? item.usuarios?.cargo ?? "";
        const bruto = Number(item.salario_bruto ?? item.salarioBruto ?? 0);
        const isss = Number(item.isss ?? 0);
        const afp = Number(item.afp ?? 0);
        const renta = Number(item.renta ?? 0);
        const neto = Number(item.salario_neto ?? item.salarioNeto ?? 0);

        // Sumamos cada rubro a los totales consolidados
        totalBruto += bruto;
        totalIsss += isss;
        totalAfp += afp;
        totalRenta += renta;
        totalNeto += neto;

        // Efecto cebra (fila alterna sombreada) para facilitar la lectura horizontal
        if (index % 2 === 1) {
            doc.setFillColor(252, 250, 248);
            doc.rect(L, y - 5, R - L, 8, "F");
        }

        // Imprimimos los datos del empleado en sus respectivas columnas
        texto(String(index + 1), cols.num + 2, y, { size: 8.5 });
        texto(nombre, cols.empleado, y, { size: 8.5, bold: true });
        texto(cargo, cols.cargo, y, { size: 8, color: [100, 100, 100] });
        texto(moneda(bruto), cols.bruto, y, { size: 8.5, align: "right" });
        texto(`-${moneda(isss)}`, cols.isss, y, { size: 8.5, align: "right", color: [185, 45, 45] });
        texto(`-${moneda(afp)}`, cols.afp, y, { size: 8.5, align: "right", color: [185, 45, 45] });
        texto(`-${moneda(renta)}`, cols.renta, y, { size: 8.5, align: "right", color: [185, 45, 45] });
        texto(moneda(neto), cols.neto, y, { size: 9, bold: true, align: "right", color: [25, 135, 84] });

        // Línea divisoria sutil entre filas y avance vertical de 8.5 mm
        linea(L, y + 2.5, R, y + 2.5, 0.15, [230, 225, 220]);
        y += 8.5;
    });

    // Verificamos si queda espacio suficiente para la fila de totales; si no, abrimos nueva página
    if (y > H - 42) {
        doc.addPage();
        pagina += 1;
        dibujarEncabezadoPagina(pagina);
        y = 48;
    }

    // Recuadro destacado para la fila de totales consolidados de la sucursal
    doc.setFillColor(245, 238, 232);
    doc.rect(L, y - 4.5, R - L, 10, "F");
    doc.setDrawColor(38, 28, 20);
    doc.setLineWidth(0.35);
    doc.rect(L, y - 4.5, R - L, 10);

    texto(`TOTAL PLANILLA (${filas.length} empleados)`, cols.empleado, y + 2, { size: 9, bold: true });
    texto(moneda(totalBruto), cols.bruto, y + 2, { size: 9, bold: true, align: "right" });
    texto(`-${moneda(totalIsss)}`, cols.isss, y + 2, { size: 9, bold: true, align: "right", color: [185, 45, 45] });
    texto(`-${moneda(totalAfp)}`, cols.afp, y + 2, { size: 9, bold: true, align: "right", color: [185, 45, 45] });
    texto(`-${moneda(totalRenta)}`, cols.renta, y + 2, { size: 9, bold: true, align: "right", color: [185, 45, 45] });
    texto(moneda(totalNeto), cols.neto, y + 2, { size: 10, bold: true, align: "right", color: [25, 135, 84] });

    // Líneas de firma de auditoría interna al pie de la página
    const firmaY = H - 20;
    linea(L + 15, firmaY, L + 95, firmaY, 0.3, [60, 60, 60]);
    texto(`Elaborado por: ${generadoPor}`, L + 55, firmaY + 4.5, { size: 8, align: "center" });

    linea(R - 95, firmaY, R - 15, firmaY, 0.3, [60, 60, 60]);
    texto("Autorizado por: Gerencia / Administración", R - 55, firmaY + 4.5, { size: 8, align: "center" });

    // Nota legal al pie sobre los porcentajes y topes aplicados en El Salvador
    texto(
        "Cálculo conforme a retenciones legales vigentes en El Salvador: ISSS (3%, tope $1,000/mes), AFP (7.25%) y Tabla Quincenal de Renta MH.",
        L,
        H - 7,
        { size: 7, color: [120, 120, 120] }
    );

    // Preparamos el nombre del archivo y generamos una Blob URL para el previsualizador (iframe)
    const sucursalSlug = sucursalNombre.replace(/\s+/g, "_");
    const nombreArchivo = `Planilla_${sucursalSlug}_${mesNombre}_${anio}_Q${quincena}.pdf`;
    const blobUrl = String(doc.output("bloburl"));

    // Retornamos metadatos, URL temporal de previsualización y función directa de descarga
    return {
        titulo: `Reporte de Planilla — ${mesNombre} ${anio} (Q${quincena})`,
        nombreArchivo,
        blobUrl,
        descargar: () => doc.save(nombreArchivo),
    };
}

// ==========================================================
// 2. BOLETA DE PAGO INDIVIDUAL POR EMPLEADO (A4 VERTICAL)
// ==========================================================
export function generarBoletaEmpleadoPDF({
                                             empleado,
                                             sucursalNombre = "Sucursal asignada",
                                             mesNombre = "",
                                             anio = "",
                                             quincena = 1,
                                         }) {
    // Instanciamos documento vertical (portrait) en tamaño A4
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    // Márgenes izquierdo (20 mm) y derecho (190 mm) sobre ancho A4 vertical (210 mm)
    const L = 20;
    const R = 190;

    // Extraemos y convertimos los montos del trabajador seleccionado
    const nombre = empleado.nombre ?? empleado.usuarios?.nombre ?? "Empleado";
    const cargo = empleado.cargo ?? empleado.usuarios?.cargo ?? "";
    const bruto = Number(empleado.salario_bruto ?? empleado.salarioBruto ?? 0);
    const isss = Number(empleado.isss ?? 0);
    const afp = Number(empleado.afp ?? 0);
    const renta = Number(empleado.renta ?? 0);
    const neto = Number(empleado.salario_neto ?? empleado.salarioNeto ?? 0);
    const totalDeducciones = isss + afp + renta;

    // Marco exterior de la boleta y banda superior decorativa
    doc.setDrawColor(180, 170, 160);
    doc.setLineWidth(0.4);
    doc.rect(L, 20, R - L, 135);

    doc.setFillColor(250, 246, 243);
    doc.rect(L, 20, R - L, 24, "F");

    // Encabezado centrado del comprobante individual
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(38, 28, 20);
    doc.text("RESTAURANTE ORÍGENES SV", 105, 30, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(120, 85, 58);
    doc.text("COMPROBANTE INDIVIDUAL DE PAGO DE PLANILLA", 105, 37, { align: "center" });

    // Datos generales del empleado (izquierda) y del período (derecha)
    doc.setFontSize(9);
    doc.setTextColor(38, 28, 20);
    doc.text(`Empleado: ${nombre}`, L + 8, 54);
    doc.text(`Cargo: ${cargo}`, L + 8, 61);
    doc.text(`Sucursal: ${sucursalNombre}`, L + 8, 68);

    doc.text(
        `Período: ${quincena === 1 ? "1.ª Quincena" : "2.ª Quincena"} ${mesNombre} ${anio}`,
        R - 8,
        54,
        { align: "right" }
    );
    doc.text(`Fecha emisión: ${fechaActualSV()}`, R - 8, 61, { align: "right" });

    // Línea separadora antes del desglose salarial
    doc.line(L + 6, 74, R - 6, 74);

    // Arreglo de conceptos salariales y retenciones de ley con bandera de color rojo para descuentos
    const filasDetalle = [
        ["Salario base quincenal devengado", moneda(bruto), false],
        ["(-) Retención ISSS (3.00%)", `-${moneda(isss)}`, true],
        ["(-) Retención AFP (7.25%)", `-${moneda(afp)}`, true],
        ["(-) Retención Impuesto sobre la Renta (MH)", `-${moneda(renta)}`, true],
        ["Total deducciones de ley", `-${moneda(totalDeducciones)}`, true],
    ];

    // Iteramos y dibujamos cada línea del desglose financiero
    let y = 84;
    filasDetalle.forEach(([concepto, monto, esDescuento]) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(38, 28, 20);
        doc.text(concepto, L + 8, y);

        doc.setTextColor(esDescuento ? 185 : 38, esDescuento ? 45 : 28, esDescuento ? 45 : 20);
        doc.text(monto, R - 8, y, { align: "right" });
        y += 8;
    });

    // Línea divisoria antes del total líquido
    doc.line(L + 6, y - 2, R - 6, y - 2);

    // Total líquido a recibir resaltado en verde
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(25, 135, 84);
    doc.text("SALARIO LÍQUIDO A RECIBIR:", L + 8, y + 6);
    doc.text(moneda(neto), R - 8, y + 6, { align: "right" });

    // Espacio para firma de recibido conforme del empleado
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.line(65, 142, 145, 142);
    doc.text("Firma de recibido conforme", 105, 147, { align: "center" });

    // Generamos nombre de archivo limpio y Blob URL para previsualizar o descargar
    const nombreSlug = nombre.replace(/\s+/g, "_");
    const nombreArchivo = `Boleta_${nombreSlug}_${mesNombre}_${anio}_Q${quincena}.pdf`;
    const blobUrl = String(doc.output("bloburl"));

    return {
        titulo: `Boleta de Pago — ${nombre}`,
        nombreArchivo,
        blobUrl,
        descargar: () => doc.save(nombreArchivo),
    };
}