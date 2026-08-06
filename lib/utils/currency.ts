export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDeliveryType(type?: string): string {
  if (!type) return '';
  switch (type) {
    case 'domicilio':
      return '🛵 Entrega a Domicilio';
    case 'retiro_local':
      return '🛍️ Retiro en Local';
    case 'mesa':
      return '🍽️ Consumo en Mesa';
    default:
      return type.replace('_', ' ');
  }
}

export function formatPaymentMethod(method?: string): string {
  if (!method) return '';
  switch (method) {
    case 'payphone':
      return 'PayPhone';
    case 'deuna':
      return 'Deuna!';
    case 'transferencia':
      return 'Transferencia Bancaria';
    case 'efectivo':
      return 'Efectivo';
    default:
      return method.replace('_', ' ');
  }
}

