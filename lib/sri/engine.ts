// Motor principal de facturación electrónica SRI Ecuador
import type { FacturaRequest, SriResult } from './types';
import { generarClaveAcceso } from './clave';
import { generarXmlFactura } from './xml';
import { firmarXml } from './signer';
import { enviarComprobante, autorizarConReintentos } from './soap';

export async function emitirFactura(req: FacturaRequest): Promise<SriResult> {
  const { config, receptor, items, metodoPago } = req;
  const fechaEmision = req.fechaEmision ?? new Date();
  const ambienteNum = config.ambiente === 'pruebas' ? '1' : '2';
  const errores: string[] = [];

  // 1. Generar clave de acceso
  const claveAcceso = generarClaveAcceso({
    fecha: fechaEmision,
    tipoComprobante: '01',
    ruc: config.rucEmisor,
    ambiente: ambienteNum as '1' | '2',
    establecimiento: config.codigoEstablecimiento,
    puntoEmision: config.codigoPuntoEmision,
    secuencial: config.secuencial,
  });

  // 2. Generar XML de la factura
  let xmlSinFirma: string;
  try {
    xmlSinFirma = generarXmlFactura({
      config,
      receptor,
      items,
      metodoPago,
      fechaEmision,
      claveAcceso,
    });
  } catch (err: any) {
    return {
      success: false,
      claveAcceso,
      estado: 'error',
      errores: [`Error generando XML: ${err.message}`],
      xmlFirmado: '',
      secuencialUsado: config.secuencial,
    };
  }

  // 3. Firmar el XML con XAdES-BES
  let xmlFirmado: string;
  try {
    xmlFirmado = firmarXml(xmlSinFirma, config.certificadoP12Base64, config.certificadoClave);
  } catch (err: any) {
    return {
      success: false,
      claveAcceso,
      estado: 'error',
      errores: [`Error firmando XML: ${err.message}`],
      xmlFirmado: xmlSinFirma,
      secuencialUsado: config.secuencial,
    };
  }

  // 4. Enviar al SRI (recepción)
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

  // 5. Solicitar autorización (con reintentos)
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

export type { FacturaRequest, SriResult, FacturaItem, FacturaReceptor, SriConfig } from './types';
