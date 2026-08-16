'use client';

import React, { use, useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, Volume2, Printer, Download, Globe, Sparkles, CheckCircle2, ShieldCheck, RefreshCw, MessageSquare, Receipt, PackageX } from 'lucide-react';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { toast } from '@/lib/utils/toast';

export default function AdminMarketplacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { business, loading } = useAdminBusiness(slug);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('kaltiro_simulated_role') || 'dueño';
      if (role !== 'dueño') {
        toast.error('Acceso denegado: solo el Administrador (Dueño) puede acceder al Marketplace.');
        const _s = JSON.parse(localStorage.getItem('kaltiro_admin_session') || '{}');
        window.location.href = `/${_s?.business?.slug || ''}/caja`;
      } else {
        setAuthorized(true);
      }
    }
  }, []);

  if (loading || !business || !authorized) {
    return (
      <div className="p-12 text-center text-slate-400 font-display text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        <span>Cargando Marketplace de Módulos Kaltiro.com...</span>
      </div>
    );
  }

  const getWhatsAppLink = (moduleName: string, price: string) => {
    const text = `Hola! Soy de ${business.nombre} (/${business.slug}). Me gustaría solicitar la activación del módulo Add-on de ${moduleName} (${price}) en Kaltiro.com.`;
    return `https://wa.me/${business.telefono_whatsapp}?text=${encodeURIComponent(text)}`;
  };

  const planLabel = business.plan === 'basico' ? 'BASE ($15/mes)' : business.plan === 'pro' ? 'PRO ($30/mes)' : 'TRIAL (Gratuito)';

  const modules = [
    {
      id: 'payphone',
      title: 'Pasarela PayPhone Tarjetas',
      price: '+$9 / mes',
      icon: CreditCard,
      active: !!business.has_payphone,
      description: 'Permite a tus clientes pagar directamente en tu catálogo con tarjeta de crédito o débito (Visa / Mastercard) de cualquier banco de Ecuador.',
      benefits: [
        'Acepta Visa, Mastercard y App PayPhone',
        'El dinero cae directamente a tu cuenta bancaria',
        'Confirmación automática del estado del pedido',
      ],
    },
    {
      id: 'live_kitchen',
      title: 'Monitor de Cocina Digital (KDS) & Alertas',
      price: '+$7 / mes',
      icon: Volume2,
      active: !!business.has_live_kitchen,
      description: 'Sincroniza tu cocina con una pantalla interactiva (KDS). Recibe alertas sonoras en vivo y gestiona el flujo de platos (Pendiente ➔ Cocina ➔ Listo) para cero retrasos.',
      benefits: [
        'Alertas sonoras instantáneas con sonido de timbre fuerte',
        'Consola KDS interactiva para controlar tiempos y despachos',
        'Sincronización automática multidispositivo en tiempo real',
      ],
    },
    {
      id: 'pos_printing',
      title: 'Impresión Térmica POS Comandas',
      price: '+$7 / mes',
      icon: Printer,
      active: !!business.has_pos_printing,
      description: 'Formatea e imprime automáticamente los tickets de comanda de cocina para ticketeras de 58mm o 80mm en 1 solo clic.',
      benefits: [
        'Compatible con impresoras térmicas de cocina',
        'Detalle formateado de productos y observaciones',
        'Ahorra tiempo de digitación manual',
      ],
    },
    {
      id: 'crm_export',
      title: 'Reportes de Ventas & Exportación Excel (CRM)',
      price: '+$5 / mes',
      icon: Download,
      active: !!business.has_crm_export,
      description: 'Descarga reportes completos de tus pedidos, historial de ventas para contabilidad y el directorio de contactos de clientes en formato CSV/Excel.',
      benefits: [
        'Exportación en 1-clic de ventas y facturación a Excel',
        'Historial de pedidos por fecha, estado y método de pago',
        'Directorio CRM de clientes (WhatsApp, Dirección, RUC) para marketing',
      ],
    },
    {
      id: 'facturacion_sri',
      title: 'Facturación Electrónica SRI',
      price: '+$12 / mes',
      icon: Receipt,
      active: !!business.has_facturacion_sri,
      description: 'Emite facturas electrónicas válidas ante el SRI directamente desde tu panel de administración, sin necesidad de sistemas externos.',
      benefits: [
        'Facturas electrónicas autorizadas por el SRI al instante',
        'Envío automático de la factura al cliente por email',
        'Registros y comprobantes integrados en tu historial de pedidos',
      ],
    },
    {
      id: 'mermas',
      title: 'Control de Mermas',
      price: '+$5 / mes',
      icon: PackageX,
      active: !!business.has_mermas,
      description: 'Registra y lleva el historial de bajas por daño, caducidad o accidente. Mantén trazabilidad de tus pérdidas sin afectar la caja ni las ventas.',
      benefits: [
        'Registra bajas por accidente, caducidad, preparación o robo',
        'Historial completo con producto, cantidad y responsable',
        'Resumen mensual por tipo de merma para tomar decisiones',
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-20">
      {/* Header Marketplace */}
      <div className="bg-[#0D1322] p-6 rounded-3xl border border-white/10 glass-panel shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-mono-tech border border-brand-500/30">
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" /> Marketplace Oficial de Módulos Kaltiro.com
          </div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight mt-2">
            Módulos Add-ons para {business.nombre}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza y extiende las funciones de tu plataforma agregando únicamente lo que tu cocina o negocio utiliza.
          </p>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-mono-tech font-bold block">Tu Plan Actual</span>
          <span className="text-base font-display font-black text-brand-400">{planLabel}</span>
          <span className="block text-[11px] text-brand-300 font-mono-tech">Incluye Caja POS & 0% Comisiones</span>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className={`p-6 rounded-3xl border glass-card flex flex-col justify-between space-y-5 transition-all relative overflow-hidden shadow-xl ${
                mod.active
                  ? 'bg-gradient-to-b from-brand-500/10 to-slate-950/80 border-brand-500/40'
                  : 'bg-slate-950/70 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white shadow-md">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono-tech font-bold border ${
                    mod.active ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 flex items-center gap-1.5' : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}>
                    {mod.active ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                        <span>ACTIVO EN TU PLAN</span>
                      </>
                    ) : mod.price}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-extrabold text-base text-white">{mod.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mod.description}</p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  {mod.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {mod.active ? (
                  <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-display font-bold text-center flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Módulo Habilitado en tu Cuenta</span>
                  </div>
                ) : (
                  <a
                    href={getWhatsAppLink(mod.title, mod.price)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-display font-bold text-xs text-center shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 border border-brand-400/30"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Solicitar Módulo ({mod.price})</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
