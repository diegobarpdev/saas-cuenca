'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import {
  Receipt, RefreshCw, FileText, AlertCircle,
  XCircle, ShieldCheck, Timer, Search, Zap,
  Loader2, Printer, ExternalLink,
} from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from '@/lib/utils/toast';
import type { FacturaElectronica } from '@/lib/types/database';

interface OrderWithBilling {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  total: number;
  created_at: string;
  datos_facturacion: {
    tipo_doc: 'RUC' | 'CEDULA' | 'PASAPORTE';
    num_doc: string;
    razon_social: string;
    email: string;
    direccion: string;
  } | null;
  factura?: FacturaElectronica | null;
}

function EstadoIcon({ estado }: { estado: string }) {
  if (estado === 'autorizada') return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
  if (estado === 'rechazada') return <XCircle className="w-4 h-4 text-rose-400" />;
  if (estado === 'en_proceso') return <Timer className="w-4 h-4 text-amber-400" />;
  return <FileText className="w-4 h-4 text-slate-500" />;
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    autorizada: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    rechazada: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    en_proceso: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-mono-tech font-bold uppercase ${map[estado] ?? 'bg-slate-500/10 border-white/10 text-slate-400'}`}>
      {estado.replace('_', ' ')}
    </span>
  );
}

export default function AdminFacturacionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { business, loading: loadingBusiness } = useAdminBusiness(slug);

  const [orders, setOrders] = useState<OrderWithBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emitiendo, setEmitiendo] = useState<string | null>(null);
  const [hasSriConfig, setHasSriConfig] = useState(false);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data: ordersData }, { data: facturas }, { data: sriConfig }] = await Promise.all([
        supabase
          .from('orders')
          .select('id, numero_pedido, cliente_nombre, total, created_at, datos_facturacion')
          .eq('business_id', business.id)
          .eq('requiere_factura', true)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('facturas_electronicas')
          .select('*')
          .eq('business_id', business.id),
        supabase
          .from('business_sri_config')
          .select('id')
          .eq('business_id', business.id)
          .eq('activo', true)
          .maybeSingle(),
      ]);

      setHasSriConfig(!!sriConfig);

      const facturaMap = new Map<string, FacturaElectronica>();
      for (const f of (facturas ?? [])) {
        if (!facturaMap.has(f.order_id) || new Date(f.created_at) > new Date(facturaMap.get(f.order_id)!.created_at)) {
          facturaMap.set(f.order_id, f as FacturaElectronica);
        }
      }

      setOrders((ordersData ?? []).map((o: any) => ({ ...o, factura: facturaMap.get(o.id) ?? null })) as OrderWithBilling[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => { load(); }, [load]);

  const emitirFactura = async (order: OrderWithBilling) => {
    if (!business) return;
    setEmitiendo(order.id);
    try {
      const res = await fetch('/api/sri/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Error emitiendo factura'); return; }
      if (data.estado === 'autorizada') toast.success(`Factura autorizada — ${data.numeroAutorizacion?.slice(-8)}`);
      else if (data.estado === 'en_proceso') toast.success('Enviada al SRI, en proceso');
      else toast.error(`Rechazada: ${data.errores?.join(', ')}`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Error de conexión');
    } finally {
      setEmitiendo(null);
    }
  };

  if (loadingBusiness || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        <span className="text-sm">Cargando facturas...</span>
      </div>
    );
  }

  const q = search.toLowerCase();
  const filtered = orders.filter(o =>
    String(o.numero_pedido).includes(q) ||
    (o.factura?.numero_secuencial ?? '').includes(q) ||
    (o.factura?.receptor_num_doc ?? o.datos_facturacion?.num_doc ?? '').includes(q) ||
    (o.factura?.receptor_razon_social ?? o.datos_facturacion?.razon_social ?? '').toLowerCase().includes(q) ||
    o.cliente_nombre.toLowerCase().includes(q)
  );

  const autorizadas = orders.filter(o => o.factura?.estado === 'autorizada').length;
  const pendientes = orders.filter(o => !o.factura || o.factura.estado === 'rechazada').length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 text-[11px] font-mono-tech border border-brand-500/30 mb-2">
            <Receipt className="w-3 h-3" /> Facturación Electrónica SRI
          </div>
          <h1 className="text-xl font-display font-black text-white">Facturas Electrónicas</h1>
        </div>

        {!hasSriConfig && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300 flex items-start gap-2 max-w-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>Configura tu certificado SRI en <strong>Configuración → SRI</strong> para emitir facturas.</span>
          </div>
        )}
      </div>

      {/* Stats compactas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: orders.length, color: 'text-white' },
          { label: 'Autorizadas', value: autorizadas, color: 'text-emerald-400' },
          { label: 'Pendientes', value: pendientes, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0B0F1B] border border-white/10 rounded-2xl p-4">
            <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-mono-tech font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar por número, RUC, nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0F1B] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>

      {/* Lista de facturas */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm bg-[#0B0F1B] rounded-2xl border border-white/5">
          {orders.length === 0 ? 'Ningún cliente ha solicitado factura aún.' : 'Sin resultados.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const f = order.factura;
            const df = order.datos_facturacion;

            const numDoc = f?.receptor_num_doc ?? df?.num_doc ?? '—';
            const razonSocial = f?.receptor_razon_social ?? df?.razon_social ?? order.cliente_nombre;
            const tipoDoc = f?.receptor_tipo_doc ?? df?.tipo_doc ?? 'CEDULA';
            const total = f?.total ?? order.total;
            const subtotal = f?.subtotal_sin_impuestos;
            const iva = f?.iva;
            const fechaEmision = f?.fecha_emision
              ? new Date(f.fecha_emision).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
              : new Date(order.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
            const numFactura = f?.numero_secuencial ?? '—';
            const isEmitiendo = emitiendo === order.id;
            const yaAutorizada = f?.estado === 'autorizada';
            const enProceso = f?.estado === 'en_proceso';

            return (
              <div key={order.id} className="bg-[#0B0F1B] border border-white/10 rounded-2xl overflow-hidden">

                {/* Cabecera: número factura + estado + acción */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <div className="shrink-0">
                    {f ? <EstadoIcon estado={f.estado} /> : <FileText className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-tech font-black text-white text-sm">
                        {f ? numFactura : `Pedido #${String(order.numero_pedido).padStart(4, '0')}`}
                      </span>
                      {f ? <EstadoBadge estado={f.estado} /> : (
                        <span className="text-[10px] text-slate-500 font-mono-tech border border-white/10 px-2 py-0.5 rounded-full">SIN EMITIR</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{fechaEmision}</p>
                  </div>
                  <div className="shrink-0">
                    {yaAutorizada && f?.ride_pdf_url ? (
                      <a
                        href={f.ride_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs text-white font-display font-bold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir RIDE
                      </a>
                    ) : enProceso ? null : !yaAutorizada ? (
                      <button
                        onClick={() => emitirFactura(order)}
                        disabled={isEmitiendo || !hasSriConfig || !df}
                        title={!df ? 'El cliente no completó sus datos de facturación' : undefined}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-display font-bold transition-colors"
                      >
                        {isEmitiendo
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Emitiendo</>
                          : <><Zap className="w-3.5 h-3.5" /> {f?.estado === 'rechazada' ? 'Reintentar' : 'Emitir Factura'}</>
                        }
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Cuerpo: datos fiscales + autorización */}
                <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">

                  {/* Receptor */}
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">{tipoDoc}</p>
                    <p className="text-xs font-mono-tech font-bold text-white">{numDoc}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{razonSocial}</p>
                  </div>

                  {/* Totales */}
                  <div className="flex items-start gap-6">
                    {subtotal != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Subtotal</p>
                        <p className="text-xs font-mono-tech text-slate-300">{formatCurrency(subtotal)}</p>
                      </div>
                    )}
                    {iva != null && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">IVA</p>
                        <p className="text-xs font-mono-tech text-slate-300">{formatCurrency(iva)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Total</p>
                      <p className="text-sm font-mono-tech font-black text-white">{formatCurrency(total)}</p>
                    </div>
                  </div>

                  {/* Clave de acceso */}
                  {f?.clave_acceso && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Clave de Acceso</p>
                      <p className="text-[11px] font-mono-tech text-slate-400 break-all">{f.clave_acceso}</p>
                    </div>
                  )}

                  {/* Número de autorización */}
                  {f?.numero_autorizacion && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Número de Autorización SRI</p>
                      <p className="text-[11px] font-mono-tech text-emerald-400 break-all">{f.numero_autorizacion}</p>
                      {f.fecha_autorizacion && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Autorizada el {new Date(f.fecha_autorizacion).toLocaleString('es-EC')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Errores */}
                  {f?.errores && f.errores.length > 0 && (
                    <div className="sm:col-span-2 bg-rose-500/5 border border-rose-500/20 rounded-xl p-2.5 space-y-1">
                      {f.errores.map((e, i) => (
                        <p key={i} className="text-[11px] text-rose-300 flex items-start gap-1.5">
                          <XCircle className="w-3 h-3 shrink-0 mt-0.5" /> {e}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Sin datos de facturación */}
                  {!f && !df && (
                    <div className="sm:col-span-2 flex items-center gap-2 text-[11px] text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      El cliente solicitó factura pero no completó sus datos de facturación.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
