import { Product } from '@/lib/types/database';

export interface ProductPriceInfo {
  precioActual: number;
  precioOriginal: number;
  tieneOferta: boolean;
  descuentoPorcentaje: number;
  ahorroMonto: number;
}

export function getProductPriceInfo(product: Product): ProductPriceInfo {
  const tieneOferta = !!(
    product.en_oferta &&
    product.precio_oferta != null &&
    product.precio_oferta > 0 &&
    product.precio_oferta < product.precio
  );

  const precioOriginal = product.precio || 0;
  const precioActual = tieneOferta ? product.precio_oferta! : precioOriginal;
  const ahorroMonto = tieneOferta ? precioOriginal - precioActual : 0;
  const descuentoPorcentaje = tieneOferta && precioOriginal > 0
    ? Math.round((ahorroMonto / precioOriginal) * 100)
    : 0;

  return {
    precioActual,
    precioOriginal,
    tieneOferta,
    descuentoPorcentaje,
    ahorroMonto,
  };
}
