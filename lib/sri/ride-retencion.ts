// Generador de RIDE para Comprobante de Retención Electrónico
// Formato PDF según especificaciones SRI Ecuador

import PDFDocument from 'pdfkit';

export interface RideRetencionData {
  // Emisor
  rucEmisor: string;
  razonSocialEmisor: string;
  nombreComercial?: string;
  direccionMatriz: string;
  // Comprobante
  numeroRetencion: string; // 001-001-000000001
  claveAcceso: string;
  fechaEmision: string; // DD/MM/YYYY
  ambiente: 'pruebas' | 'produccion';
  // Autorización
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  // Fiscal
  periodoFiscal: string; // MM/YYYY
  // Sujeto retenido
  sujetoRetenido: {
    tipoDoc: string;
    numDoc: string;
    razonSocial: string;
  };
  // Documento sustento
  numDocSustento: string;
  fechaDocSustento: string; // DD/MM/YYYY
  // Retenciones
  retenciones: {
    tipo: string;
    codigoRetencion: string;
    descripcion?: string;
    baseImponible: number;
    tarifa: number;
    valorRetenido: number;
  }[];
  totalRetenido: number;
}

const CORAL = '#FE6A46';
const DARK = '#1A1A2E';
const GRAY = '#6B7280';
const LIGHT_GRAY = '#F3F4F6';

function formatMoney(n: number): string {
  return n.toFixed(2);
}

