import Link from 'next/link';
import {
  ShoppingBag,
  ShieldCheck,
  Zap,
  Printer,
  CreditCard,
  ArrowRight,
  Store,
  Sparkles,
  CheckCircle2,
  Bell,
  Database,
  QrCode,
  Smartphone,
  Globe,
  TrendingUp,
  Lock,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans flex flex-col relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background Ambient Mesh Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] glow-ambient-emerald pointer-events-none opacity-80"></div>
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] glow-ambient-amber pointer-events-none opacity-60"></div>
      <div className="absolute bottom-10 -left-20 w-[600px] h-[600px] glow-ambient-emerald pointer-events-none opacity-40"></div>

      {/* Floating Header Landing */}
      <div className="w-full px-4 md:px-8 pt-4 pb-2 sticky top-0 z-50">
        <header className="max-w-7xl mx-auto glass-panel rounded-2xl border border-white/10 px-4 md:px-6 py-3.5 flex items-center justify-between shadow-2xl backdrop-blur-xl bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-display font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/25">
              Y
            </div>
            <div>
              <span className="font-display font-black text-xl text-white tracking-tight flex items-center gap-1">
                Yapi<span className="text-emerald-400">.ec</span>
              </span>
              <span className="block text-[9px] text-emerald-400/90 font-mono-tech font-bold uppercase tracking-wider">
                Infraestructura SaaS de Pedidos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/login"
              className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-display font-bold border border-slate-700/80 transition-all cursor-pointer hover:border-slate-600 active:scale-95"
            >
              Login Negocio
            </Link>
            <Link
              href="/super-admin/login"
              className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-display font-bold border border-emerald-500/30 transition-all cursor-pointer hidden sm:inline-flex items-center gap-1.5 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Super Admin
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-20 text-center flex flex-col items-center justify-center relative z-10">
        <div className="space-y-6 max-w-4xl">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono-tech font-bold shadow-xl backdrop-blur-md">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Plataforma de Pedidos de Alta Velocidad para Cuenca & Ecuador</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-white leading-[1.06]">
            Tu catálogo digital <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              sin comisiones por venta.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Digitaliza tu menú o tienda en minutos. Recibe pedidos instantáneos directamente a WhatsApp, cobros con PayPhone / Deuna! e impresión de comandas de cocina en vivo.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/admin/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-display font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer border border-emerald-400/40"
            >
              <Store className="w-5 h-5" />
              <span>Crear mi catálogo gratis</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/restaurante-tiopamba"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-display font-bold text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:border-slate-600"
            >
              <span>Ver Demo Tienda Tiopamba</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>

        {/* Social Proof & Metrics Bar */}
        <div className="w-full pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto p-4 rounded-2xl bg-slate-950/60 border border-white/10 glass-panel shadow-2xl">
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="block font-display font-black text-white text-base">0% Comisiones</span>
                <span className="text-[11px] text-slate-400">Conserva el 100% de tus ventas</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-left">
                <span className="block font-display font-black text-white text-base">&lt; 1 Segundo</span>
                <span className="text-[11px] text-slate-400">Carga ultra-rápida móvil</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-left">
                <span className="block font-display font-black text-white text-base">100% Seguro</span>
                <span className="text-[11px] text-slate-400">Resguardo local de clientes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 text-left">
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-white">Catálogo Digital & QR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menú HD con fotos comprimidas instantáneas. Genera códigos QR listos para imprimir en mesas, vitrinas y flyers.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-white">Pagos & WhatsApp Directo</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cobros con tarjetas Visa/Mastercard mediante PayPhone, transferencias con subida de comprobante o pedidos automatizados a WhatsApp.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl hover:border-amber-500/40 hover:shadow-amber-500/10 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-white">Monitor KDS & Comandas POS</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pantalla digital (KDS) interactiva de cocina con alertas sonoras en vivo e impresión directa de tickets a cualquier ticketera térmica.
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Precios & Add-ons */}
        <div className="w-full pt-20 pb-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-mono-tech border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Precios Transparentes — Sin Sorpresas
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight">
              Paga solo por lo que tu negocio necesita
            </h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Comienza con nuestro Plan Base Core y personaliza tu plataforma agregando únicamente los módulos adicionales (Add-ons) que tu local requiere.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            {/* Plan Base */}
            <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 flex flex-col justify-between shadow-xl hover:border-white/20 transition-all">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono-tech font-bold uppercase border border-slate-700">
                  Plan Base Core
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-black text-white">$15</span>
                    <span className="text-slate-400 text-xs font-medium">/ mes</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Ideal para cafeterías, restaurantes y locales en digitalización.</p>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-white/10">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Catálogo Digital HD ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Código QR para mesas & vitrina</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pedidos ilimitados a WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pagos manuales (Deuna!, Transferencia, Efectivo)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-300">0% Comisiones por venta</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/admin/login"
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-display font-bold text-xs text-center border border-slate-700 transition-all block cursor-pointer active:scale-95"
              >
                Comenzar con Plan Base $15/mes
              </Link>
            </div>

            {/* Módulos Add-ons A la Carta */}
            <div className="glass-card p-8 rounded-3xl border border-emerald-500/30 space-y-6 flex flex-col justify-between shadow-2xl relative overflow-hidden bg-slate-950/80 hover:border-emerald-500/50 transition-all">
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

                <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-slate-200 flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                      Pasarela PayPhone Tarjetas
                    </span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$9/mes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-slate-200 flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                      Monitor de Cocina KDS & Alertas
                    </span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$7/mes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-slate-200 flex items-center gap-2.5">
                      <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                      Impresión Comandas POS
                    </span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$7/mes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                    <span className="text-slate-200 flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                      Reportes, Ventas & CRM (Excel)
                    </span>
                    <span className="font-mono-tech font-bold text-emerald-400">+$5/mes</span>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/login"
                className="w-full py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-display font-bold text-xs text-center border border-emerald-500/40 transition-all block cursor-pointer active:scale-95"
              >
                Personalizar mis Add-ons
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500 glass-panel relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Infraestructura Segura Multi-Empresa Ecuador</span>
          </div>
          <p>© 2026 Yapi.ec — Plataforma de Pedidos para Cuenca y Ecuador. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
