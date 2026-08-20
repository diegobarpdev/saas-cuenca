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
  // Nuevos campos tributarios opcionales
  obligadoContabilidad?: boolean;
  contribuyenteEspecial?: string | null;
  regimenTributario?: 'GENERAL' | 'RIMPE_EMPRENDEDOR' | 'RIMPE_NEGOCIO_POPULAR';
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

// Nuevos tipos para Nota de Crédito
export interface NotaCreditoRequest {
  config: SriConfig;
  receptor: FacturaReceptor;
  items: FacturaItem[];
  motivo: string;
  codDocModificado: '01';
  numDocModificado: string; // '001-001-000000001'
  fechaEmisionDocSustento: Date;
  fechaEmision?: Date;
}

// Nuevos tipos para Retención
export interface RetencionDetalle {
  tipo: 'renta' | 'iva';
  codigo: string;       // SRI impuesto code: '1'=renta, '2'=IVA
  codigoRetencion: string; // e.g. '303', '312', '725'
  baseImponible: number;
  tarifa: number;       // percentage e.g. 8, 10, 30, 70
  valorRetenido: number;
}

export interface DocSustentoRetencion {
  codDocSustento: '01' | '02' | '03'; // '01'=factura
  numDocSustento: string; // '001-001-000000001'
  fechaEmisionDocSustento: Date;
  numAutDocSustento: string; // authorization number
  totalSinImpuestos: number;
  importeTotal: number;
  retenciones: RetencionDetalle[];
}

export interface RetencionRequest {
  config: SriConfig;
  sujetoRetenido: {
    tipoDoc: 'RUC' | 'CEDULA' | 'PASAPORTE';
    numDoc: string;
    razonSocial: string;
    email?: string;
  };
  periodoFiscal: string; // 'MM/YYYY'
  docsSustento: DocSustentoRetencion[];
  fechaEmision?: Date;
}

// Common SRI retention codes for restaurants
export const CODIGOS_RETENCION_RENTA: Record<string, string> = {
  '303': 'Honorarios profesionales y demás pagos por servicios de personas naturales',
  '304': 'Servicios entre sociedades',
  '307': 'Servicios de publicidad y comunicación',
  '309': 'Arrendamiento mercantil',
  '310': 'Arrendamiento bienes inmuebles',
  '312': 'Transporte privado de pasajeros o transporte público o privado de carga',
  '319': 'Otras retenciones aplicables al 1%',
  '320': 'Otras retenciones aplicables al 2%',
  '322': 'Otras retenciones aplicables al 8%',
  '340': 'Otras retenciones aplicables el porcentaje vigente',
};

export const CODIGOS_RETENCION_IVA: Record<string, string> = {
  '725': 'Retención IVA 30% - Bienes',
  '726': 'Retención IVA 70% - Servicios',
  '727': 'Retención IVA 100% - Bienes y Servicios',
};
