import { create } from 'xmlbuilder2';
import type { FacturaItem, FacturaReceptor, SriConfig } from './types';
import { TIPO_DOC_SRI } from './types';
import { secuencialToString } from './clave';
import { calcularTotales, formatFechaSRI } from './xml';

interface GenerarXmlNotaCreditoParams {
  config: SriConfig;
  receptor: FacturaReceptor;
  items: FacturaItem[];
  motivo: string;
  codDocModificado: '01';
  numDocModificado: string;
  fechaEmisionDocSustento: Date;
  fechaEmision: Date;
  claveAcceso: string;
}

export function generarXmlNotaCredito(params: GenerarXmlNotaCreditoParams): string {
  const { config, receptor, items, motivo, codDocModificado, numDocModificado, fechaEmisionDocSustento, fechaEmision, claveAcceso } = params;
  const totales = calcularTotales(items);
  const ambienteNum = config.ambiente === 'pruebas' ? '1' : '2';

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('notaCredito', { id: 'comprobante', version: '1.1.0' });

  // infoTributaria
  const infoTrib = root.ele('infoTributaria');
  infoTrib.ele('ambiente').txt(ambienteNum);
  infoTrib.ele('tipoEmision').txt('1');
  infoTrib.ele('razonSocial').txt(config.razonSocial);
  infoTrib.ele('nombreComercial').txt(config.nombreComercial ?? config.razonSocial);
  infoTrib.ele('ruc').txt(config.rucEmisor);
  infoTrib.ele('claveAcceso').txt(claveAcceso);
  infoTrib.ele('codDoc').txt('04');
  infoTrib.ele('estab').txt(config.codigoEstablecimiento.padStart(3, '0'));
  infoTrib.ele('ptoEmi').txt(config.codigoPuntoEmision.padStart(3, '0'));
  infoTrib.ele('secuencial').txt(secuencialToString(config.secuencial));
  infoTrib.ele('dirMatriz').txt(config.direccionMatriz);
  if (config.contribuyenteEspecial) {
    infoTrib.ele('contribuyenteEspecial').txt(config.contribuyenteEspecial);
  }

  // infoNotaCredito
  const info = root.ele('infoNotaCredito');
  info.ele('fechaEmision').txt(formatFechaSRI(fechaEmision));
  info.ele('dirEstablecimiento').txt(config.direccionMatriz);
  info.ele('tipoIdentificacionComprador').txt(TIPO_DOC_SRI[receptor.tipoDoc]);
  info.ele('razonSocialComprador').txt(receptor.razonSocial);
  info.ele('identificacionComprador').txt(receptor.numDoc);
  info.ele('contribuyenteEspecial').txt(config.contribuyenteEspecial ?? '');
  info.ele('obligadoContabilidad').txt(config.obligadoContabilidad ? 'SI' : 'NO');
  info.ele('codDocModificado').txt(codDocModificado);
  info.ele('numDocModificado').txt(numDocModificado);
  info.ele('fechaEmisionDocSustento').txt(formatFechaSRI(fechaEmisionDocSustento));
  info.ele('totalSinImpuestos').txt(totales.totalSinImpuestos);
  info.ele('valorModificacion').txt(totales.importeTotal);
  info.ele('moneda').txt('DOLAR');

  const totalConImpuestos = info.ele('totalConImpuestos');
  if (parseFloat(totales.baseImponible15) > 0) {
    const ti = totalConImpuestos.ele('totalImpuesto');
    ti.ele('codigo').txt('2');
    ti.ele('codigoPorcentaje').txt('4');
    ti.ele('descuentoAdicional').txt('0.00');
    ti.ele('baseImponible').txt(totales.baseImponible15);
    ti.ele('valor').txt(totales.iva15);
  }
  if (parseFloat(totales.baseImponible0) > 0) {
    const ti = totalConImpuestos.ele('totalImpuesto');
    ti.ele('codigo').txt('2');
    ti.ele('codigoPorcentaje').txt('0');
    ti.ele('descuentoAdicional').txt('0.00');
    ti.ele('baseImponible').txt(totales.baseImponible0);
    ti.ele('valor').txt('0.00');
  }
  info.ele('motivo').txt(motivo);

  // detalles
  const detalles = root.ele('detalles');
  for (const item of items) {
    const d = detalles.ele('detalle');
    d.ele('codigoInterno').txt(item.codigo);
    d.ele('descripcion').txt(item.descripcion);
    d.ele('cantidad').txt(item.cantidad.toFixed(2));
    d.ele('precioUnitario').txt(item.precioUnitario.toFixed(6));
    d.ele('descuento').txt((item.descuento ?? 0).toFixed(2));
    const precioTotal = item.precioUnitario * item.cantidad - (item.descuento ?? 0);
    d.ele('precioTotalSinImpuesto').txt(precioTotal.toFixed(2));
    const impuestos = d.ele('impuestos');
    const imp = impuestos.ele('impuesto');
    imp.ele('codigo').txt('2');
    imp.ele('codigoPorcentaje').txt(item.ivaCodigoPorcentaje.toString());
    imp.ele('tarifa').txt(item.ivaTarifa.toString());
    imp.ele('baseImponible').txt(precioTotal.toFixed(2));
    imp.ele('valor').txt(((precioTotal * item.ivaTarifa) / 100).toFixed(2));
  }

  // infoAdicional
  if (receptor.email || receptor.direccion) {
    const infoAdicional = root.ele('infoAdicional');
    if (receptor.email) infoAdicional.ele('campoAdicional', { nombre: 'email' }).txt(receptor.email);
    if (receptor.direccion) infoAdicional.ele('campoAdicional', { nombre: 'direccion' }).txt(receptor.direccion);
  }

  return root.end({ prettyPrint: false });
}
