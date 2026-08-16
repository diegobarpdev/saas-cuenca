'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PackageX, Plus, X, ChevronDown } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { createClient } from '@/lib/supabase/client';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import type { Merma, MermaMotivo, Product } from '@/lib/types/database';

const supabase = createClient();

const MOTIVOS: { value: MermaMotivo; label: string }[] = [
  { value: 'accidente', label: 'Accidente / Caída' },
  { value: 'caducidad', label: 'Caducidad / Descomposición' },
  { value: 'preparacion', label: 'Error de preparación' },
  { value: 'robo',       label: 'Robo / Pérdida' },
  { value: 'otro',       label: 'Otro' },
];

const UNIDADES = ['unidades', 'porciones', 'kg', 'g', 'litros', 'ml'];

const MOTIVO_COLORS: Record<MermaMotivo, string> = {
  accidente:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  caducidad:   'bg-red-500/10 text-red-400 border-red-500/20',
  preparacion: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  robo:        'bg-purple-500/10 text-purple-400 border-purple-500/20',
  otro:        'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MermasPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { business, loading } = useAdminBusiness(slug);

  const [mermas, setMermas] = useState<Merma[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Formulario
  const [productId, setProductId] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [unidad, setUnidad] = useState('unidades');
  const [motivo, setMotivo] = useState<MermaMotivo>('accidente');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    loadData();
  }, [business]);

  async function loadData() {
    setLoadingData(true);
    const [mermasRes, productosRes] = await Promise.all([
      supabase
        .from('mermas')
        .select('*')
        .eq('business_id', business!.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('products')
        .select('id, nombre, unidad')
        .eq('business_id', business!.id)
        .eq('disponible', true)
        .order('nombre'),
    ]);
    if (mermasRes.data) setMermas(mermasRes.data as Merma[]);
    if (productosRes.data) setProductos(productosRes.data as Product[]);
    setLoadingData(false);
  }

  function resetForm() {
    setProductId('');
    setNombreManual('');
    setCantidad('1');
    setUnidad('unidades');
    setMotivo('accidente');
    setNotas('');
  }

  async function handleGuardar() {
    const nombreFinal = productId
      ? productos.find(p => p.id === productId)?.nombre ?? nombreManual
      : nombreManual.trim();

    if (!nombreFinal) { toast.error('Indica el producto o nombre del ítem'); return; }
    if (!cantidad || isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0) {
      toast.error('Cantidad inválida'); return;
    }

    setSaving(true);
    const sessionRaw = typeof window !== 'undefined' ? localStorage.getItem('kaltiro_admin_session') : null;
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;

    const { error } = await supabase.from('mermas').insert({
      business_id: business!.id,
      product_id: productId || null,
      nombre_producto: nombreFinal,
      cantidad: parseFloat(cantidad),
      unidad,
      motivo,
      notas: notas.trim() || null,
      registrado_por: session?.user?.nombre ?? null,
    });

    setSaving(false);
    if (error) { toast.error('Error al registrar merma'); return; }
    toast.success('Merma registrada');
    setShowModal(false);
    resetForm();
    loadData();
  }

  // Resumen del mes actual
  const ahora = new Date();
  const mermasMes = mermas.filter(m => {
    const d = new Date(m.created_at);
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  });

  const totalPorMotivo = MOTIVOS.map(m => ({
    ...m,
    count: mermasMes.filter(x => x.motivo === m.value).length,
  })).filter(m => m.count > 0);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business?.has_mermas) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <PackageX className="w-12 h-12 text-slate-600" />
        <p className="text-slate-400 text-sm max-w-xs">
          El módulo de Control de Mermas no está activado para este negocio.
          Actívalo desde el Marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-white">Control de Mermas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bajas por daño, caducidad o pérdida</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-500/90 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar baja
        </button>
      </div>

      {/* Resumen del mes */}
      {mermasMes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Este mes</p>
            <p className="text-2xl font-bold text-white mt-1">{mermasMes.length}</p>
            <p className="text-xs text-slate-500">registros</p>
          </div>
          {totalPorMotivo.slice(0, 3).map(m => (
            <div key={m.value} className="p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
              <p className="text-xs text-slate-500 truncate">{m.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{m.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {mermas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center border border-white/[0.06] rounded-2xl bg-[#0D1117]">
          <PackageX className="w-8 h-8 text-slate-600" />
          <p className="text-slate-500 text-sm">Aún no hay mermas registradas</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Motivo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cantidad</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {mermas.map(m => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{m.nombre_producto}</p>
                    {m.notas && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.notas}</p>}
                    {m.registrado_por && (
                      <p className="text-xs text-slate-600 mt-0.5">por {m.registrado_por}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${MOTIVO_COLORS[m.motivo]}`}>
                      {MOTIVOS.find(x => x.value === m.motivo)?.label ?? m.motivo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono-tech">
                    {m.cantidad} <span className="text-slate-500 text-xs">{m.unidad}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs hidden md:table-cell whitespace-nowrap">
                    {formatFecha(m.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0B0F1B] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-display font-bold text-white">Registrar baja / merma</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Producto */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Producto
                </label>
                <div className="relative">
                  <select
                    value={productId}
                    onChange={e => { setProductId(e.target.value); setNombreManual(''); }}
                    className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white pr-8 focus:outline-none focus:border-brand-500/40"
                  >
                    <option value="">— Escribir nombre manualmente —</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                {!productId && (
                  <input
                    type="text"
                    placeholder="Nombre del ítem..."
                    value={nombreManual}
                    onChange={e => setNombreManual(e.target.value)}
                    className="mt-2 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40"
                  />
                )}
              </div>

              {/* Cantidad + Unidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Cantidad</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Unidad</label>
                  <div className="relative">
                    <select
                      value={unidad}
                      onChange={e => setUnidad(e.target.value)}
                      className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white pr-8 focus:outline-none focus:border-brand-500/40"
                    >
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Motivo</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOTIVOS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMotivo(m.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        motivo === m.value
                          ? MOTIVO_COLORS[m.value]
                          : 'border-white/[0.06] text-slate-500 hover:border-white/[0.12]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Notas <span className="text-slate-600 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: se cayó la bandeja completa..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40 resize-none"
                />
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {saving ? 'Guardando...' : 'Registrar baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
