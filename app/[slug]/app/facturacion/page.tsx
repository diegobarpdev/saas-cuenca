'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import {
  Receipt, RefreshCw, FileText, AlertCircle,
  XCircle, ShieldCheck, Timer, Search, Zap,
  Loader2, Printer, RotateCcw, FileX, Plus, X,
} from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from '@/lib/utils/toast';
import type { FacturaElectronica, NotaCredito, ComprobanteRetencion, BusinessSriConfig } from '@/lib/types/database';

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
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>([]);
  const [retenciones, setRetenciones] = useState<ComprobanteRetencion[]>([]);
  const [sriConfigFull, setSriConfigFull] = useState<BusinessSriConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [emitiendo, setEmitiendo] = useState<string | null>(null);
  const [hasSriConfig, setHasSriConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'facturas' | 'notas-credito' | 'retenciones'>('facturas');

  // Modal NC state
  const [ncModal, setNcModal] = useState<{ facturaId: string; facturaNum: string } | null>(null);
  const [ncMotivo, setNcMotivo] = useState('');
  const [emitiendoNC, setEmitiendoNC] = useState(false);

  // Modal Retención state
  const [retModal, setRetModal] = useState(false);
  const [retForm, setRetForm] = useState({
    tipoDoc: 'RUC' as 'RUC' | 'CEDULA' | 'PASAPORTE',
    numDoc: '',
    razonSocial: '',
    email: '',
    periodoFiscal: '',
    numDocSustento: '',
    fechaDocSustento: '',
    numAutDocSustento: '',
    totalSinImpuestos: '',
    importeTotal: '',
    retenciones: [{ tipo: 'renta', codigo: '1', codigoRetencion: '303', baseImponible: '', tarifa: '8', valorRetenido: '' }] as any[],
  });
  const [emitiendoRet, setEmitiendoRet] = useState(false);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data: ordersData }, { data: facturas }, { data: sriConfig }, { data: ncs }, { data: rets }] = await Promise.all([
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
          .select('*')
          .eq('business_id', business.id)
          .eq('activo', true)
          .maybeSingle(),
        supabase
          .from('notas_credito')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('comprobantes_retencion')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setHasSriConfig(!!sriConfig);
      setSriConfigFull(sriConfig as BusinessSriConfig ?? null);
      setNotasCredito((ncs ?? []) as NotaCredito[]);
      setRetenciones((rets ?? []) as ComprobanteRetencion[]);

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

  const emitirNotaCredito = async () => {
    if (!business || !ncModal || !ncMotivo.trim()) return;
    setEmitiendoNC(true);
    try {
      const res = await fetch('/api/sri/nota-credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId: ncModal.facturaId, motivo: ncMotivo.trim(), businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Error emitiendo NC'); return; }
      if (data.estado === 'autorizada') toast.success(`Nota de crédito autorizada — ${data.numeroAutorizacion?.slice(-8)}`);
      else if (data.estado === 'en_proceso') toast.success('NC enviada al SRI, en proceso');
      else toast.error(`NC rechazada: ${data.errores?.join(', ')}`);
      setNcModal(null);
      setNcMotivo('');
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Error de conexión');
    } finally {
      setEmitiendoNC(false);
    }
  };

  const emitirRetencionHandler = async () => {
    if (!business) return;
    const { tipoDoc, numDoc, razonSocial, periodoFiscal, numDocSustento, fechaDocSustento, numAutDocSustento, totalSinImpuestos, importeTotal, retenciones: retLines } = retForm;
    if (!numDoc || !razonSocial || !periodoFiscal || !numDocSustento || !fechaDocSustento || !totalSinImpuestos || !importeTotal) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    setEmitiendoRet(true);
    try {
      const res = await fetch('/api/sri/retencion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          sujetoRetenido: { tipoDoc, numDoc, razonSocial, email: retForm.email || undefined },
          periodoFiscal,
          numDocSustento,
          fechaDocSustento,
          numAutDocSustento,
          totalSinImpuestos: parseFloat(totalSinImpuestos),
          importeTotal: parseFloat(importeTotal),
          retenciones: retLines.map((r: any) => ({
            tipo: r.tipo,
            codigo: r.codigo,
            codigoRetencion: r.codigoRetencion,
            baseImponible: parseFloat(r.baseImponible),
            tarifa: parseFloat(r.tarifa),
            valorRetenido: parseFloat(r.valorRetenido),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Error emitiendo retención'); return; }
      if (data.estado === 'autorizada') toast.success(`Retención autorizada — ${data.numeroAutorizacion?.slice(-8)}`);
      else if (data.estado === 'en_proceso') toast.success('Retención enviada al SRI, en proceso');
      else toast.error(`Retención rechazada: ${data.errores?.join(', ')}`);
      setRetModal(false);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Error de conexión');
    } finally {
      setEmitiendoRet(false);
    }
  };

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
  const isAgente = !!(sriConfigFull?.es_agente_retencion);

  const tabStats = activeTab === 'facturas'
    ? [
        { label: 'Total', value: orders.length, color: 'text-white' },
        { label: 'Autorizadas', value: autorizadas, color: 'text-emerald-400' },
        { label: 'Pendientes', value: pendientes, color: 'text-amber-400' },
      ]
    : activeTab === 'notas-credito'
    ? [
        { label: 'Total', value: notasCredito.length, color: 'text-white' },
        { label: 'Autorizadas', value: notasCredito.filter(n => n.estado === 'autorizada').length, color: 'text-emerald-400' },
        { label: 'Rechazadas', value: notasCredito.filter(n => n.estado === 'rechazada').length, color: 'text-rose-400' },
      ]
    : [
        { label: 'Total', value: retenciones.length, color: 'text-white' },
        { label: 'Autorizadas', value: retenciones.filter(r => r.estado === 'autorizada').length, color: 'text-emerald-400' },
        { label: 'Rechazadas', value: retenciones.filter(r => r.estado === 'rechazada').length, color: 'text-rose-400' },
      ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 text-[11px] font-mono-tech border border-brand-500/30 mb-2">
            <Receipt className="w-3 h-3" /> Facturación Electrónica SRI
          </div>
          <h1 className="text-xl font-display font-black text-white">Facturación Electrónica</h1>
        </div>

        {!hasSriConfig && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300 flex items-start gap-2 max-w-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>Configura tu certificado SRI en <strong>Configuración → SRI</strong> para emitir facturas.</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#0B0F1B] border border-white/10 rounded-2xl p-1 w-fit">
        {(['facturas', 'notas-credito', ...(hasSriConfig && isAgente ? ['retenciones'] : [])] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold transition-all ${activeTab === tab ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {tab === 'facturas' ? 'Facturas' : tab === 'notas-credito' ? 'Notas de Crédito' : 'Retenciones'}
          </button>
        ))}
      </div>

      {/* Stats compactas */}
      <div className="grid grid-cols-3 gap-3">
        {tabStats.map(s => (
          <div key={s.label} className="bg-[#0B0F1B] border border-white/10 rounded-2xl p-4">
            <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-mono-tech font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TAB: FACTURAS */}
      {activeTab === 'facturas' && (<>
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
            // Extraer estab + pto_emision de la clave de acceso (pos 24-26 y 27-29)
            // para armar el número completo 001-001-000000001
            const numFactura = (() => {
              if (!f) return '—';
              const ca = f.clave_acceso ?? '';
              if (ca.length >= 39) {
                return `${ca.slice(24, 27)}-${ca.slice(27, 30)}-${ca.slice(30, 39)}`;
              }
              return f.numero_secuencial ?? '—';
            })();
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
                  <div className="shrink-0 flex items-center gap-2">
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
                    {yaAutorizada && f?.estado !== 'anulada' && hasSriConfig && (
                      <button
                        onClick={() => { setNcModal({ facturaId: f!.id, facturaNum: numFactura }); setNcMotivo(''); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 font-display font-bold transition-colors"
                        title="Emitir Nota de Crédito"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> NC
                      </button>
                    )}
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
      </>)}

      {/* TAB: NOTAS DE CRÉDITO */}
      {activeTab === 'notas-credito' && (
        <div className="space-y-2">
          {notasCredito.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-[#0B0F1B] rounded-2xl border border-white/5">
              No hay notas de crédito emitidas aún. Usa el botón <strong>NC</strong> en una factura autorizada.
            </div>
          ) : notasCredito.map(nc => (
            <div key={nc.id} className="bg-[#0B0F1B] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <div className="shrink-0">
                  <EstadoIcon estado={nc.estado} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono-tech font-black text-white text-sm">{nc.numero_secuencial}</span>
                    <EstadoBadge estado={nc.estado} />
                    <span className="text-[10px] text-slate-500 font-mono-tech">NC</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(nc.fecha_emision).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {nc.ride_pdf_url && (
                  <a href={nc.ride_pdf_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs text-white font-display font-bold transition-colors">
                    <Printer className="w-3.5 h-3.5" /> RIDE
                  </a>
                )}
              </div>
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Receptor</p>
                  <p className="text-xs font-mono-tech font-bold text-white">{nc.receptor_num_doc ?? '—'}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{nc.receptor_razon_social ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Factura modificada</p>
                  <p className="text-xs font-mono-tech text-slate-300">{nc.num_doc_modificado}</p>
                  <p className="text-xs text-slate-400 mt-0.5 italic">{nc.motivo}</p>
                </div>
                <div className="flex items-start gap-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Total NC</p>
                    <p className="text-sm font-mono-tech font-black text-white">{formatCurrency(nc.total)}</p>
                  </div>
                </div>
                {nc.numero_autorizacion && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Núm. Autorización SRI</p>
                    <p className="text-[11px] font-mono-tech text-emerald-400 break-all">{nc.numero_autorizacion}</p>
                  </div>
                )}
                {nc.errores && nc.errores.length > 0 && (
                  <div className="sm:col-span-2 bg-rose-500/5 border border-rose-500/20 rounded-xl p-2.5 space-y-1">
                    {nc.errores.map((e, i) => (
                      <p key={i} className="text-[11px] text-rose-300 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 shrink-0 mt-0.5" /> {e}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: RETENCIONES */}
      {activeTab === 'retenciones' && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              onClick={() => setRetModal(true)}
              disabled={!hasSriConfig}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-white text-xs font-display font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Retención
            </button>
          </div>
          {retenciones.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-[#0B0F1B] rounded-2xl border border-white/5">
              No hay comprobantes de retención emitidos aún.
            </div>
          ) : retenciones.map(ret => (
            <div key={ret.id} className="bg-[#0B0F1B] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <div className="shrink-0"><EstadoIcon estado={ret.estado} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono-tech font-black text-white text-sm">{ret.numero_secuencial}</span>
                    <EstadoBadge estado={ret.estado} />
                    <span className="text-[10px] text-slate-500 border border-white/10 px-2 py-0.5 rounded-full font-mono-tech">RET</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(ret.fecha_emision).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })} · Período {ret.periodo_fiscal}
                  </p>
                </div>
                {ret.ride_pdf_url && (
                  <a href={ret.ride_pdf_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs text-white font-display font-bold transition-colors">
                    <Printer className="w-3.5 h-3.5" /> RIDE
                  </a>
                )}
              </div>
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Proveedor</p>
                  <p className="text-xs font-mono-tech font-bold text-white">{ret.proveedor_num_doc}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{ret.proveedor_razon_social}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Doc. Sustento</p>
                  <p className="text-xs font-mono-tech text-slate-300">{ret.num_doc_sustento}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(ret.fecha_doc_sustento).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Total Retenido</p>
                  <p className="text-sm font-mono-tech font-black text-white">{formatCurrency(ret.total_retenido)}</p>
                </div>
                {ret.numero_autorizacion && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold mb-0.5">Núm. Autorización SRI</p>
                    <p className="text-[11px] font-mono-tech text-emerald-400 break-all">{ret.numero_autorizacion}</p>
                  </div>
                )}
                {ret.errores && ret.errores.length > 0 && (
                  <div className="sm:col-span-2 bg-rose-500/5 border border-rose-500/20 rounded-xl p-2.5 space-y-1">
                    {ret.errores.map((e, i) => (
                      <p key={i} className="text-[11px] text-rose-300 flex items-start gap-1.5">
                        <XCircle className="w-3 h-3 shrink-0 mt-0.5" /> {e}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Emitir Nota de Crédito */}
      {ncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0D1322] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-black text-white flex items-center gap-2">
                <FileX className="w-4 h-4 text-rose-400" /> Emitir Nota de Crédito
              </h2>
              <button onClick={() => setNcModal(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Factura a anular: <span className="font-mono-tech font-bold text-white">{ncModal.facturaNum}</span>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1.5">
                Motivo de la nota de crédito *
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Devolución de mercadería / Error en facturación / Anulación de venta"
                value={ncMotivo}
                onChange={e => setNcMotivo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setNcModal(null)}
                className="flex-1 py-2.5 rounded-2xl border border-white/10 text-slate-400 text-sm font-display font-bold hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={emitirNotaCredito}
                disabled={emitiendoNC || !ncMotivo.trim()}
                className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-display font-bold transition-colors"
              >
                {emitiendoNC ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Emitiendo...</span> : 'Emitir Nota de Crédito'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Retención */}
      {retModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0D1322] border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display font-black text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-400" /> Nueva Retención
              </h2>
              <button onClick={() => setRetModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Proveedor */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Tipo Doc</label>
                  <select value={retForm.tipoDoc} onChange={e => setRetForm(p => ({ ...p, tipoDoc: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white focus:outline-none">
                    <option value="RUC">RUC</option>
                    <option value="CEDULA">Cédula</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Num. Doc Proveedor</label>
                  <input type="text" value={retForm.numDoc} onChange={e => setRetForm(p => ({ ...p, numDoc: e.target.value }))}
                    placeholder="RUC / Cédula" maxLength={13}
                    className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Razón Social Proveedor</label>
                <input type="text" value={retForm.razonSocial} onChange={e => setRetForm(p => ({ ...p, razonSocial: e.target.value }))}
                  placeholder="Nombre del proveedor"
                  className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Email (opcional)</label>
                  <input type="email" value={retForm.email} onChange={e => setRetForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="proveedor@ejemplo.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Período Fiscal</label>
                  <input type="text" value={retForm.periodoFiscal} onChange={e => setRetForm(p => ({ ...p, periodoFiscal: e.target.value }))}
                    placeholder="MM/YYYY"
                    className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none font-mono" />
                </div>
              </div>

              {/* Doc sustento */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-display font-black text-slate-300 mb-3">Documento Sustento</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Num. Factura</label>
                    <input type="text" value={retForm.numDocSustento} onChange={e => setRetForm(p => ({ ...p, numDocSustento: e.target.value }))}
                      placeholder="001-001-000000001"
                      className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Fecha Emisión Doc</label>
                    <input type="date" value={retForm.fechaDocSustento} onChange={e => setRetForm(p => ({ ...p, fechaDocSustento: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Núm. Autorización</label>
                    <input type="text" value={retForm.numAutDocSustento} onChange={e => setRetForm(p => ({ ...p, numAutDocSustento: e.target.value }))}
                      placeholder="49 dígitos"
                      className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Total Sin Impuestos</label>
                    <input type="number" step="0.01" value={retForm.totalSinImpuestos} onChange={e => setRetForm(p => ({ ...p, totalSinImpuestos: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tech font-bold text-slate-400 uppercase mb-1">Importe Total (con IVA)</label>
                    <input type="number" step="0.01" value={retForm.importeTotal} onChange={e => setRetForm(p => ({ ...p, importeTotal: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl bg-[#070A11] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none font-mono" />
                  </div>
                </div>
              </div>

              {/* Retenciones */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-display font-black text-slate-300 mb-3">Retenciones</p>
                {retForm.retenciones.map((r: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
                    <div>
                      <label className="block text-[10px] font-mono-tech font-bold text-slate-500 uppercase mb-1">Tipo</label>
                      <select value={r.tipo} onChange={e => {
                        const v = e.target.value;
                        setRetForm(p => ({ ...p, retenciones: p.retenciones.map((x, i) => i === idx ? { ...x, tipo: v, codigo: v === 'renta' ? '1' : '2' } : x) }));
                      }} className="w-full px-2 py-1.5 rounded-lg bg-[#070A11] border border-white/10 text-xs text-white focus:outline-none">
                        <option value="renta">Renta</option>
                        <option value="iva">IVA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono-tech font-bold text-slate-500 uppercase mb-1">Código</label>
                      <input type="text" value={r.codigoRetencion} onChange={e => setRetForm(p => ({ ...p, retenciones: p.retenciones.map((x, i) => i === idx ? { ...x, codigoRetencion: e.target.value } : x) }))}
                        placeholder="303"
                        className="w-full px-2 py-1.5 rounded-lg bg-[#070A11] border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono-tech font-bold text-slate-500 uppercase mb-1">Base</label>
                      <input type="number" step="0.01" value={r.baseImponible} onChange={e => setRetForm(p => ({ ...p, retenciones: p.retenciones.map((x, i) => i === idx ? { ...x, baseImponible: e.target.value } : x) }))}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 rounded-lg bg-[#070A11] border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono-tech font-bold text-slate-500 uppercase mb-1">%</label>
                      <input type="number" step="0.01" value={r.tarifa} onChange={e => setRetForm(p => ({ ...p, retenciones: p.retenciones.map((x, i) => i === idx ? { ...x, tarifa: e.target.value } : x) }))}
                        placeholder="8"
                        className="w-full px-2 py-1.5 rounded-lg bg-[#070A11] border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none font-mono" />
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <label className="block text-[10px] font-mono-tech font-bold text-slate-500 uppercase mb-1">Valor</label>
                        <input type="number" step="0.01" value={r.valorRetenido} onChange={e => setRetForm(p => ({ ...p, retenciones: p.retenciones.map((x, i) => i === idx ? { ...x, valorRetenido: e.target.value } : x) }))}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 rounded-lg bg-[#070A11] border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none font-mono" />
                      </div>
                      {retForm.retenciones.length > 1 && (
                        <button onClick={() => setRetForm(p => ({ ...p, retenciones: p.retenciones.filter((_, i) => i !== idx) }))}
                          className="mt-5 text-rose-400 hover:text-rose-300 px-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setRetForm(p => ({ ...p, retenciones: [...p.retenciones, { tipo: 'renta', codigo: '1', codigoRetencion: '', baseImponible: '', tarifa: '', valorRetenido: '' }] }))}
                  className="text-xs text-brand-400 hover:text-brand-300 font-display font-bold flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3 h-3" /> Agregar retención
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setRetModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-white/10 text-slate-400 text-sm font-display font-bold hover:border-white/20 transition-colors">
                Cancelar
              </button>
              <button onClick={emitirRetencionHandler} disabled={emitiendoRet}
                className="flex-1 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-display font-bold transition-colors">
                {emitiendoRet ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Emitiendo...</span> : 'Emitir Retención'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
