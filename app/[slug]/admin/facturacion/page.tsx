'use client';

import React, { use, useState, useEffect } from 'react';
import { Receipt, RefreshCw, FileText, Copy, CheckCircle2, AlertCircle, Clock, Search, ExternalLink } from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from '@/lib/utils/toast';

interface OrderWithBilling {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  cliente_telefono: string;
  total: number;
  created_at: string;
  estado: string;
  datos_facturacion: {
    tipo_doc: 'RUC' | 'CEDULA' | 'PASAPORTE';
    num_doc: string;
    razon_social: string;
    email: string;
    direccion: string;
  } | null;
}

export default function AdminFacturacionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { business, loading: loadingBusiness } = useAdminBusiness(slug);

  const [orders, setOrders] = useState<OrderWithBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!business) return;
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('orders')
          .select('id, numero_pedido, cliente_nombre, cliente_telefono, total, created_at, estado, datos_facturacion')
          .eq('business_id', business.id)
          .eq('requiere_factura', true)
          .order('created_at', { ascending: false })
          .limit(100);
        setOrders((data as OrderWithBilling[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [business?.id]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (loadingBusiness || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        <span className="text-sm">Cargando solicitudes de factura...</span>
      </div>
    );
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      String(o.numero_pedido).includes(q) ||
      o.cliente_nombre.toLowerCase().includes(q) ||
      (o.datos_facturacion?.num_doc || '').includes(q) ||
      (o.datos_facturacion?.razon_social || '').toLowerCase().includes(q)
    );
  });

  const tipoDocLabel = (tipo: string) => {
    if (tipo === 'RUC') return 'RUC';
    if (tipo === 'CEDULA') return 'Cédula';
    return 'Pasaporte';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#0D1322] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-mono-tech border border-brand-500/30">
            <Receipt className="w-3.5 h-3.5" /> Facturación Electrónica SRI
          </div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight mt-2">
            Solicitudes de Factura
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pedidos en los que el cliente solicitó factura con sus datos fiscales. Emite la factura desde tu sistema SRI y regístrala manualmente.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 font-display font-bold max-w-xs shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Integración SRI próximamente</span>
          </div>
          <p className="text-[11px] text-amber-400/80 font-normal">
            Por ahora, usa estos datos para emitir la factura electrónica directamente en el portal del SRI.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B0F1B] border border-white/10 p-5 rounded-3xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total solicitudes</span>
          <p className="text-2xl font-mono-tech font-black text-white">{orders.length}</p>
        </div>
        <div className="bg-[#0B0F1B] border border-white/10 p-5 rounded-3xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Con RUC</span>
          <p className="text-2xl font-mono-tech font-black text-brand-400">
            {orders.filter((o) => o.datos_facturacion?.tipo_doc === 'RUC').length}
          </p>
        </div>
        <div className="bg-[#0B0F1B] border border-white/10 p-5 rounded-3xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Con Cédula</span>
          <p className="text-2xl font-mono-tech font-black text-slate-300">
            {orders.filter((o) => o.datos_facturacion?.tipo_doc !== 'RUC').length}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar por pedido, nombre, RUC o razón social..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0B0F1B] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm bg-[#0B0F1B] rounded-3xl border border-white/5">
          {orders.length === 0
            ? 'Ningún cliente ha solicitado factura aún.'
            : 'Sin resultados para tu búsqueda.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const df = order.datos_facturacion;
            const fecha = new Date(order.created_at).toLocaleDateString('es-EC', {
              day: '2-digit', month: 'short', year: 'numeric',
            });
            return (
              <div
                key={order.id}
                className="bg-[#0B0F1B] border border-white/10 rounded-3xl p-5 space-y-4"
              >
                {/* Row superior */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech font-black text-brand-400 text-sm">
                          #{String(order.numero_pedido).padStart(4, '0')}
                        </span>
                        <span className="text-white font-display font-bold text-sm">{order.cliente_nombre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{fecha}</span>
                        <span>·</span>
                        <span>{order.cliente_telefono}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tech font-black text-white text-lg">{formatCurrency(order.total)}</span>
                    <span className="px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[10px] font-mono-tech font-bold uppercase">
                      {order.estado}
                    </span>
                  </div>
                </div>

                {/* Datos fiscales */}
                {df ? (
                  <div className="bg-slate-950/70 border border-white/5 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Tipo + Número doc */}
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold block mb-1">
                        {tipoDocLabel(df.tipo_doc)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{df.num_doc}</span>
                        <button
                          onClick={() => copyToClipboard(df.num_doc, `${order.id}-doc`)}
                          className="text-slate-500 hover:text-brand-400 transition-colors"
                        >
                          {copiedId === `${order.id}-doc`
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Razón social */}
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold block mb-1">Razón Social</span>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white text-xs truncate">{df.razon_social}</span>
                        <button
                          onClick={() => copyToClipboard(df.razon_social, `${order.id}-rs`)}
                          className="text-slate-500 hover:text-brand-400 transition-colors shrink-0"
                        >
                          {copiedId === `${order.id}-rs`
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold block mb-1">Email</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 text-xs truncate">{df.email}</span>
                        <button
                          onClick={() => copyToClipboard(df.email, `${order.id}-email`)}
                          className="text-slate-500 hover:text-brand-400 transition-colors shrink-0"
                        >
                          {copiedId === `${order.id}-email`
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Dirección */}
                    {df.direccion && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-[10px] text-slate-500 uppercase font-mono-tech font-bold block mb-1">Dirección</span>
                        <span className="text-slate-300 text-xs">{df.direccion}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-3 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    El cliente solicitó factura pero no ingresó datos fiscales.
                  </div>
                )}

                {/* Acción SRI */}
                <div className="flex justify-end">
                  <a
                    href="https://srienlinea.sri.gob.ec"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 font-display font-bold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
                    Emitir en portal SRI
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
