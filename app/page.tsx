import Image from 'next/image';
import Link from 'next/link';
import CatalogMockup from '@/components/CatalogMockup';
import { AddonsCarousel } from '@/components/AddonsCarousel';
import {
  ArrowRight,
  CheckCircle2,
  QrCode,
  Smartphone,
  BellRing,
  ChefHat,
  Wallet,
  PartyPopper,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FLOW_STEPS = [
  {
    icon: QrCode,
    title: 'Pones el QR en la mesa o vitrina',
    desc: 'Imprimís un código QR único de tu catálogo y lo ponés donde pasan tus clientes. Sin apps que descargar, sin registro.',
  },
  {
    icon: Smartphone,
    title: 'El cliente ve tu menú y elige',
    desc: 'Abre tu catálogo desde el celular: fotos, categorías, precios. Elige lo que quiere y arma el pedido.',
  },
  {
    icon: BellRing,
    title: 'El pedido llega a tu pantalla — en segundos',
    desc: 'Recibes una alerta sonora. El pedido aparece completo: qué pidió, cómo paga, si es para mesa, retiro o domicilio.',
  },
  {
    icon: ChefHat,
    title: 'Cocina lo prepara',
    desc: 'La pantalla de cocina muestra los pedidos activos en orden de llegada. Cambiás el estado con un toque para avisar al cliente.',
  },
  {
    icon: Wallet,
    title: 'El cliente paga',
    desc: 'Tarjeta de débito/crédito (PayPhone), transferencia con comprobante o efectivo. Tú eliges qué métodos ofreces.',
  },
  {
    icon: PartyPopper,
    title: 'El 100% de esa venta es tuyo',
    desc: 'Ningún porcentaje para nadie. Sin comisión oculta. La misma tarifa de $29.99/mes sin importar cuánto vendiste.',
    highlight: true,
  },
];


// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 font-sans overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#080B11]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/isotipo.png"
              alt="Kaltiro"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="font-display font-black text-white text-lg tracking-tight">
              Kaltiro<span className="text-brand-400">.com</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:inline"
            >
              Ver demo
            </Link>
            <Link
              href="/admin/login"
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-display font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -top-20 -left-32 w-[700px] h-[600px] rounded-full opacity-100"
          style={{ background: 'radial-gradient(ellipse at center, rgba(254,106,70,0.10) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute top-1/2 right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(254,106,70,0.06) 0%, transparent 70%)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Copy */}
          <div className="space-y-7 order-1">
            <div className="inline-flex items-center gap-2.5 border border-brand-500/40 rounded-full px-4 py-2 bg-brand-500/5">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shrink-0" />
              <span className="text-brand-400 text-sm font-mono-tech font-bold tracking-tight">
                $29.99/mes · 0% de comisión por venta
              </span>
            </div>

            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-display font-black text-white leading-[1.04] tracking-tight">
              Tu restaurante recibe pedidos directos.{' '}
              <span className="text-brand-400">Tú te quedas con el 100%.</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              Catálogo con código QR, pedidos que llegan directo a tu WhatsApp y cobros integrados. Sin intermediarios. Sin porcentaje por cada venta.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                href="/demo"
                className="px-7 py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-display font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-brand-500/30"
              >
                Ver demo en vivo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin/registro"
                className="px-7 py-4 rounded-xl border border-white/15 hover:border-white/30 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                Comenzar gratis
              </Link>
            </div>

            <div className="flex items-center gap-5 pt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                Sin tarjeta al inicio
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                Listo en minutos
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                Ecuador 🇪🇨
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="order-2 flex justify-center lg:justify-end pt-4 lg:pt-0">
            <CatalogMockup />
          </div>
        </div>
      </section>

      {/* ── MATH HOOK ───────────────────────────────────────────────────── */}
      <section className="relative border-y border-white/[0.06]"
        style={{ background: 'linear-gradient(180deg, #0D1117 0%, #090C14 100%)' }}>
        {/* Subtle glow top-center */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse at top, rgba(254,106,70,0.06) 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-5 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            <div>
              <p className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-5">
                El problema con los intermediarios
              </p>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white leading-tight mb-5">
                En $3,000 de ventas al mes, las apps de delivery se quedan con{' '}
                <span className="text-red-400">$450 a $900.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Comisiones del 15% al 30% en cada pedido. Más el costo de los anuncios para aparecer arriba. Y encima, los datos de tus clientes son de ellos, no tuyos.
              </p>
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border border-red-500/20 bg-red-950/20">
                <p className="text-red-400 font-mono-tech text-[11px] uppercase tracking-widest mb-4">
                  Apps de delivery
                </p>
                <p className="text-4xl font-display font-black text-red-400 mb-1 leading-none">
                  -$450
                  <span className="text-2xl"> a</span>
                  <br />
                  -$900
                </p>
                <p className="text-slate-500 text-xs mt-2 mb-5">cada mes, solo en comisiones</p>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li>15%–30% por cada pedido</li>
                  <li>Los clientes son de la plataforma</li>
                  <li>Dependés de su algoritmo</li>
                </ul>
              </div>

              <div className="relative p-6 rounded-2xl border border-brand-500/30 bg-brand-950/20 overflow-hidden">
                {/* Inner glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{ background: 'radial-gradient(ellipse at top right, rgba(254,106,70,0.12) 0%, transparent 60%)' }} />
                <p className="relative text-brand-400 font-mono-tech text-[11px] uppercase tracking-widest mb-4">
                  Kaltiro
                </p>
                <p className="relative text-4xl font-display font-black text-brand-400 mb-1 leading-none">
                  $20
                  <br />
                  fijos
                </p>
                <p className="relative text-slate-400 text-xs mt-2 mb-5">al mes, vendas lo que vendas</p>
                <ul className="relative space-y-2 text-sm text-slate-400">
                  <li>0% de comisión por venta</li>
                  <li>Los clientes son tuyos</li>
                  <li>Tu catálogo, tu WhatsApp, tu marca</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FLOW ────────────────────────────────────────────────────────── */}
      <section className="relative max-w-6xl mx-auto px-5 py-20 lg:py-28">
        {/* Centered ambient glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(254,106,70,0.05) 0%, transparent 65%)' }} />

        <div className="relative mb-14">
          <p className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-4">
            Flujo completo
          </p>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white leading-tight max-w-2xl">
            De la mesa de tu cliente a tu bolsillo — en 6 pasos
          </h2>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className={`relative p-6 rounded-2xl border transition-colors overflow-hidden ${
                  step.highlight
                    ? 'border-brand-500/40 bg-brand-950/25'
                    : 'border-white/[0.07] bg-[#0D1117]'
                }`}
              >
                {step.highlight && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{ background: 'radial-gradient(ellipse at top left, rgba(254,106,70,0.15) 0%, transparent 60%)' }} />
                )}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                      step.highlight ? 'bg-brand-500/20' : 'bg-white/[0.06]'
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 ${step.highlight ? 'text-brand-400' : 'text-slate-400'}`}
                      size={18}
                    />
                  </div>
                  <span
                    className={`font-mono-tech text-xs font-bold pt-2 ${
                      step.highlight ? 'text-brand-500' : 'text-slate-600'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3
                  className={`relative font-display font-bold text-base mt-4 mb-2 leading-snug ${
                    step.highlight ? 'text-brand-400' : 'text-white'
                  }`}
                >
                  {step.title}
                </h3>
                <p className="relative text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE ─────────────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06]"
        style={{ background: 'linear-gradient(180deg, #0A0D15 0%, #080B11 100%)' }}>
        {/* Glow behind dashboard image */}
        <div className="pointer-events-none absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(254,106,70,0.10) 0%, transparent 65%)' }} />

        <div className="relative max-w-6xl mx-auto px-5 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Dashboard mockup */}
            <div className="relative flex justify-center lg:justify-start">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-2xl blur-2xl opacity-20"
                style={{ background: 'radial-gradient(ellipse at center, rgba(254,106,70,0.6) 0%, transparent 70%)' }} />
              <Image
                src="/mockup-dashboard.jpg"
                alt="Panel de pedidos en tiempo real de Kaltiro.com — vista del negocio"
                width={680}
                height={383}
                className="relative rounded-2xl w-full shadow-2xl shadow-black/60 border border-white/[0.07]"
              />
            </div>

            {/* Panel features */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-4">
                  Panel del negocio
                </p>
                <h2 className="text-3xl sm:text-4xl font-display font-black text-white leading-tight mb-4">
                  Tus pedidos, en tiempo real. Sin complicaciones.
                </h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  Cada pedido que entra aparece en tu pantalla con alerta sonora. Ves quién pidió, qué pidió, cómo paga y a dónde se lo llevás. Un toque para actualizar el estado. Un toque para imprimir la comanda.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  'Alerta sonora en cada nuevo pedido',
                  'Estado del pedido en vivo para el cliente',
                  'Comprobante de pago visible en el panel',
                  'Datos de facturación para el SRI cuando aplique',
                  'Historial completo de pedidos y ventas',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING + ADDONS ────────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Top glow */}
        <div className="pointer-events-none absolute top-0 right-1/4 w-[600px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(254,106,70,0.07) 0%, transparent 65%)' }} />

        {/* Headline + plan card */}
        <div className="relative max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Left — headline */}
            <div>
              <p className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest mb-4">
                Precio
              </p>
              <h2 className="text-4xl sm:text-5xl font-display font-black text-white leading-tight mb-5">
                Un plan.<br />Un precio.<br />
                <span className="text-brand-400">Sin sorpresas.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed max-w-md">
                Empezás con el Plan Base que cubre todo lo que necesita un restaurante o cafetería para operar digitalmente. Si querés agregar pantalla de cocina, cobros con tarjeta o impresión de comandas, los sumás por separado.
              </p>
            </div>

            {/* Right — pricing card */}
            <div className="relative p-8 rounded-2xl border border-brand-500/20 bg-[#0D1117] overflow-hidden">
              {/* Inner top glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: 'radial-gradient(ellipse at top, rgba(254,106,70,0.08) 0%, transparent 55%)' }} />
              <div className="relative flex items-start justify-between mb-6">
                <div>
                  <p className="text-slate-500 text-xs font-mono-tech uppercase tracking-widest mb-2">Plan Base</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-display font-black text-white">$29.99</span>
                    <span className="text-slate-500 text-sm">/mes</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">Sin comisión. Sin contrato.</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-[11px] font-mono-tech font-bold">
                  0% comisión
                </div>
              </div>

              <ul className="relative space-y-3 pt-6 border-t border-white/[0.06] mb-6">
                {[
                  'Catálogo digital con fotos ilimitado',
                  'Código QR para mesas, vitrina o delivery',
                  'Pedidos directos a tu WhatsApp',
                  'Pagos por transferencia, Deuna! o efectivo',
                  'Sistema de caja y comandas de cocina incluido',
                  '0% de comisión por cada venta',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/admin/registro"
                className="relative w-full py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-display font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-brand-500/25 block text-center"
              >
                Comenzar con Plan Base
              </Link>
            </div>
          </div>
        </div>

        {/* Addons carousel — full width, parte del mismo plan */}
        <div className="relative mt-14">
          <p className="text-slate-500 text-xs font-mono-tech uppercase tracking-widest max-w-6xl mx-auto px-5 mb-5">
            Módulos opcionales
          </p>
          <AddonsCarousel />
        </div>
      </section>

      {/* ── DEMO CTA ────────────────────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06] overflow-hidden">
        {/* Dramatic radial gradient background */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(254,106,70,0.13) 0%, transparent 70%)' }} />
        {/* Bottom fade to footer */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to bottom, transparent, #080B11)' }} />

        <div className="relative max-w-6xl mx-auto px-5 py-20 lg:py-28">
          <div className="max-w-2xl mx-auto text-center space-y-7">
            <p className="text-xs font-mono-tech text-slate-500 uppercase tracking-widest">
              Demo real — sin registro
            </p>
            <h2 className="text-4xl sm:text-5xl font-display font-black text-white leading-tight">
              Mirá cómo se ve para un restaurante real
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Explora el catálogo de demostración. Puedes navegar el menú, agregar productos y ver el flujo completo — exactamente como lo vería tu cliente.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/demo"
                className="px-8 py-4 rounded-xl bg-white text-slate-950 font-display font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer shadow-xl shadow-white/10"
              >
                Abrir catálogo demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin/registro"
                className="px-8 py-4 rounded-xl border border-white/15 hover:border-white/30 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                Crear mi catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/isotipo.png"
              alt="Kaltiro"
              width={24}
              height={24}
              className="w-6 h-6 rounded-md object-contain"
            />
            <span>Kaltiro.com — Cuenca y Ecuador</span>
          </div>
          <p>© 2026 Kaltiro.com · Todos los derechos reservados</p>
          {/* Discrete super-admin access */}
          <Link
            href="/super-admin/login"
            className="text-slate-800 hover:text-slate-600 text-xs transition-colors"
            aria-label="Acceso administrativo"
          >
            ·
          </Link>
        </div>
      </footer>

    </div>
  );
}
