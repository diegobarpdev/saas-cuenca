'use client';

import React, { use, useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Coins,
  ExternalLink,
  Receipt,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { formatCurrency } from '@/lib/utils/currency';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminDashboardAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { business, loading: loadingBusiness } = useAdminBusiness(slug);

  const [stats, setStats] = useState({
    ventasHoy: 0,
    pedidosHoy: 0,
    ticketPromedio: 0,
    clientesNuevosHoy: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!business) return;
      setLoading(true);
      try {
        const supabase = createClient();
        // Medianoche en Ecuador (UTC-5), independiente del timezone del browser
        const EC_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC-5 en ms
        const nowInEc = new Date(Date.now() - EC_OFFSET_MS); // hora actual expresada como UTC-5
        nowInEc.setUTCHours(0, 0, 0, 0);                     // truncar a medianoche Ecuador
        const startOfDay = new Date(nowInEc.getTime() + EC_OFFSET_MS); // volver a UTC real

        // 1. Pedidos de hoy
        const { data: ordersToday } = await supabase
          .from('orders')
          .select('*')
          .eq('business_id', business.id)
          .gte('created_at', startOfDay.toISOString())
          .order('created_at', { ascending: false });

        const ordersList = ordersToday || [];
        const ventasSum = ordersList.reduce((acc: number, o: any) => acc + Number(o.total || 0), 0);
        const count = ordersList.length;

        setStats({
          ventasHoy: ventasSum,
          pedidosHoy: count,
          ticketPromedio: count > 0 ? ventasSum / count : 0,
          clientesNuevosHoy: new Set(ordersList.map((o: any) => o.cliente_telefono || o.cliente_nombre)).size,
        });

        setRecentOrders(ordersList.slice(0, 5));

        // 2. Productos más vendidos (solo de este negocio)
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('nombre_producto, cantidad, subtotal, orders!inner(business_id)')
          .eq('orders.business_id', business.id)
          .limit(500);

        if (orderItems) {
          const map: Record<string, { nombre: string; cantidad: number; total: number }> = {};
          orderItems.forEach((item: any) => {
            if (!item.nombre_producto) return;
            if (!map[item.nombre_producto]) {
              map[item.nombre_producto] = { nombre: item.nombre_producto, cantidad: 0, total: 0 };
            }
            map[item.nombre_producto].cantidad += item.cantidad;
            map[item.nombre_producto].total += Number(item.subtotal || 0);
          });
          const sorted = Object.values(map).sort((a, b) => b.cantidad - a.cantidad).slice(0, 4);
          setTopProducts(sorted);
        }

        // 3. Últimos 3 meses de billing
        const now = new Date();
        const meses: string[] = [];
        for (let i = 0; i < 3; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        const { data: billing } = await supabase
          .from('billing_records')
          .select('mes, monto, estado, metodo_pago, fecha_pago')
          .eq('business_id', business.id)
          .in('mes', meses)
          .order('mes', { ascending: false });
        setBillingRecords(billing || []);
      } catch (err) {
        console.error('Error cargando analíticas:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [business?.id]);

  if (loadingBusiness || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <TrendingUp className="w-8 h-8 text-brand-400 animate-pulse" />
        <p className="text-slate-400 text-xs font-medium">Cargando métricas del negocio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0B0F1B] border border-white/10 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono-tech font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
            Resumen de Negocio
          </span>
          <h1 className="text-xl font-display font-black text-white tracking-tight mt-2">
            Panel Ejecutivo — {business?.nombre}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analítica de ventas, volumen de pedidos y productos más vendidos en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl border border-white/15 hover:border-white/30 text-white font-display font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver Catálogo</span>
          </Link>
          <Link
            href={`/${slug}/caja`}
            className="px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-display font-black text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ir a Caja POS</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B0F1B] border border-white/10 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Ventas de Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono-tech font-black text-brand-400">
            {formatCurrency(stats.ventasHoy)}
          </p>
          <span className="text-[10px] text-slate-500">Ingresos brutos del día</span>
        </div>

        <div className="bg-[#0B0F1B] border border-white/10 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Pedidos Procesados</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono-tech font-black text-white">
            {stats.pedidosHoy}
          </p>
          <span className="text-[10px] text-slate-500">Pedidos registrados hoy</span>
        </div>

        <div className="bg-[#0B0F1B] border border-white/10 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono-tech font-black text-amber-400">
            {formatCurrency(stats.ticketPromedio)}
          </p>
          <span className="text-[10px] text-slate-500">Ticket promedio por pedido</span>
        </div>

        <div className="bg-[#0B0F1B] border border-white/10 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Clientes Atendidos</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono-tech font-black text-purple-400">
            {stats.clientesNuevosHoy}
          </p>
          <span className="text-[10px] text-slate-500">Clientes únicos hoy</span>
        </div>
      </div>

      {/* Tablas de resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimos pedidos */}
        <div className="lg:col-span-2 bg-[#0B0F1B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Últimos Pedidos del Día
            </h3>
            <Link href={`/${slug}/caja`} className="text-xs font-bold text-brand-400 hover:underline flex items-center gap-1">
              Ver todas en Caja POS <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No hay pedidos registrados hoy.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-white/5 text-xs">
                  <div>
                    <span className="font-mono-tech font-bold text-brand-400">#{String(ord.numero_pedido).padStart(4, '0')}</span>
                    <span className="text-white font-medium ml-2">{ord.cliente_nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      {ord.tipo_entrega === 'consumo_en_mesa' || ord.tipo_entrega === 'mesa' ? `Mesa ${ord.numero_mesa || ''}` : ord.tipo_entrega === 'para_llevar' || ord.tipo_entrega === 'retiro_local' ? 'Llevar' : 'Domicilio'}
                    </span>
                    <span className="font-mono-tech font-bold text-white">{formatCurrency(ord.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-[#0B0F1B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Top Productos
          </h3>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Sin datos de productos.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-white/5 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{prod.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{prod.cantidad} unidades vendidas</p>
                  </div>
                  <span className="font-mono-tech font-bold text-amber-400 shrink-0">{formatCurrency(prod.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Mis Pagos de Suscripción */}
      <div className="bg-[#0B0F1B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="font-display font-black text-sm text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-brand-400" />
          Pagos de Suscripción
        </h3>

        {billingRecords.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Sin registros de pago disponibles.</p>
        ) : (
          <div className="space-y-2">
            {billingRecords.map((rec) => {
              const mesLabel = (() => {
                const [y, m] = rec.mes.split('-');
                return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
              })();
              const estadoBadge = {
                pagado: { label: 'Pagado', icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                pendiente: { label: 'Pendiente', icon: AlertCircle, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                vencido: { label: 'Vencido', icon: XCircle, cls: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
              }[rec.estado as string] ?? { label: rec.estado, icon: AlertCircle, cls: 'text-slate-400 bg-slate-800 border-slate-700' };
              const BadgeIcon = estadoBadge.icon;
              return (
                <div key={rec.mes} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-white/5 text-xs">
                  <div>
                    <span className="font-medium text-white capitalize">{mesLabel}</span>
                    {rec.metodo_pago && (
                      <span className="text-[10px] text-slate-500 font-mono ml-2">· {rec.metodo_pago}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tech font-bold text-white">{formatCurrency(rec.monto)}</span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${estadoBadge.cls}`}>
                      <BadgeIcon className="w-3 h-3" />
                      {estadoBadge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
