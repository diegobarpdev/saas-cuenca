// Generador de RIDE (Representación Impresa de Documento Electrónico)
// Formato PDF según especificaciones SRI Ecuador

import PDFDocument from 'pdfkit';

export interface RideData {
  // Emisor
  rucEmisor: string;
  razonSocialEmisor: string;
  nombreComercial?: string;
  direccionMatriz: string;
  codigoEstablecimiento: string;
  codigoPuntoEmision: string;
  // Comprobante
  numeroFactura: string; // 001-001-000000001
  claveAcceso: string;
  fechaEmision: string; // DD/MM/YYYY
  ambiente: 'pruebas' | 'produccion';
  // Autorización
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  // Receptor
  tipoDocReceptor: string;
  numDocReceptor: string;
  razonSocialReceptor: string;
  emailReceptor?: string;
  direccionReceptor?: string;
  // Items
  items: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    precioTotalSinImpuesto: number;
    iva: number;
  }[];
  // Totales
  subtotalSinImpuestos: number;
  iva: number;
  total: number;
  metodoPago: string;
}

const CORAL = '#FE6A46';
const DARK = '#1A1A2E';
const GRAY = '#6B7280';
const LIGHT_GRAY = '#F3F4F6';

function formatMoney(n: number): string {
  return n.toFixed(2);
}

