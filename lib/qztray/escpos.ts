// ESC/POS builder para impresoras térmicas 80mm (~48 chars/línea)

const ESC = '\x1B';
const GS  = '\x1D';
const LF  = '\x0A';

export const CMD = {
  INIT:        ESC + '@',
  LEFT:        ESC + 'a\x00',
  CENTER:      ESC + 'a\x01',
  RIGHT:       ESC + 'a\x02',
  BOLD_ON:     ESC + 'E\x01',
  BOLD_OFF:    ESC + 'E\x00',
  SIZE_2H:     GS  + '!\x01',   // doble alto
  SIZE_NORMAL: GS  + '!\x00',
  FEED:        (n: number) => GS + 'd' + String.fromCharCode(n),
  CUT:         GS  + 'V\x00',
};

const W = 48; // ancho en caracteres para 80mm

function sep(): string {
  return '-'.repeat(W) + LF;
}

/** Texto izquierda + texto derecha, relleno con espacios */
function rjust(left: string, right: string, width = W): string {
  const space = width - right.length;
  return left.substring(0, space).padEnd(space) + right + LF;
}

function money(amount: number): string {
  return '$' + Number(amount).toFixed(2);
}

export function buildTicketEscPos(order: any, business: any): string {
  let t = CMD.INIT;

  // ── ENCABEZADO NEGOCIO ──────────────────────────────────────
  t += CMD.CENTER + CMD.BOLD_ON + CMD.SIZE_2H;
  t += business.nombre.toUpperCase().substring(0, 22) + LF;
  t += CMD.SIZE_NORMAL;
  if (business.ruc)               t += 'RUC: ' + business.ruc + LF;
  if (business.direccion)         t += business.direccion.substring(0, W) + LF;
  if (business.telefono_whatsapp) t += 'Telf: ' + business.telefono_whatsapp + LF;
  t += CMD.BOLD_OFF;
  t += sep();

  // ── PEDIDO ──────────────────────────────────────────────────
  t += CMD.LEFT;
  const TIPO_MAP: Record<string, string> = {
    consumo_en_mesa: 'EN MESA',
    mesa:            'EN MESA',
    para_llevar:     'LLEVAR',
    retiro_local:    'LLEVAR',
    delivery:        'DELIVERY',
    domicilio:       'DELIVERY',
  };
  const tipo = TIPO_MAP[order.tipo_entrega] ?? (order.tipo_entrega ?? '').toUpperCase();
  t += CMD.BOLD_ON;
  t += rjust('PEDIDO #' + String(order.numero_pedido).padStart(4, '0'), tipo);
  t += CMD.BOLD_OFF;

  const fecha = new Date(order.created_at).toLocaleString('es-EC', {
    dateStyle: 'short', timeStyle: 'short',
  });
  t += 'Fecha: ' + fecha + LF;

  if (order.numero_mesa) {
    t += CMD.BOLD_ON + 'MESA: ' + order.numero_mesa + CMD.BOLD_OFF + LF;
  }
  t += sep();

  // ── CLIENTE ─────────────────────────────────────────────────
  t += CMD.BOLD_ON + 'CLIENTE:' + CMD.BOLD_OFF + LF;
  t += (order.cliente_nombre || 'Consumidor Final').substring(0, W) + LF;
  if (order.cliente_telefono) t += 'Telf: ' + order.cliente_telefono + LF;
  t += sep();

  // ── FACTURACIÓN ─────────────────────────────────────────────
  t += CMD.BOLD_ON + 'FACTURACION:' + CMD.BOLD_OFF + LF;
  if (order.requiere_factura && order.datos_facturacion) {
    const df = order.datos_facturacion;
    t += (df.tipo_doc || 'DOC').toUpperCase() + ': ' + (df.num_doc || '') + LF;
    t += 'NOMBRE: ' + (df.razon_social || '').substring(0, W - 8) + LF;
    if (df.email) t += 'EMAIL: ' + df.email.substring(0, W - 7) + LF;
  } else {
    t += CMD.BOLD_ON + 'SIN FACTURA' + CMD.BOLD_OFF + LF;
  }
  t += sep();

  // ── ITEMS ───────────────────────────────────────────────────
  const CW = 4;   // cant
  const TW = 8;   // total
  const DW = W - CW - TW - 2; // desc (34)

  t += CMD.BOLD_ON;
  t += 'CANT'.padEnd(CW) + ' ' + 'DESCRIPCION'.padEnd(DW) + ' ' + 'TOTAL'.padStart(TW) + LF;
  t += CMD.BOLD_OFF;
  t += sep();

  const items: any[] = order.items || [];
  for (const item of items) {
    const nombre = (item.product?.nombre || item.nombre || 'Producto').substring(0, DW);
    const cant   = (String(item.cantidad) + 'x').padEnd(CW);
    const total  = money(item.precio_unitario * item.cantidad).padStart(TW);
    t += cant + ' ' + nombre.padEnd(DW) + ' ' + total + LF;
    if (item.notas) {
      t += '     (' + String(item.notas).substring(0, W - 6) + ')' + LF;
    }
  }
  t += sep();

  // ── TOTALES ─────────────────────────────────────────────────
  t += rjust('Subtotal:', money(order.subtotal));
  if ((order.costo_envio ?? 0) > 0) {
    t += rjust('Costo de envio:', money(order.costo_envio));
  }
  t += CMD.BOLD_ON + rjust('TOTAL A PAGAR:', money(order.total)) + CMD.BOLD_OFF;
  t += sep();

  // ── PAGO ────────────────────────────────────────────────────
  const PAGO_MAP: Record<string, string> = {
    efectivo:      'EFECTIVO',
    transferencia: 'TRANSFERENCIA',
    tarjeta:       'TARJETA / PAYPHONE',
    payphone:      'TARJETA / PAYPHONE',
  };
  const pago   = PAGO_MAP[order.metodo_pago]  ?? (order.metodo_pago  ?? '').toUpperCase();
  const estado = (order.estado_pago ?? '').toUpperCase();
  t += CMD.CENTER;
  t += CMD.BOLD_ON + 'PAGO: ' + pago + CMD.BOLD_OFF + LF;
  t += (order.estado_pago === 'pagado' ? 'COBRADO' : 'PENDIENTE DE COBRO') + LF;
  t += sep();

  // ── PIE ─────────────────────────────────────────────────────
  t += CMD.CENTER + CMD.BOLD_ON + '¡Gracias por su preferencia!' + CMD.BOLD_OFF + LF;
  t += 'Comprobante sin validez tributaria directa' + LF;

  // Feed y corte
  t += CMD.FEED(4);
  t += CMD.CUT;

  return t;
}
