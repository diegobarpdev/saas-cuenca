'use client';

import { useState, useCallback } from 'react';
import { buildTicketEscPos } from '@/lib/qztray/escpos';

export type QzStatus = 'idle' | 'connecting' | 'connected' | 'not_installed' | 'error';

const PRINTER_KEY = 'kaltiro_qz_printer';

/** Carga qz-tray desde /public/qz-tray.js (UMD, accedido por window.qz) */
async function loadQz(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('Solo browser');
  if ((window as any).qz) return (window as any).qz;

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/qz-tray.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('No se pudo cargar qz-tray.js'));
    document.head.appendChild(s);
  });

  return (window as any).qz;
}

export function useQzTray() {
  const [status, setStatus]             = useState<QzStatus>('idle');
  const [printers, setPrinters]         = useState<string[]>([]);
  const [selectedPrinter, _setSelected] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(PRINTER_KEY) ?? '') : ''
  );
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  const selectPrinter = useCallback((name: string) => {
    _setSelected(name);
    localStorage.setItem(PRINTER_KEY, name);
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    setStatus('connecting');
    setErrorMsg(null);
    try {
      const qz = await loadQz();
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect({ retries: 1, delay: 1 });
      }
      const found = await qz.printers.find() as string | string[];
      const list = Array.isArray(found) ? found : [found].filter(Boolean);
      setPrinters(list);
      setStatus('connected');
      return true;
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (msg.includes('Unable to establish') || msg.includes('refused') || msg.includes('connect')) {
        setStatus('not_installed');
        setErrorMsg('QZ Tray no está instalado o no está corriendo.');
      } else {
        setStatus('error');
        setErrorMsg(msg || 'Error desconocido al conectar QZ Tray');
      }
      return false;
    }
  }, []);

  const printOrder = useCallback(async (
    order: any,
    business: any,
    printer?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const target = printer ?? selectedPrinter;
    if (!target) return { success: false, error: 'Sin impresora seleccionada' };
    try {
      const qz = await loadQz();
      if (!qz.websocket.isActive()) {
        const ok = await connect();
        if (!ok) return { success: false, error: 'No se pudo conectar a QZ Tray' };
      }
      const escData = buildTicketEscPos(order, business);
      const config  = qz.configs.create(target);
      await qz.print(config, [{ type: 'raw', format: 'plain', data: escData }]);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Error al imprimir' };
    }
  }, [selectedPrinter, connect]);

  return { status, printers, selectedPrinter, selectPrinter, errorMsg, connect, printOrder };
}
