import { create } from 'xmlbuilder2';
import type { FacturaItem, FacturaReceptor, SriConfig } from './types';
import { TIPO_DOC_SRI, FORMA_PAGO_SRI } from './types';
import { generarClaveAcceso, secuencialToString } from './clave';

interface GenerarXmlParams {
  config: SriConfig;
  receptor: FacturaReceptor;
  items: FacturaItem[];
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta';
  fechaEmision: Date;
  claveAcceso: string;
}

export function calcularTotales(items: FacturaItem[]) {
  let subtotalSinImpuestos = 0;
  let totalIva15 = 0;
  let totalIva0 = 0;

  for (const item of items) {
    const precioSinDescuento = item.precioUnitario * item.cantidad;
    const descuento = item.descuento ?? 0;
    const precioTotalSinImpuesto = precioSinDescuento - descuento;
    subtotalSinImpuestos += precioTotalSinImpuesto;

    const iva = (precioTotalSinImpuesto * item.ivaTarifa) / 100;
    if (item.ivaTarifa === 15) totalIva15 += iva;
    else totalIva0 += iva;
  }

  const totalSinImpuestos = subtotalSinImpuestos;
  const iva = totalIva15;
  const importeTotal = totalSinImpuestos + iva;

  return {
    totalSinImpuestos: totalSinImpuestos.toFixed(2),
    iva15: totalIva15.toFixed(2),
    iva0: totalIva0.toFixed(2),
    importeTotal: importeTotal.toFixed(2),
    baseImponible15: items
      .filter(i => i.ivaTarifa === 15)
      .reduce((acc, i) => {
        const total = i.precioUnitario * i.cantidad - (i.descuento ?? 0);
        return acc + total;
      }, 0)
      .toFixed(2),
    baseImponible0: items
      .filter(i => i.ivaTarifa === 0)
      .reduce((acc, i) => {
        const total = i.precioUnitario * i.cantidad - (i.descuento ?? 0);
        return acc + total;
      }, 0)
      .toFixed(2),
  };
}

export function formatFechaSRI(date: Date): string {
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const aaaa = date.getFullYear();
  return `${dd}/${mm}/${aaaa}`;
}

export function generarXmlFactura(params: GenerarXmlParams): string {
  const { config, receptor, items, metodoPago, fechaEmision, claveAcceso } = params;
  const totales = calcularTotales(items);
  const ambienteNum = config.ambiente === 'pruebas' ? '1' : '2';

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('factura', { id: 'comprobante', version: '1.1.0' });

  // infoTributaria
  const infoTrib = root.ele('infoTributaria');
  infoTrib.ele('ambiente').txt(ambienteNum);
  infoTrib.ele('tipoEmision').txt('1');
  infoTrib.ele('razonSocial').txt(config.razonSocial);
  infoTrib.ele('nombreComercial').txt(config.nombreComercial ?? config.razonSocial);
  infoTrib.ele('ruc').txt(config.rucEmisor);
  infoTrib.ele('claveAcceso').txt(claveAcceso);
  infoTrib.ele('codDoc').txt('01');
  infoTrib.ele('estab').txt(config.codigoEstablecimiento.padStart(3, '0'));
  infoTrib.ele('ptoEmi').txt(config.codigoPuntoEmision.padStart(3, '0'));
  infoTrib.ele('secuencial').txt(secuencialToString(config.secuencial));
  infoTrib.ele('dirMatriz').txt(config.direccionMatriz);

  // infoFactura
  const infoFact = root.ele('infoFactura');
  infoFact.ele('fechaEmision').txt(formatFechaSRI(fechaEmision));
  infoFact.ele('dirEstablecimiento').txt(config.direccionMatriz);
  infoFact.ele('obligadoContabilidad').txt(config.obligadoContabilidad ? 'SI' : 'NO');
  infoFact.ele('tipoIdentificacionComprador').txt(TIPO_DOC_SRI[receptor.tipoDoc]);
  infoFact.ele('razonSocialComprador').txt(receptor.razonSocial);
  infoFact.ele('identificacionComprador').txt(receptor.numDoc);
  infoFact.ele('totalSinImpuestos').txt(totales.totalSinImpuestos);
  infoFact.ele('totalDescuento').txt('0.00');

  const totalConImpuestos = infoFact.ele('totalConImpuestos');

  if (parseFloat(totales.baseImponible15) > 0) {
    const ti = totalConImpuestos.ele('totalImpuesto');
    ti.ele('codigo').txt('2');
    ti.ele('codigoPorcentaje').txt('4'); // 15%
    ti.ele('descuentoAdicional').txt('0.00');
    ti.ele('baseImponible').txt(totales.baseImponible15);
    ti.ele('valor').txt(totales.iva15);
  }

  if (parseFloat(totales.baseImponible0) > 0) {
    const ti = totalConImpuestos.ele('totalImpuesto');
    ti.ele('codigo').txt('2');
    ti.ele('codigoPorcentaje').txt('0'); // 0%
    ti.ele('descuentoAdicional').txt('0.00');
    ti.ele('baseImponible').txt(totales.baseImponible0);
    ti.ele('valor').txt('0.00');
  }

  infoFact.ele('propina').txt('0.00');
  infoFact.ele('importeTotal').txt(totales.importeTotal);
  infoFact.ele('moneda').txt('DOLAR');

  const pagos = infoFact.ele('pagos');
  const pago = pagos.ele('pago');
  pago.ele('formaPago').txt(FORMA_PAGO_SRI[metodoPago] ?? '01');
  pago.ele('total').txt(totales.importeTotal);
  pago.ele('plazo').txt('0');
  pago.ele('unidadTiempo').txt('dias');

  // detalles
  const detalles = root.ele('detalles');
  for (const item of items) {
    const d = detalles.ele('detalle');
    d.ele('codigoPrincipal').txt(item.codigo);
    d.ele('descripcion').txt(item.descripcion);
    d.ele('cantidad').txt(item.cantidad.toFixed(2));
    d.ele('precioUnitario').txt(item.precioUnitario.toFixed(6));
    d.ele('descuento').txt((item.descuento ?? 0).toFixed(2));
    const precioTotalSinImpuesto = (item.precioUnitario * item.cantidad - (item.descuento ?? 0));
    d.ele('precioTotalSinImpuesto').txt(precioTotalSinImpuesto.toFixed(2));
    const impuestos = d.ele('impuestos');
    const imp = impuestos.ele('impuesto');
    imp.ele('codigo').txt('2');
    imp.ele('codigoPorcentaje').txt(item.ivaCodigoPorcentaje.toString());
    imp.ele('tarifa').txt(item.ivaTarifa.toString());
    imp.ele('baseImponible').txt(precioTotalSinImpuesto.toFixed(2));
    imp.ele('valor').txt(((precioTotalSinImpuesto * item.ivaTarifa) / 100).toFixed(2));
  }

  // infoAdicional
  const infoAdicional = root.ele('infoAdicional');
  if (receptor.email) {
    infoAdicional.ele('campoAdicional', { nombre: 'email' }).txt(receptor.email);
  }
  if (receptor.direccion) {
    infoAdicional.ele('campoAdicional', { nombre: 'direccion' }).txt(receptor.direccion);
  }

  return root.end({ prettyPrint: false });
}

// calcularTotales and formatFechaSRI are exported above
