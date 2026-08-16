export type DeliveryType = 'domicilio' | 'retiro_local' | 'mesa';
export type PaymentMethod = 'efectivo' | 'payphone' | 'transferencia';
export type PaymentStatus = 'pendiente' | 'pagado' | 'verificando' | 'rechazado';
export type OrderStatus = 'pendiente' | 'aceptado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
export type UserRole = 'dueño' | 'cajero';

export interface BankDetails {
  id?: string;
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  titular: string;
  ruc_ci?: string;
  email?: string;
  activa?: boolean;
}

export interface ShippingZone {
  id: string;
  zona: string;
  costo: number;
}

export interface BillingData {
  tipo_doc: 'RUC' | 'CEDULA' | 'PASAPORTE';
  num_doc: string;
  razon_social: string;
  email: string;
  direccion: string;
}

export type PatternType =
  | 'sin_patron'
  | 'restaurante_general'
  | 'cafeteria'
  | 'panaderia'
  | 'pasteleria'
  | 'pizzeria'
  | 'hamburgueseria'
  | 'sushi_japones'
  | 'comida_mexicana'
  | 'comida_italiana'
  | 'mariscos'
  | 'comida_rapida'
  | 'comida_saludable'
  | 'parrilladas'
  | 'bar_cocteles'
  | 'vinos'
  | 'cerveceria'
  | 'heladeria_postres'
  | 'geometria_moderna'
  | 'lineas_organicas';

export interface BusinessBranding {
  slogan?: string;
  banner_url?: string;
  favicon_url?: string;
  color_primario?: string;
  color_secundario?: string;
  color_acento?: string;
  color_fondo?: string;
  color_texto?: string;
  tipografia?: 'Outfit' | 'Inter' | 'Playfair' | 'Plus Jakarta Sans';
  estilo_botones?: 'redondeado' | 'semi-redondeado' | 'pill' | 'recto';
  tema_defecto?: 'oscuro' | 'claro';
  patron_fondo?: PatternType;
}

export interface OperationalSettings {
  tiempo_preparacion?: string;
  permite_domicilio?: boolean;
  permite_retiro?: boolean;
  google_maps_url?: string;

  // Deuna!
  acepta_deuna?: boolean;
  deuna_numero?: string;
  deuna_titular?: string;

  // Transferencia Bancaria
  acepta_transferencia?: boolean;
  banco?: string;
  tipo_cuenta?: string;
  numero_cuenta?: string;
  titular?: string;
  ruc_ci?: string;
  cuentas_bancarias?: BankDetails[];

  // PayPhone
  acepta_payphone?: boolean;

  // Efectivo
  acepta_efectivo?: boolean;
  instrucciones_efectivo?: string;

  // Servicio en Mesa
  tipo_servicio_mesa?: 'mesero' | 'barra';

  // Horarios de Apertura (formato "HH:MM" en 24h, ej: "08:00", "22:30")
  horario_activo?: boolean;
  horario_apertura?: string;
  horario_cierre?: string;
}

export interface Business {
  id: string;
  slug: string;
  nombre: string;
  ruc: string | null;
  telefono_whatsapp: string;
  direccion: string | null;
  google_maps_url?: string | null;
  logo_url: string | null;
  datos_bancarios: BankDetails;
  cuentas_bancarias?: BankDetails[];
  zonas_envio: ShippingZone[];
  payphone_token: string | null;
  payphone_ambiente?: 'pruebas' | 'produccion' | null;
  plan: 'trial' | 'basico';
  has_payphone?: boolean;
  has_live_kitchen?: boolean;
  has_pos_printing?: boolean;
  has_crm_export?: boolean;
  has_custom_domain?: boolean;
  has_facturacion_sri?: boolean;
  has_mermas?: boolean;
  custom_domain?: string | null;
  branding?: BusinessBranding;
  configuracion_operativa?: OperationalSettings;
  plan_max_productos?: number;
  plan_max_pedidos_mes?: number;
  created_at: string;
}

export type BillingEstado = 'pendiente' | 'pagado' | 'vencido';
export type BillingTipoReceptor = 'ruc' | 'cedula' | 'consumidor_final';

export interface BillingRecord {
  id: string;
  business_id: string;
  mes: string;
  monto: number;
  estado: BillingEstado;
  tipo_receptor: BillingTipoReceptor;
  num_doc?: string | null;
  razon_social?: string | null;
  email_receptor?: string | null;
  metodo_pago?: 'transferencia' | 'efectivo' | 'payphone' | null;
  fecha_pago?: string | null;
  comprobante_url?: string | null;
  notas?: string | null;
  created_at: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  nombre: string;
  rol: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  nombre: string;
  orden: number;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  en_oferta?: boolean;
  precio_oferta?: number | null;
  etiqueta_promo?: string | null;
  stock: number;
  imagen_url: string | null;
  disponible: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  numero_pedido: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  tipo_entrega: DeliveryType;
  numero_mesa: string | null;
  costo_envio: number;
  subtotal: number;
  total: number;
  metodo_pago: PaymentMethod;
  estado_pago: PaymentStatus;
  comprobante_pago_url: string | null;
  payphone_transaction_id: string | null;
  requiere_factura: boolean;
  datos_facturacion: BillingData | null;
  estado: OrderStatus;
  aceptado_at?: string | null;
  en_preparacion_at?: string | null;
  listo_at?: string | null;
  entregado_at?: string | null;
  cancelado_at?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  cantidad: number;
  precio_unitario: number;
  notas: string | null;
  nombre_producto?: string | null;
  product?: Product;
  opciones_seleccionadas?: any;
}

export interface BusinessSriConfig {
  id: string;
  business_id: string;
  ruc_emisor: string;
  razon_social: string;
  nombre_comercial?: string | null;
  direccion_matriz: string;
  codigo_establecimiento: string;
  codigo_punto_emision: string;
  secuencial_actual: number;
  ambiente: 'pruebas' | 'produccion';
  certificado_p12_base64?: string | null;
  certificado_clave?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type FacturaEstado = 'generada' | 'enviada' | 'en_proceso' | 'autorizada' | 'rechazada' | 'anulada';

export interface FacturaElectronica {
  id: string;
  business_id: string;
  order_id: string;
  clave_acceso: string;
  numero_autorizacion?: string | null;
  fecha_autorizacion?: string | null;
  ambiente: 'pruebas' | 'produccion';
  estado: FacturaEstado;
  xml_firmado?: string | null;
  xml_autorizado?: string | null;
  ride_pdf_url?: string | null;
  numero_secuencial: string;
  fecha_emision: string;
  subtotal_sin_impuestos: number;
  iva: number;
  total: number;
  receptor_tipo_doc: 'RUC' | 'CEDULA' | 'PASAPORTE';
  receptor_num_doc: string;
  receptor_razon_social: string;
  receptor_email?: string | null;
  receptor_direccion?: string | null;
  email_enviado: boolean;
  errores: string[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  cantidad: number;
  notas?: string;
  opciones_seleccionadas?: {
    grupo_nombre: string;
    opcion_nombre: string;
    precio_adicional: number;
  }[];
}

export type MermaMotivo = 'accidente' | 'caducidad' | 'preparacion' | 'robo' | 'otro';

export interface Merma {
  id: string;
  business_id: string;
  product_id: string | null;
  nombre_producto: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  motivo: MermaMotivo;
  notas: string | null;
  registrado_por: string | null;
  created_at: string;
}
