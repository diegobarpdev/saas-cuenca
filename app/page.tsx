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
              P
            </div>
            <div>
              <span className="font-display font-black text-2xl text-white tracking-tight flex items-center gap-1">
                Piku<span className="text-emerald-400">.ec</span>
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
          Transforma tu negocio con <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Piku</span> 🚀
        </h1>

        <p className="text-base md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed">
          Catálogo digital interactivo, pedidos en vivo sin caos de WhatsApp, cobros con PayPhone / Deuna! e impresión de comanda térmica POS.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md pt-4">
          <Link
            href="/panaderia-cuenca"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-base shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all border border-emerald-400/40"
          >
            <Store className="w-5 h-5" />
            <span>Ver Tienda Demo Piku</span>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 glass-panel">
        <p>© 2026 Piku.ec — Plataforma de Pedidos Multi-Empresa para Cuenca y Ecuador. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
