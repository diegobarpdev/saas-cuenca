// Cliente SOAP para comunicación con SRI Ecuador
// Documentación: https://www.sri.gob.ec/web/guest/facturacion-electronica

const ENDPOINTS = {
  pruebas: {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  },
  produccion: {
    recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  },
};

interface RecepcionResult {
  estado: 'RECIBIDA' | 'DEVUELTA';
  comprobantes?: {
    comprobante?: {
      claveAcceso: string;
      mensajes?: {
        mensaje?: Array<{ identificador: string; mensaje: string; tipo: string; informacionAdicional?: string }>;
      };
    };
  };
}

interface AutorizacionResult {
  numeroComprobantes: string;
  autorizaciones?: {
    autorizacion?: Array<{
      estado: string;
      numeroAutorizacion?: string;
      fechaAutorizacion?: string;
      ambiente?: string;
      comprobante?: string;
      mensajes?: {
        mensaje?: Array<{ identificador: string; mensaje: string; tipo: string }>;
      };
    }>;
  };
}

async function callSoapService(wsdlUrl: string, method: string, args: Record<string, string>): Promise<any> {
  // Usamos soap npm package
  const soap = await import('soap');
  const client = await soap.createClientAsync(wsdlUrl, { wsdl_options: { timeout: 30000 } });
  const result = await (client as any)[`${method}Async`](args);
  return result[0];
}

export async function enviarComprobante(
  xmlFirmado: string,
  ambiente: 'pruebas' | 'produccion',
): Promise<{ estado: string; errores: string[] }> {
  const wsdl = ENDPOINTS[ambiente].recepcion;

  try {
    const result: RecepcionResult = await callSoapService(wsdl, 'validarComprobante', {
      xml: xmlFirmado,
    });

    const errores: string[] = [];
    const mensajes = result?.comprobantes?.comprobante?.mensajes?.mensaje;
    if (mensajes) {
      const arr = Array.isArray(mensajes) ? mensajes : [mensajes];
      for (const m of arr) {
        if (m.tipo === 'ERROR') {
          errores.push(`[${m.identificador}] ${m.mensaje}${m.informacionAdicional ? ': ' + m.informacionAdicional : ''}`);
        }
      }
    }

    return { estado: result?.estado ?? 'DEVUELTA', errores };
  } catch (err: any) {
    return { estado: 'ERROR', errores: [err?.message ?? 'Error de comunicación con SRI'] };
  }
}

export async function autorizarComprobante(
  claveAcceso: string,
  ambiente: 'pruebas' | 'produccion',
): Promise<{
  estado: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  xmlAutorizado?: string;
  errores: string[];
}> {
  const wsdl = ENDPOINTS[ambiente].autorizacion;

  try {
    const result: AutorizacionResult = await callSoapService(wsdl, 'autorizacionComprobante', {
      claveAccesoComprobante: claveAcceso,
    });

    const autorizaciones = result?.autorizaciones?.autorizacion;
    const autorizacion = Array.isArray(autorizaciones) ? autorizaciones[0] : autorizaciones;

    const errores: string[] = [];
    const mensajes = autorizacion?.mensajes?.mensaje;
    if (mensajes) {
      const arr = Array.isArray(mensajes) ? mensajes : [mensajes];
      for (const m of arr) {
        if (m.tipo === 'ERROR') {
          errores.push(`[${m.identificador}] ${m.mensaje}`);
        }
      }
    }

    return {
      estado: autorizacion?.estado ?? 'NO_AUTORIZADO',
      numeroAutorizacion: autorizacion?.numeroAutorizacion,
      fechaAutorizacion: autorizacion?.fechaAutorizacion,
      xmlAutorizado: autorizacion?.comprobante,
      errores,
    };
  } catch (err: any) {
    return {
      estado: 'ERROR',
      errores: [err?.message ?? 'Error de autorización con SRI'],
    };
  }
}

// Reintento de autorización (SRI puede tardar hasta 30s en procesar)
export async function autorizarConReintentos(
  claveAcceso: string,
  ambiente: 'pruebas' | 'produccion',
  maxIntentos = 5,
  espera = 5000,
): Promise<ReturnType<typeof autorizarComprobante>> {
  for (let i = 0; i < maxIntentos; i++) {
    const result = await autorizarComprobante(claveAcceso, ambiente);
    if (result.estado === 'AUTORIZADO' || result.errores.length > 0) {
      return result;
    }
    if (i < maxIntentos - 1) {
      await new Promise(resolve => setTimeout(resolve, espera));
    }
  }
  return { estado: 'EN_PROCESO', errores: [] };
}