export function generarRidePdf(data: RideData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Factura ${data.numeroFactura}`,
        Author: data.razonSocialEmisor,
        Subject: 'Factura Electrónica SRI Ecuador',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const margin = 40;
    const contentW = pageW - margin * 2;

    // ─── HEADER ──────────────────────────────────────────────────────────────
    // Barra de color coral arriba
    doc.rect(0, 0, pageW, 6).fill(CORAL);

    let y = 20;

    // Columna izquierda: datos emisor
    doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK)
      .text(data.razonSocialEmisor, margin, y, { width: contentW * 0.55 });

    y = doc.y;
    if (data.nombreComercial && data.nombreComercial !== data.razonSocialEmisor) {
      doc.fontSize(9).font('Helvetica').fillColor(GRAY)
        .text(data.nombreComercial, margin, y, { width: contentW * 0.55 });
      y = doc.y;
    }

    doc.fontSize(8).fillColor(GRAY)
      .text(`RUC: ${data.rucEmisor}`, margin, y + 2)
      .text(data.direccionMatriz, margin, doc.y + 1, { width: contentW * 0.55 });

    // Columna derecha: número de factura
    const rightX = margin + contentW * 0.58;
    const rightW = contentW * 0.42;
    const boxTop = 20;

    doc.rect(rightX, boxTop, rightW, 80).lineWidth(1).strokeColor(CORAL).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY)
      .text('R.U.C.', rightX + 8, boxTop + 8)
      .text('FACTURA', rightX + 8, boxTop + 22);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
      .text(data.rucEmisor, rightX + 60, boxTop + 8)
      .text(data.numeroFactura, rightX + 60, boxTop + 22);

    doc.fontSize(7).font('Helvetica').fillColor(GRAY)
      .text('NÚMERO DE AUTORIZACIÓN', rightX + 8, boxTop + 38);
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor(DARK)
      .text(data.numeroAutorizacion ?? data.claveAcceso, rightX + 8, boxTop + 48, {
        width: rightW - 16, lineBreak: true,
      });

    const ambienteColor = data.ambiente === 'produccion' ? '#10B981' : '#F59E0B';
    doc.roundedRect(rightX + 8, boxTop + 64, 60, 10, 3)
      .fill(ambienteColor);
    doc.fontSize(6).font('Helvetica-Bold').fillColor('white')
      .text(data.ambiente === 'produccion' ? 'PRODUCCIÓN' : 'PRUEBAS', rightX + 10, boxTop + 66);

    // ─── LÍNEA DIVISORIA ─────────────────────────────────────────────────────
    y = 115;
    doc.moveTo(margin, y).lineTo(pageW - margin, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
    y += 10;

    // ─── DATOS AUTORIZACIÓN ──────────────────────────────────────────────────
    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
      .text('FECHA Y HORA DE AUTORIZACIÓN:', margin, y)
      .text('AMBIENTE:', margin + 260, y);
    doc.fontSize(7).font('Helvetica').fillColor(DARK)
      .text(data.fechaAutorizacion ?? 'EN PROCESO', margin + 170, y)
      .text(data.ambiente.toUpperCase(), margin + 310, y);

    y = doc.y + 4;
    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY).text('CLAVE DE ACCESO:', margin, y);
    doc.fontSize(6.5).font('Helvetica').fillColor(DARK)
      .text(data.claveAcceso, margin + 90, y, { width: contentW - 90 });

    // ─── DATOS RECEPTOR ──────────────────────────────────────────────────────
    y = doc.y + 12;
    doc.rect(margin, y, contentW, 12).fill(CORAL);
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('white')
      .text('DATOS DEL COMPRADOR', margin + 4, y + 3);

    y += 14;
    const col1 = margin;
    const col2 = margin + contentW * 0.5;

    doc.rect(margin, y, contentW, 46).lineWidth(0.5).strokeColor('#D1D5DB').stroke();

    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
      .text('RAZÓN SOCIAL / NOMBRES:', col1 + 4, y + 5)
      .text(data.tipoDocReceptor + ':', col2 + 4, y + 5);

    doc.fontSize(7).font('Helvetica').fillColor(DARK)
      .text(data.razonSocialReceptor, col1 + 4, y + 16, { width: contentW * 0.48 })
      .text(data.numDocReceptor, col2 + 4, y + 16);

    if (data.emailReceptor) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
        .text('EMAIL:', col1 + 4, y + 30);
      doc.fontSize(7).font('Helvetica').fillColor(DARK)
        .text(data.emailReceptor, col1 + 35, y + 30);
    }
    if (data.direccionReceptor) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
        .text('DIRECCIÓN:', col2 + 4, y + 30);
      doc.fontSize(7).font('Helvetica').fillColor(DARK)
        .text(data.direccionReceptor, col2 + 50, y + 30, { width: contentW * 0.48 });
    }

    // ─── TABLA DE DETALLES ───────────────────────────────────────────────────
    y = doc.y + 12;
    const cols = {
      desc: { x: margin, w: contentW * 0.42 },
      cant: { x: margin + contentW * 0.42, w: contentW * 0.1 },
      pu:   { x: margin + contentW * 0.52, w: contentW * 0.14 },
      desc2:{ x: margin + contentW * 0.66, w: contentW * 0.1 },
      subtot:{ x: margin + contentW * 0.76, w: contentW * 0.12 },
      iva:  { x: margin + contentW * 0.88, w: contentW * 0.12 },
    };

    // Header tabla
    doc.rect(margin, y, contentW, 14).fill(DARK);
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('white');
    const rowY = y + 4;
    doc.text('DESCRIPCIÓN',       cols.desc.x + 3, rowY);
    doc.text('CANT.',             cols.cant.x + 2, rowY);
    doc.text('P. UNITARIO',       cols.pu.x + 2, rowY);
    doc.text('DESC.',             cols.desc2.x + 2, rowY);
    doc.text('SUBTOTAL',          cols.subtot.x + 2, rowY);
    doc.text('IVA',               cols.iva.x + 2, rowY);

    y += 14;

    // Filas
    let rowAlt = false;
    for (const item of data.items) {
      const rowH = 14;
      if (rowAlt) doc.rect(margin, y, contentW, rowH).fill(LIGHT_GRAY);
      rowAlt = !rowAlt;

      doc.fontSize(7).font('Helvetica').fillColor(DARK);
      doc.text(item.descripcion,                    cols.desc.x + 3, y + 3, { width: cols.desc.w - 6, ellipsis: true });
      doc.text(item.cantidad.toFixed(2),            cols.cant.x + 2, y + 3, { width: cols.cant.w - 4, align: 'right' });
      doc.text('$' + formatMoney(item.precioUnitario), cols.pu.x + 2, y + 3, { width: cols.pu.w - 4, align: 'right' });
      doc.text('$' + formatMoney(item.descuento),   cols.desc2.x + 2, y + 3, { width: cols.desc2.w - 4, align: 'right' });
      doc.text('$' + formatMoney(item.precioTotalSinImpuesto), cols.subtot.x + 2, y + 3, { width: cols.subtot.w - 4, align: 'right' });
      doc.text('$' + formatMoney(item.iva),         cols.iva.x + 2, y + 3, { width: cols.iva.w - 4, align: 'right' });

      doc.moveTo(margin, y + rowH).lineTo(pageW - margin, y + rowH).lineWidth(0.3).strokeColor('#E5E7EB').stroke();
      y += rowH;
    }

    // ─── TOTALES ─────────────────────────────────────────────────────────────
    y += 10;
    const totW = 200;
    const totX = pageW - margin - totW;

    const totRows = [
      { label: 'SUBTOTAL SIN IMPUESTOS:', value: '$' + formatMoney(data.subtotalSinImpuestos) },
      { label: 'DESCUENTO:', value: '$0.00' },
      { label: 'IVA 15%:', value: '$' + formatMoney(data.iva) },
      { label: 'PROPINA:', value: '$0.00' },
    ];

    for (const row of totRows) {
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GRAY)
        .text(row.label, totX, y, { width: 130, align: 'right' });
      doc.fontSize(7.5).font('Helvetica').fillColor(DARK)
        .text(row.value, totX + 135, y, { width: 65, align: 'right' });
      y += 13;
    }

    // Total en recuadro coral
    doc.rect(totX - 4, y, totW + 4, 18).fill(CORAL);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('white')
      .text('VALOR TOTAL:', totX, y + 4, { width: 130, align: 'right' });
    doc.text('$' + formatMoney(data.total), totX + 135, y + 4, { width: 65, align: 'right' });

    y += 28;

    // Forma de pago
    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY).text('FORMA DE PAGO:', margin, y);
    doc.font('Helvetica').fillColor(DARK).text(data.metodoPago.toUpperCase(), margin + 90, y);

    // ─── FECHA EMISIÓN ───────────────────────────────────────────────────────
    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
      .text(`FECHA DE EMISIÓN: ${data.fechaEmision}`, margin, y + 14);

    // ─── FOOTER ──────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 50;
    doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY)
      .lineWidth(0.5).strokeColor('#E5E7EB').stroke();

    doc.fontSize(6.5).font('Helvetica').fillColor(GRAY)
      .text(
        'Documento generado electrónicamente. Autorizado por el SRI. Verifique en: https://srienlinea.sri.gob.ec',
        margin, footerY + 6, { width: contentW, align: 'center' },
      );

    // Línea coral al pie
    doc.rect(0, doc.page.height - 6, pageW, 6).fill(CORAL);

    doc.end();
  });
}