export function generarRideRetencionPdf(data: RideRetencionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Comprobante de Retención ${data.numeroRetencion}`,
        Author: data.razonSocialEmisor,
        Subject: 'Comprobante de Retención Electrónico SRI Ecuador',
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

    // Columna derecha: tipo de documento
    const rightX = margin + contentW * 0.58;
    const rightW = contentW * 0.42;
    const boxTop = 20;

    doc.rect(rightX, boxTop, rightW, 90).lineWidth(1).strokeColor(CORAL).stroke();

    doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY)
      .text('R.U.C.', rightX + 8, boxTop + 8)
      .text('COMPROBANTE DE RETENCIÓN', rightX + 8, boxTop + 22);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
      .text(data.rucEmisor, rightX + 60, boxTop + 8)
      .text(data.numeroRetencion, rightX + 8, boxTop + 34);

    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
      .text('PERÍODO FISCAL:', rightX + 8, boxTop + 46);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(DARK)
      .text(data.periodoFiscal, rightX + 80, boxTop + 46);

    doc.fontSize(7).font('Helvetica').fillColor(GRAY)
      .text('NÚMERO DE AUTORIZACIÓN', rightX + 8, boxTop + 58);
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor(DARK)
      .text(data.numeroAutorizacion ?? data.claveAcceso, rightX + 8, boxTop + 68, {
        width: rightW - 16, lineBreak: true,
      });

    const ambienteColor = data.ambiente === 'produccion' ? '#10B981' : '#F59E0B';
    doc.roundedRect(rightX + 8, boxTop + 76, 60, 10, 3).fill(ambienteColor);
    doc.fontSize(6).font('Helvetica-Bold').fillColor('white')
      .text(data.ambiente === 'produccion' ? 'PRODUCCIÓN' : 'PRUEBAS', rightX + 10, boxTop + 78);

    // ─── LÍNEA DIVISORIA ─────────────────────────────────────────────────────
    y = 125;
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

    // ─── DATOS SUJETO RETENIDO ───────────────────────────────────────────────
    y = doc.y + 12;
    doc.rect(margin, y, contentW, 12).fill(CORAL);
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('white')
      .text('DATOS DEL SUJETO RETENIDO', margin + 4, y + 3);

    y += 14;
    const col1 = margin;
    const col2 = margin + contentW * 0.5;

    doc.rect(margin, y, contentW, 36).lineWidth(0.5).strokeColor('#D1D5DB').stroke();

    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
      .text('RAZÓN SOCIAL / NOMBRES:', col1 + 4, y + 5)
      .text(data.sujetoRetenido.tipoDoc + ':', col2 + 4, y + 5);

    doc.fontSize(7).font('Helvetica').fillColor(DARK)
      .text(data.sujetoRetenido.razonSocial, col1 + 4, y + 16, { width: contentW * 0.48 })
      .text(data.sujetoRetenido.numDoc, col2 + 4, y + 16);

    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
      .text('DOC. SUSTENTO:', col1 + 4, y + 26)
      .text('FECHA DOC. SUSTENTO:', col2 + 4, y + 26);
    doc.fontSize(7).font('Helvetica').fillColor(DARK)
      .text(data.numDocSustento, col1 + 80, y + 26)
      .text(data.fechaDocSustento, col2 + 110, y + 26);

    // ─── TABLA DE RETENCIONES ────────────────────────────────────────────────
    y = doc.y + 12;

    const retCols = {
      tipo:    { x: margin, w: contentW * 0.1 },
      codigo:  { x: margin + contentW * 0.1, w: contentW * 0.12 },
      desc:    { x: margin + contentW * 0.22, w: contentW * 0.38 },
      base:    { x: margin + contentW * 0.60, w: contentW * 0.14 },
      tarifa:  { x: margin + contentW * 0.74, w: contentW * 0.1 },
      retenido:{ x: margin + contentW * 0.84, w: contentW * 0.16 },
    };

    doc.rect(margin, y, contentW, 14).fill(DARK);
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('white');
    const rowY = y + 4;
    doc.text('TIPO',       retCols.tipo.x + 2, rowY);
    doc.text('CÓDIGO',     retCols.codigo.x + 2, rowY);
    doc.text('DESCRIPCIÓN', retCols.desc.x + 2, rowY);
    doc.text('BASE IMP.',  retCols.base.x + 2, rowY);
    doc.text('%',          retCols.tarifa.x + 2, rowY);
    doc.text('RETENIDO',   retCols.retenido.x + 2, rowY);

    y += 14;

    let rowAlt = false;
    for (const ret of data.retenciones) {
      const rowH = 14;
      if (rowAlt) doc.rect(margin, y, contentW, rowH).fill(LIGHT_GRAY);
      rowAlt = !rowAlt;

      doc.fontSize(7).font('Helvetica').fillColor(DARK);
      doc.text(ret.tipo.toUpperCase(),       retCols.tipo.x + 2,    y + 3, { width: retCols.tipo.w - 4 });
      doc.text(ret.codigoRetencion,          retCols.codigo.x + 2,  y + 3, { width: retCols.codigo.w - 4 });
      doc.text(ret.descripcion ?? '',        retCols.desc.x + 2,    y + 3, { width: retCols.desc.w - 4, ellipsis: true });
      doc.text('$' + formatMoney(ret.baseImponible), retCols.base.x + 2, y + 3, { width: retCols.base.w - 4, align: 'right' });
      doc.text(ret.tarifa + '%',             retCols.tarifa.x + 2,  y + 3, { width: retCols.tarifa.w - 4, align: 'right' });
      doc.text('$' + formatMoney(ret.valorRetenido), retCols.retenido.x + 2, y + 3, { width: retCols.retenido.w - 4, align: 'right' });

      doc.moveTo(margin, y + rowH).lineTo(pageW - margin, y + rowH).lineWidth(0.3).strokeColor('#E5E7EB').stroke();
      y += rowH;
    }

    // ─── TOTAL RETENIDO ──────────────────────────────────────────────────────
    y += 10;
    const totW = 220;
    const totX = pageW - margin - totW;

    doc.rect(totX - 4, y, totW + 4, 18).fill(CORAL);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('white')
      .text('TOTAL RETENIDO:', totX, y + 4, { width: 150, align: 'right' });
    doc.text('$' + formatMoney(data.totalRetenido), totX + 155, y + 4, { width: 65, align: 'right' });

    y += 28;

    doc.fontSize(7).font('Helvetica-Bold').fillColor(GRAY)
      .text(`FECHA DE EMISIÓN: ${data.fechaEmision}`, margin, y);

    // ─── FOOTER ──────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 50;
    doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY)
      .lineWidth(0.5).strokeColor('#E5E7EB').stroke();

    doc.fontSize(6.5).font('Helvetica').fillColor(GRAY)
      .text(
        'Documento generado electrónicamente. Autorizado por el SRI. Verifique en: https://srienlinea.sri.gob.ec',
        margin, footerY + 6, { width: contentW, align: 'center' },
      );

    doc.rect(0, doc.page.height - 6, pageW, 6).fill(CORAL);

    doc.end();
  });
}
