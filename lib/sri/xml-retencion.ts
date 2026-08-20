import { create } from 'xmlbuilder2';
import type { RetencionRequest, DocSustentoRetencion } from './types';
import { TIPO_DOC_SRI } from './types';
import { secuencialToString } from './clave';

function formatFechaSRI(date: Date): string {
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

interface GenerarXmlRetencionParams extends RetencionRequest {
  claveAcceso: string;
}

export function generarXmlRetencion(params: GenerarXmlRetencionParams): string {
  const { config, sujetoRetenido, periodoFiscal, docsSustento, fechaEmision: fe, claveAcceso } = params;
  const fechaEmision = fe ?? new Date();
  const ambienteNum = config.ambiente === 'pruebas' ? '1' : '2';

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('comprobanteRetencion', { id: 'comprobante', version: '2.0.0' });

  // infoTributaria
  const infoTrib = root.ele('infoTributaria');
  infoTrib.ele('ambiente').txt(ambienteNum);
  infoTrib.ele('tipoEmision').txt('1');
  infoTrib.ele('razonSocial').txt(config.razonSocial);
  infoTrib.ele('nombreComercial').txt(config.nombreComercial ?? config.razonSocial);
  infoTrib.ele('ruc').txt(config.rucEmisor);
  infoTrib.ele('claveAcceso').txt(claveAcceso);
  infoTrib.ele('codDoc').txt('07');
  infoTrib.ele('estab').txt(config.codigoEstablecimiento.padStart(3, '0'));
  infoTrib.ele('ptoEmi').txt(config.codigoPuntoEmision.padStart(3, '0'));
  infoTrib.ele('secuencial').txt(secuencialToString(config.secuencial));
  infoTrib.ele('dirMatriz').txt(config.direccionMatriz);
  if (config.contribuyenteEspecial) {
    infoTrib.ele('contribuyenteEspecial').txt(config.contribuyenteEspecial);
  }

  // infoCompRetencion
  const info = root.ele('infoCompRetencion');
  info.ele('fechaEmision').txt(formatFechaSRI(fechaEmision));
  info.ele('dirEstablecimiento').txt(config.direccionMatriz);
  if (config.contribuyenteEspecial) {
    info.ele('contribuyenteEspecial').txt(config.contribuyenteEspecial);
  }
  info.ele('obligadoContabilidad').txt(config.obligadoContabilidad ? 'SI' : 'NO');
  info.ele('tipoIdentificacionSujetoRetenido').txt(TIPO_DOC_SRI[sujetoRetenido.tipoDoc]);
  info.ele('razonSocialSujetoRetenido').txt(sujetoRetenido.razonSocial);
  info.ele('identificacionSujetoRetenido').txt(sujetoRetenido.numDoc);
  info.ele('periodoFiscal').txt(periodoFiscal);

  // docsSustento
  const docsSustentoNode = root.ele('docsSustento');
  for (const doc of docsSustento) {
    const ds = docsSustentoNode.ele('docSustento');
    ds.ele('codSustento').txt('01');
    ds.ele('codDocSustento').txt(doc.codDocSustento);
    ds.ele('numDocSustento').txt(doc.numDocSustento);
    ds.ele('fechaEmisionDocSustento').txt(formatFechaSRI(doc.fechaEmisionDocSustento));
    ds.ele('fechaRegistroContable').txt(formatFechaSRI(fechaEmision));
    ds.ele('numAutDocSustento').txt(doc.numAutDocSustento);
    ds.ele('pagoLocExt').txt('01');
    ds.ele('tipoRegi').txt('01');
    ds.ele('paisEfecPago').txt('593');
    ds.ele('aplicConvDobTrib').txt('NO');
    ds.ele('pagExtSujRetNorLeg').txt('NO');
    ds.ele('totalSinImpuestos').txt(doc.totalSinImpuestos.toFixed(2));
    ds.ele('importeTotal').txt(doc.importeTotal.toFixed(2));

    // impuestosDocSustento (IVA of the supplier invoice)
    const impuestos = ds.ele('impuestosDocSustento');
    const iva = doc.importeTotal - doc.totalSinImpuestos;
    if (iva > 0) {
      const imp = impuestos.ele('impuestoDocSustento');
      imp.ele('codImpuestoDocSustento').txt('2');
      imp.ele('codigoPorcentaje').txt('4');
      imp.ele('baseImponible').txt(doc.totalSinImpuestos.toFixed(2));
      imp.ele('tarifa').txt('15.00');
      imp.ele('valorImpuesto').txt(iva.toFixed(2));
    }

    // retenciones
    const retNode = ds.ele('retenciones');
    for (const ret of doc.retenciones) {
      const r = retNode.ele('retencion');
      r.ele('codigo').txt(ret.codigo);
      r.ele('codigoRetencion').txt(ret.codigoRetencion);
      r.ele('baseImponible').txt(ret.baseImponible.toFixed(2));
      r.ele('porcentajeRetener').txt(ret.tarifa.toString());
      r.ele('valorRetenido').txt(ret.valorRetenido.toFixed(2));
    }
  }

  return root.end({ prettyPrint: false });
}
