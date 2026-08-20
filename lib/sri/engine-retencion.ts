import type { RetencionRequest, SriResult } from './types';
import { generarClaveAcceso } from './clave';
import { generarXmlRetencion } from './xml-retencion';
import { firmarXml } from './signer';
import { enviarComprobante, autorizarConReintentos } from './soap';

export async function emitirRetencion(req: RetencionRequest): Promise<SriResult> {
  const { config } = req;
  const fechaEmision = req.fechaEmision ?? new Date();
  const ambienteNum = config.ambiente === 'pruebas' ? '1' : '2';

  const claveAcceso = generarClaveAcceso({
    fecha: fechaEmision,
    tipoComprobante: '07',
    ruc: config.rucEmisor,
    ambiente: ambienteNum as '1' | '2',
    establecimiento: config.codigoEstablecimiento,
    puntoEmision: config.codigoPuntoEmision,
    secuencial: config.secuencial,
  });

  let xmlSinFirma: string;
  try {
    xmlSinFirma = generarXmlRetencion({ ...req, fechaEmision, claveAcceso });
  } catch (err: any) {
    return {
      success: false,
      claveAcceso,
      estado: 'error',
      errores: [`Error generando XML Retención: ${err.message}`],
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
      errores: [`Error firmando XML Retención: ${err.message}`],
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
