import type { NotaCreditoRequest, SriResult } from './types';
import { generarClaveAcceso } from './clave';
import { generarXmlNotaCredito } from './xml-nota-credito';
import { firmarXml } from './signer';
import { enviarComprobante, autorizarConReintentos } from './soap';

export async function emitirNotaCredito(req: NotaCreditoRequest): Promise<SriResult> {
  const { config, receptor, items, motivo, codDocModificado, numDocModificado, fechaEmisionDocSustento } = req;
  const fechaEmision = req.fechaEmision ?? new Date();
  const ambienteNum = config.ambiente === 'pruebas' ? '1' : '2';

  const claveAcceso = generarClaveAcceso({
    fecha: fechaEmision,
    tipoComprobante: '04',
    ruc: config.rucEmisor,
    ambiente: ambienteNum as '1' | '2',
    establecimiento: config.codigoEstablecimiento,
    puntoEmision: config.codigoPuntoEmision,
    secuencial: config.secuencial,
  });

  let xmlSinFirma: string;
  try {
    xmlSinFirma = generarXmlNotaCredito({
      config,
      receptor,
      items,
      motivo,
      codDocModificado,
      numDocModificado,
      fechaEmisionDocSustento,
      fechaEmision,
      claveAcceso,
    });
  } catch (err: any) {
    return {
      success: false,
      claveAcceso,
      estado: 'error',
      errores: [`Error generando XML NC: ${err.message}`],
      xmlFirmado: '',
      secuencialUsado: config.secuencial,
    };
  }

  let xmlFirmado: string;
  try {
    xmlFirmado = firmarXml(xmlSinFirma, config.certificadoP12Base64, config.certificadoClave);
  } catch (err: any) {
    return {
      success: false,
      claveAcceso,
      estado: 'error',
      errores: [`Error firmando XML NC: ${err.message}`],
      xmlFirmado: xmlSinFirma,
      secuencialUsado: config.secuencial,
    };
  }

  const recepcion = await enviarComprobante(xmlFirmado, config.ambiente);

  if (recepcion.estado !== 'RECIBIDA') {
    return {
      success: false,
      claveAcceso,
      estado: 'rechazada',
      errores: recepcion.errores,
      xmlFirmado,
      secuencialUsado: config.secuencial,
    };
  }

  const autorizacion = await autorizarConReintentos(claveAcceso, config.ambiente);

  if (autorizacion.estado === 'AUTORIZADO') {
    return {
      success: true,
      claveAcceso,
      numeroAutorizacion: autorizacion.numeroAutorizacion,
      fechaAutorizacion: autorizacion.fechaAutorizacion,
      estado: 'autorizada',
      errores: [],
      xmlFirmado,
      xmlAutorizado: autorizacion.xmlAutorizado,
      secuencialUsado: config.secuencial,
    };
  }

  if (autorizacion.estado === 'EN_PROCESO') {
    return {
      success: true,
      claveAcceso,
      estado: 'en_proceso',
      errores: [],
      xmlFirmado,
      secuencialUsado: config.secuencial,
    };
  }

  return {
    success: false,
    claveAcceso,
    estado: 'rechazada',
    errores: autorizacion.errores,
    xmlFirmado,
    secuencialUsado: config.secuencial,
  };
}
