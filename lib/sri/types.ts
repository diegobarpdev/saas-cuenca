export interface SriConfig {
  rucEmisor: string;
  razonSocial: string;
  nombreComercial?: string;
  direccionMatriz: string;
  codigoEstablecimiento: string; // '001'
  codigoPuntoEmision: string;    // '001'
  secuencial: number;
  ambiente: 'pruebas' | 'produccion';
  certificadoP12Base64: string;
  certificadoClave: string;
}

export interface FacturaItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  ivaCodigoPorcentaje: 0 | 4; // 0=0%, 4=15%
  ivaTarifa: 0 | 15;
}

export interface FacturaReceptor {
  tipoDoc: 'RUC' | 'CEDULA' | 'PASAPORTE';
  numDoc: string;
  razonSocial: string;
  email?: string;
  direccion?: string;
}

export interface FacturaRequest {
  config: SriConfig;
  receptor: FacturaReceptor;
  items: FacturaItem[];
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta';
  fechaEmision?: Date;
  orderId?: string;
}

export interface SriResult {
  success: boolean;
  claveAcceso: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  estado: 'autorizada' | 'rechazada' | 'en_proceso' | 'error';
  errores: string[];
  xmlFirmado: string;
  xmlAutorizado?: string;
  secuencialUsado: number;
}

// Tipos de identificación para SRI
export const TIPO_DOC_SRI: Record<'RUC' | 'CEDULA' | 'PASAPORTE', string> = {
  RUC: '04',
  CEDULA: '05',
  PASAPORTE: '06',
};

// Forma de pago SRI
export const FORMA_PAGO_SRI: Record<string, string> = {
  efectivo: '01',
  transferencia: '20',
  tarjeta: '19',
};
