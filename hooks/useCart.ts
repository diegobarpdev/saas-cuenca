'use client';

import { useState, useEffect } from 'react';
import { Product, CartItem } from '@/lib/types/database';
import { getProductPriceInfo } from '@/lib/utils/promo';

export function useCart(businessSlug: string) {
  const STORAGE_KEY = `cart_${businessSlug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar del localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando carrito:', e);
    } finally {
      setIsLoaded(true);
    }
  }, [STORAGE_KEY]);

  // Guardar en localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded, STORAGE_KEY]);

  const addItem = (product: Product, quantity = 1, notas = '', opcionesSeleccionadas?: CartItem['opciones_seleccionadas']) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => 
        item.product.id === product.id && 
        item.notas === notas &&
        JSON.stringify(item.opciones_seleccionadas || []) === JSON.stringify(opcionesSeleccionadas || [])
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].cantidad += quantity;
        return updated;
      }
      return [...prev, { product, cantidad: quantity, notas, opciones_seleccionadas: opcionesSeleccionadas }];
    });
  };

  const removeItem = (productId: string, notas?: string, opcionesSeleccionadas?: CartItem['opciones_seleccionadas']) => {
    setItems((prev) => prev.filter((item) => !(
      item.product.id === productId && 
      (notas === undefined || item.notas === notas) &&
      (opcionesSeleccionadas === undefined || JSON.stringify(item.opciones_seleccionadas || []) === JSON.stringify(opcionesSeleccionadas || []))
    )));
  };

  const updateQuantity = (productId: string, cantidad: number, notas?: string, opcionesSeleccionadas?: CartItem['opciones_seleccionadas']) => {
    if (cantidad <= 0) {
      removeItem(productId, notas, opcionesSeleccionadas);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (
          item.product.id === productId && 
          (notas === undefined || item.notas === notas) &&
          (opcionesSeleccionadas === undefined || JSON.stringify(item.opciones_seleccionadas || []) === JSON.stringify(opcionesSeleccionadas || []))
        ) {
          return { ...item, cantidad };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  const subtotal = items.reduce((sum, item) => {
    const { precioActual } = getProductPriceInfo(item.product);
    const optionsCost = item.opciones_seleccionadas?.reduce((acc, opt) => acc + Number(opt.precio_adicional || 0), 0) || 0;
    return sum + (precioActual + optionsCost) * item.cantidad;
  }, 0);

  const ahorroTotal = items.reduce((sum, item) => {
    const { ahorroMonto } = getProductPriceInfo(item.product);
    return sum + ahorroMonto * item.cantidad;
  }, 0);

  return {
    items,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItemsCount,
    subtotal,
    ahorroTotal,
  };
}
