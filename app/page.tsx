import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Zap, Printer, CreditCard, ArrowRight, Store, Sparkles, CheckCircle2, PhoneCall } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Background Ambient Mesh Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] glow-ambient-emerald pointer-events-none"></div>
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] glow-ambient-amber pointer-events-none"></div>

      {/* Header Landing */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-display font-black text-slate-950 text-2xl shadow-lg shadow-emerald-500/25">
              Y
            </div>
            <div>
              <span className="font-display font-black text-2xl text-white tracking-tight flex items-center gap-1">
                Yapi<span className="text-emerald-400">.ec</span>
              </span>
              <span className="block text-[10px] text-emerald-400/90 font-mono-tech font-bold uppercase tracking-wider">
                Pedidos & Catálogo SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-display font-bold border border-slate-800 transition-all"
            >
              Login Negocio
            </Link>
            <Link
              href="/super-admin/login"
              className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-display font-bold border border-purple-500/30 transition-all hidden sm:inline-block"
            >
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center space-y-8 flex-1 flex flex-col justify-center items-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-emerald-500/30 text-emerald-300 text-xs font-mono-tech font-bold shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>La plataforma de pedidos N° 1 para Cuenca y Ecuador</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white leading-tight max-w-4xl tracking-tight">
          Transforma tu negocio con <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Yapi</span>
        </h1>

        <p className="text-base md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed">
          Catálogo digital interactivo, pedidos en vivo sin caos de WhatsApp, cobros con PayPhone / Deuna! e impresión de comanda térmica POS.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md pt-4">
          <Link
            href="/restaurante-tiopamba"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-base shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all border border-emerald-400/40"
          >
            <Store className="w-5 h-5" />
            <span>Ver Tienda Demo Yapi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-display font-bold text-base border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <span>Ver Panel del Negocio</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full pt-16 text-left">
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 shadow-xl hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-base text-white">Pedidos en Vivo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recibe notificaciones en tiempo real con alerta sonora y actualización instantánea en pantalla.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 shadow-xl hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-base text-white">PayPhone & Deuna!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pagos con tarjetas de crédito/débito en Ecuador, transferencias y subida de comprobantes.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 shadow-xl hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-base text-white">Comanda Térmica POS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Imprime el ticket de comanda directo en tu impresora de 58mm o 80mm en 1-clic.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 shadow-xl hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-base text-white">Facturación Ecuador</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recopilación automática de RUC / Cédula, Razón Social y Correo para facturación legal del SRI.
            </p>
          </div>
        </div>

        {/* Sección de Precios & Add-ons */}
        <div className="w-full pt-20 pb-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-mono-tech border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Precios Transparentes — 0% Comisiones
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight">
              Paga solo por lo que tu negocio necesita
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Comienza con nuestro Plan Base y personaliza tu plataforma agregando únicamente los módulos (Add-ons) que tu cocina o local utiliza.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
            {/* Plan Base */}
            <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono-tech font-bold uppercase">
                  Plan Base Core
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-black text-white">$15</span>
                    <span className="text-slate-400 text-xs font-medium">/ mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Ideal para cafeterías, panaderías y locales en digitalización.</p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/10">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Catálogo Digital HD ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Código QR para mesas & vitrina</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pedidos ilimitados a WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pagos manuales (Deuna!, Transferencia, Efectivo)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-300">0% Comisiones por venta</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/admin/login"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs text-center border border-slate-700 transition-all block"
              >
                Comenzar con Plan Base
              </Link>
            </div>

            {/* Módulos Add-ons A la Carta */}
            <div className="glass-card p-8 rounded-3xl border border-emerald-500/30 space-y-6 flex flex-col justify-between shadow-2xl relative overflow-hidden bg-slate-950/60">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono-tech font-bold uppercase border border-emerald-500/30">
                  Módulos Add-ons (A la carta)
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-display font-black text-white">Suma desde +$5</span>
                    <span className="text-slate-400 text-xs font-medium">/ mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Agrega módulos opcionales al Plan Base según crezca tu local.</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between border border-white/5">
                    <span className="text-slate-200">💳 Pasarela PayPhone Tarjetas</span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$9/mes</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between border border-white/5">
                    <span className="text-slate-200">🔔 Alertas Sonoras Cocina</span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$7/mes</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between border border-white/5">
                    <span className="text-slate-200">net Impresión Comandas POS</span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$7/mes</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between border border-white/5">
                    <span className="text-slate-200">📊 Base de Datos CRM / Export</span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$5/mes</span>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/login"
                className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-display font-bold text-xs text-center border border-emerald-500/40 transition-all block"
              >
                Personalizar Add-ons
              </Link>
            </div>

            {/* Pack Full Combo */}
            <div className="glass-card p-8 rounded-3xl border border-amber-500/40 space-y-6 flex flex-col justify-between shadow-2xl relative overflow-hidden bg-gradient-to-b from-amber-500/10 to-transparent">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-mono-tech font-bold uppercase border border-amber-500/30">
                  <Sparkles className="w-3 h-3" /> Pack Recomendado — Full Combo
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-black text-white">$35</span>
                    <span className="text-slate-400 text-xs font-medium">/ mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Todo incluido. Ahorras frente a comprar cada add-on individual.</p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/10">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Todo del Plan Base ($15)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>PayPhone + Alertas Cocina + Impresión POS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>CRM Exportación de clientes + Reportes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Soporte Técnico prioritario</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/admin/login"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-xs text-center shadow-lg shadow-amber-500/20 transition-all block"
              >
                Activar Full Combo $35/mes
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 glass-panel">
        <p>© 2026 Yapi.ec — Plataforma de Pedidos Multi-Empresa para Cuenca y Ecuador. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
