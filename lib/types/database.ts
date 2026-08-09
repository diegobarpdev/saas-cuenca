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
  plan: 'trial' | 'basico' | 'pro';
  has_payphone?: boolean;
  has_live_kitchen?: boolean;
  has_pos_printing?: boolean;
  has_crm_export?: boolean;
  has_custom_domain?: boolean;
  branding?: BusinessBranding;
  configuracion_operativa?: OperationalSettings;
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
  product?: Product;
}

export interface CartItem {
  product: Product;
  cantidad: number;
  notas?: string;
}
