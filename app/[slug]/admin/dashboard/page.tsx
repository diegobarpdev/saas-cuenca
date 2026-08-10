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
  Coins
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (!business) return;
      setLoading(true);
      try {
        const supabase = createClient();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // 1. Pedidos de hoy
        const { data: ordersToday } = await supabase
          .from('orders')
          .select('*')
          .eq('business_id', business.id)
          .gte('created_at', startOfDay.toISOString())
          .order('created_at', { ascending: false });

        const ordersList = ordersToday || [];
        const ventasSum = ordersList.reduce((acc, o) => acc + Number(o.total || 0), 0);
        const count = ordersList.length;

        setStats({
          ventasHoy: ventasSum,
          pedidosHoy: count,
          ticketPromedio: count > 0 ? ventasSum / count : 0,
          clientesNuevosHoy: new Set(ordersList.map(o => o.cliente_telefono || o.cliente_nombre)).size,
        });

        setRecentOrders(ordersList.slice(0, 5));

        // 2. Productos más vendidos
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('nombre_producto, cantidad, subtotal')
          .order('cantidad', { ascending: false })
          .limit(20);

        if (orderItems) {
          const map: Record<string, { nombre: string; cantidad: number; total: number }> = {};
          orderItems.forEach((item: any) => {
            if (!map[item.nombre_producto]) {
              map[item.nombre_producto] = { nombre: item.nombre_producto, cantidad: 0, total: 0 };
            }
            map[item.nombre_producto].cantidad += item.cantidad;
            map[item.nombre_producto].total += Number(item.subtotal || 0);
          });
          const sorted = Object.values(map).sort((a, b) => b.cantidad - a.cantidad).slice(0, 4);
          setTopProducts(sorted);
        }
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
        <TrendingUp className="w-8 h-8 text-emerald-400 animate-pulse" />
        <p className="text-slate-400 text-xs font-medium">Cargando métricas del negocio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0B0F1B] border border-white/10 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono-tech font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
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
            href={`/${slug}/caja`}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
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
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono-tech font-black text-emerald-400">
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
          <span className="text-[10px] text-slate-500">Comandas registradas hoy</span>
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
          <span className="text-[10px] text-slate-500">Gasto promedio por comanda</span>
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
              <Clock className="w-4 h-4 text-emerald-400" />
              Últimas Comandas del Día
            </h3>
            <Link href={`/${slug}/caja`} className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
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
                    <span className="font-mono-tech font-bold text-emerald-400">#{String(ord.numero_pedido).padStart(4, '0')}</span>
                    <span className="text-white font-medium ml-2">{ord.cliente_nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      {ord.tipo_entrega}
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
    </div>
  );
}
