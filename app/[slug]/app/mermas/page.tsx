'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  PackageX, Plus, X, Search, Boxes,
  ArrowDownToLine, SlidersHorizontal, AlertTriangle, Pencil,
} from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { createClient } from '@/lib/supabase/client';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import type { Merma, MermaMotivo, Product, InventarioItem, InventarioMovimiento } from '@/lib/types/database';

const supabase = createClient();

// ── Constantes ────────────────────────────────────────────────────────────────

const MOTIVOS: { value: MermaMotivo; label: string }[] = [
  { value: 'accidente',   label: 'Accidente / Caída' },
  { value: 'caducidad',   label: 'Caducidad / Descomposición' },
  { value: 'preparacion', label: 'Error de preparación' },
  { value: 'robo',        label: 'Robo / Pérdida' },
  { value: 'otro',        label: 'Otro' },
];

const MOTIVO_COLORS: Record<MermaMotivo, string> = {
  accidente:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  caducidad:   'bg-red-500/10 text-red-400 border-red-500/20',
  preparacion: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  robo:        'bg-purple-500/10 text-purple-400 border-purple-500/20',
  otro:        'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const UNIDADES = ['unidades', 'porciones', 'kg', 'g', 'litros', 'ml', 'cajas', 'bolsas'];

const CATEGORIAS = ['Alimentos', 'Bebidas', 'Lácteos', 'Carnes', 'Vegetales', 'Empaques', 'Limpieza', 'Otro'];

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatMoney(n: number) { return n.toFixed(2); }

// ── Combobox con búsqueda ─────────────────────────────────────────────────────

function ProductCombobox({
  productos, value, onChange,
}: {
  productos: Product[];
  value: { id: string; nombre: string; precio: number } | null;
  onChange: (v: { id: string; nombre: string; precio: number } | null, texto: string) => void;
}) {
  const [query, setQuery] = useState(value?.nombre ?? '');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? productos.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()))
    : productos;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar o escribir nombre del producto..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); onChange(null, e.target.value); setOpen(true); }}
          className="w-full pl-8 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40"
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#0F1525] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-500">
              {query.trim() ? `Usar "${query}" como nombre manual` : 'Sin productos'}
            </div>
          ) : filtered.map(p => (
            <button
              key={p.id} type="button"
              onMouseDown={() => { setQuery(p.nombre); onChange({ id: p.id, nombre: p.nombre, precio: p.precio }, p.nombre); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.05] text-left transition-colors"
            >
              <span className="text-sm text-white">{p.nombre}</span>
              <span className="text-xs text-slate-500 font-mono-tech">${formatMoney(p.precio)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Badge de stock ────────────────────────────────────────────────────────────

function StockBadge({ actual, minimo }: { actual: number; minimo: number }) {
  if (actual <= minimo) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono-tech font-bold">
        <AlertTriangle className="w-3 h-3" /> {actual}
      </span>
    );
  }
  if (actual <= minimo * 1.5) {
    return <span className="text-yellow-400 font-mono-tech font-bold text-sm">{actual}</span>;
  }
  return <span className="text-emerald-400 font-mono-tech font-bold text-sm">{actual}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'mermas' | 'inventario';

export default function ControlStockPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { business, loading } = useAdminBusiness(slug);
  const [activeTab, setActiveTab] = useState<Tab>('mermas');

  // ── Estado: Mermas ─────────────────────────────────────────────────────────
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loadingMermas, setLoadingMermas] = useState(true);
  const [showMermaModal, setShowMermaModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; nombre: string; precio: number } | null>(null);
  const [nombreManual, setNombreManual] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [unidad, setUnidad] = useState('unidades');
  const [precioUnitario, setPrecioUnitario] = useState('0.00');
  const [motivo, setMotivo] = useState<MermaMotivo>('accidente');
  const [notas, setNotas] = useState('');
  const [savingMerma, setSavingMerma] = useState(false);

  // ── Estado: Inventario ─────────────────────────────────────────────────────
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loadingInventario, setLoadingInventario] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Form nuevo ítem
  const [itemNombre, setItemNombre] = useState('');
  const [itemCategoria, setItemCategoria] = useState('Alimentos');
  const [itemUnidad, setItemUnidad] = useState('unidades');
  const [itemStockActual, setItemStockActual] = useState('0');
  const [itemStockMinimo, setItemStockMinimo] = useState('0');
  const [itemProveedor, setItemProveedor] = useState('');

  // Form entrada
  const [entradaCantidad, setEntradaCantidad] = useState('1');
  const [entradaNotas, setEntradaNotas] = useState('');

  // Form ajuste
  const [ajusteNuevaCantidad, setAjusteNuevaCantidad] = useState('0');
  const [ajusteNotas, setAjusteNotas] = useState('');

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!business) return;
    loadMermas();
    loadInventario();
  }, [business]);

  async function loadMermas() {
    setLoadingMermas(true);
    const [mermasRes, productosRes] = await Promise.all([
      supabase.from('mermas').select('*').eq('business_id', business!.id)
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('products').select('id, nombre, precio').eq('business_id', business!.id).order('nombre'),
    ]);
    if (mermasRes.data) setMermas(mermasRes.data as Merma[]);
    if (productosRes.data) setProductos(productosRes.data as Product[]);
    setLoadingMermas(false);
  }

  async function loadInventario() {
    setLoadingInventario(true);
    const { data } = await supabase
      .from('inventario_items')
      .select('*')
      .eq('business_id', business!.id)
      .eq('activo', true)
      .order('nombre');
    if (data) setItems(data as InventarioItem[]);
    setLoadingInventario(false);
  }

  // ── Handlers: Mermas ───────────────────────────────────────────────────────

  function resetMermaForm() {
    setSelectedProduct(null); setNombreManual(''); setCantidad('1');
    setUnidad('unidades'); setPrecioUnitario('0.00'); setMotivo('accidente'); setNotas('');
  }

  function handleProductChange(p: { id: string; nombre: string; precio: number } | null, texto: string) {
    setSelectedProduct(p); setNombreManual(texto);
    if (p) setPrecioUnitario(p.precio.toFixed(2));
  }

  async function handleGuardarMerma() {
    const nombreFinal = selectedProduct?.nombre ?? nombreManual.trim();
    if (!nombreFinal) { toast.error('Indica el producto o nombre del ítem'); return; }
    const cant = parseFloat(cantidad);
    if (!cant || cant <= 0) { toast.error('Cantidad inválida'); return; }

    setSavingMerma(true);
    const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('kaltiro_admin_session') || '{}') : {};
    const { error } = await supabase.from('mermas').insert({
      business_id: business!.id,
      product_id: selectedProduct?.id ?? null,
      nombre_producto: nombreFinal,
      cantidad: cant,
      unidad,
      precio_unitario: parseFloat(precioUnitario) || 0,
      motivo,
      notas: notas.trim() || null,
      registrado_por: session?.user?.nombre ?? null,
    });
    setSavingMerma(false);
    if (error) { toast.error('Error al registrar merma'); return; }
    toast.success('Merma registrada');
    setShowMermaModal(false);
    resetMermaForm();
    loadMermas();
  }

  // ── Handlers: Inventario ───────────────────────────────────────────────────

  function resetItemForm() {
    setItemNombre(''); setItemCategoria('Alimentos'); setItemUnidad('unidades');
    setItemStockActual('0'); setItemStockMinimo('0'); setItemProveedor('');
    setEditingItem(null);
  }

  function openEditItem(item: InventarioItem) {
    setEditingItem(item);
    setItemNombre(item.nombre);
    setItemCategoria(item.categoria ?? 'Otro');
    setItemUnidad(item.unidad);
    setItemStockActual(String(item.stock_actual));
    setItemStockMinimo(String(item.stock_minimo));
    setItemProveedor(item.proveedor ?? '');
    setShowItemModal(true);
  }

  async function handleGuardarItem() {
    if (!itemNombre.trim()) { toast.error('El nombre es requerido'); return; }
    setSavingItem(true);
    const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('kaltiro_admin_session') || '{}') : {};
    const payload = {
      business_id: business!.id,
      nombre: itemNombre.trim(),
      categoria: itemCategoria,
      unidad: itemUnidad,
      stock_actual: parseFloat(itemStockActual) || 0,
      stock_minimo: parseFloat(itemStockMinimo) || 0,
      proveedor: itemProveedor.trim() || null,
      activo: true,
    };

    if (editingItem) {
      const { error } = await supabase.from('inventario_items').update(payload).eq('id', editingItem.id);
      if (error) { toast.error('Error al actualizar'); setSavingItem(false); return; }
      toast.success('Ítem actualizado');
    } else {
      const { error } = await supabase.from('inventario_items').insert(payload);
      if (error) { toast.error('Error al agregar ítem'); setSavingItem(false); return; }
      toast.success('Ítem agregado');
    }
    setSavingItem(false);
    setShowItemModal(false);
    resetItemForm();
    loadInventario();
  }

  async function handleEntrada() {
    if (!selectedItem) return;
    const cant = parseFloat(entradaCantidad);
    if (!cant || cant <= 0) { toast.error('Cantidad inválida'); return; }
    setSavingItem(true);
    const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('kaltiro_admin_session') || '{}') : {};
    const nuevoStock = selectedItem.stock_actual + cant;

    const [movRes] = await Promise.all([
      supabase.from('inventario_movimientos').insert({
        business_id: business!.id,
        item_id: selectedItem.id,
        tipo: 'entrada',
        cantidad: cant,
        notas: entradaNotas.trim() || null,
        registrado_por: session?.user?.nombre ?? null,
      }),
    ]);
    await supabase.from('inventario_items').update({ stock_actual: nuevoStock }).eq('id', selectedItem.id);

    setSavingItem(false);
    if (movRes.error) { toast.error('Error al registrar entrada'); return; }
    toast.success(`+${cant} ${selectedItem.unidad} registrados`);
    setShowEntradaModal(false);
    setEntradaCantidad('1'); setEntradaNotas('');
    loadInventario();
  }

  async function handleAjuste() {
    if (!selectedItem) return;
    const nueva = parseFloat(ajusteNuevaCantidad);
    if (isNaN(nueva) || nueva < 0) { toast.error('Cantidad inválida'); return; }
    setSavingItem(true);
    const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('kaltiro_admin_session') || '{}') : {};
    const delta = nueva - selectedItem.stock_actual;

    await Promise.all([
      supabase.from('inventario_movimientos').insert({
        business_id: business!.id,
        item_id: selectedItem.id,
        tipo: 'ajuste',
        cantidad: delta,
        notas: ajusteNotas.trim() || null,
        registrado_por: session?.user?.nombre ?? null,
      }),
      supabase.from('inventario_items').update({ stock_actual: nueva }).eq('id', selectedItem.id),
    ]);

    setSavingItem(false);
    toast.success('Stock ajustado');
    setShowAjusteModal(false);
    setAjusteNuevaCantidad('0'); setAjusteNotas('');
    loadInventario();
  }

  async function handleEliminarItem(item: InventarioItem) {
    await supabase.from('inventario_items').update({ activo: false }).eq('id', item.id);
    toast.success('Ítem eliminado');
    loadInventario();
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const ahora = new Date();
  const mermasMes = mermas.filter(m => {
    const d = new Date(m.created_at);
    return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
  });
  const perdidaMes = mermasMes.reduce((acc, m) => acc + m.cantidad * (m.precio_unitario ?? 0), 0);
  const itemsLowStock = items.filter(i => i.stock_actual <= i.stock_minimo);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business?.has_mermas) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Boxes className="w-12 h-12 text-slate-600" />
        <p className="text-slate-400 text-sm max-w-xs">
          El módulo de Control de Stock no está activado. Actívalo desde el Marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
            Control de Stock
            {itemsLowStock.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle className="w-3 h-3" /> {itemsLowStock.length} bajo mínimo
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Mermas y seguimiento de inventario</p>
        </div>

        <button
          onClick={() => activeTab === 'mermas' ? setShowMermaModal(true) : setShowItemModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-500/90 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'mermas' ? 'Registrar baja' : 'Agregar ítem'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-950/60 rounded-2xl border border-white/10 w-fit">
        {([
          { id: 'mermas' as Tab, label: 'Mermas' },
          { id: 'inventario' as Tab, label: 'Inventario' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-xl text-xs font-display font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: MERMAS ─────────────────────────────────────────────────────── */}
      {activeTab === 'mermas' && (
        <>
          {loadingMermas ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Bajas este mes</p>
                  <p className="text-2xl font-bold text-white mt-1">{mermasMes.length}</p>
                  <p className="text-xs text-slate-500">registros</p>
                </div>
                <div className="p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Pérdida estimada</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">${formatMoney(perdidaMes)}</p>
                  <p className="text-xs text-slate-500">este mes</p>
                </div>
                {MOTIVOS.slice(0, 2).map(m => {
                  const count = mermasMes.filter(x => x.motivo === m.value).length;
                  return (
                    <div key={m.value} className="p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
                      <p className="text-xs text-slate-500 truncate">{m.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{count}</p>
                      <p className="text-xs text-slate-500">bajas</p>
                    </div>
                  );
                })}
              </div>

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
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Pérdida</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {mermas.map(m => (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{m.nombre_producto}</p>
                            {m.notas && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.notas}</p>}
                            {m.registrado_por && <p className="text-xs text-slate-600 mt-0.5">por {m.registrado_por}</p>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${MOTIVO_COLORS[m.motivo]}`}>
                              {MOTIVOS.find(x => x.value === m.motivo)?.label ?? m.motivo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-white font-mono-tech">
                            {m.cantidad} <span className="text-slate-500 text-xs">{m.unidad}</span>
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            {m.precio_unitario > 0 ? (
                              <span className="text-red-400 font-mono-tech text-sm">
                                -${formatMoney(m.cantidad * m.precio_unitario)}
                              </span>
                            ) : <span className="text-slate-600 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 text-xs hidden lg:table-cell whitespace-nowrap">
                            {formatFecha(m.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB: INVENTARIO ─────────────────────────────────────────────────── */}
      {activeTab === 'inventario' && (
        <>
          {loadingInventario ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Alerta stock bajo */}
              {itemsLowStock.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">
                      {itemsLowStock.length} {itemsLowStock.length === 1 ? 'ítem bajo' : 'ítems bajo'} el stock mínimo
                    </p>
                    <p className="text-xs text-red-400/70 mt-0.5">
                      {itemsLowStock.map(i => i.nombre).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Total ítems</p>
                  <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
                </div>
                <div className="p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Bajo mínimo</p>
                  <p className={`text-2xl font-bold mt-1 ${itemsLowStock.length > 0 ? 'text-red-400' : 'text-white'}`}>
                    {itemsLowStock.length}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-white/[0.07] bg-[#0D1117]">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Con stock OK</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{items.length - itemsLowStock.length}</p>
                </div>
              </div>

              {/* Tabla */}
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center border border-white/[0.06] rounded-2xl bg-[#0D1117]">
                  <Boxes className="w-8 h-8 text-slate-600" />
                  <p className="text-slate-500 text-sm">Sin ítems de inventario aún</p>
                  <button
                    onClick={() => setShowItemModal(true)}
                    className="text-brand-400 text-xs hover:underline"
                  >
                    Agregar primer ítem →
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ítem</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Categoría</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Mínimo</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{item.nombre}</p>
                            {item.proveedor && <p className="text-xs text-slate-500 mt-0.5">{item.proveedor}</p>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-slate-400">{item.categoria ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <StockBadge actual={item.stock_actual} minimo={item.stock_minimo} />
                            <span className="text-slate-500 text-xs ml-1">{item.unidad}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 font-mono-tech text-sm hidden md:table-cell">
                            {item.stock_minimo} <span className="text-xs">{item.unidad}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                title="Registrar entrada"
                                onClick={() => { setSelectedItem(item); setEntradaCantidad('1'); setShowEntradaModal(true); }}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Ajustar stock"
                                onClick={() => { setSelectedItem(item); setAjusteNuevaCantidad(String(item.stock_actual)); setShowAjusteModal(true); }}
                                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Editar ítem"
                                onClick={() => openEditItem(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Eliminar"
                                onClick={() => handleEliminarItem(item)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── MODAL: Merma ─────────────────────────────────────────────────────── */}
      {showMermaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0B0F1B] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-display font-bold text-white">Registrar baja / merma</h2>
              <button onClick={() => { setShowMermaModal(false); resetMermaForm(); }} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Producto</label>
                <ProductCombobox productos={productos} value={selectedProduct} onChange={handleProductChange} />
                <p className="text-[10px] text-slate-600 mt-1">Busca entre tus productos o escribe un nombre libre</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Cantidad</label>
                  <input type="number" min="0.1" step="0.1" value={cantidad} onChange={e => setCantidad(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Unidad</label>
                  <select value={unidad} onChange={e => setUnidad(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40 appearance-none">
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Precio unitario <span className="text-slate-600 normal-case font-normal">(para calcular pérdida)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" min="0" step="0.01" value={precioUnitario} onChange={e => setPrecioUnitario(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-brand-500/40" />
                </div>
                {parseFloat(precioUnitario) > 0 && parseFloat(cantidad) > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    Pérdida total: <span className="font-mono-tech font-bold">${formatMoney(parseFloat(cantidad) * parseFloat(precioUnitario))}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Motivo</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOTIVOS.map(m => (
                    <button key={m.value} type="button" onClick={() => setMotivo(m.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        motivo === m.value ? MOTIVO_COLORS[m.value] : 'border-white/[0.06] text-slate-500 hover:border-white/[0.12]'
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Notas <span className="text-slate-600 normal-case font-normal">(opcional)</span>
                </label>
                <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: se cayó la bandeja completa..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40 resize-none" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={handleGuardarMerma} disabled={savingMerma}
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {savingMerma ? 'Guardando...' : 'Registrar baja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nuevo / Editar Ítem ────────────────────────────────────────── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0B0F1B] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-display font-bold text-white">{editingItem ? 'Editar ítem' : 'Agregar ítem'}</h2>
              <button onClick={() => { setShowItemModal(false); resetItemForm(); }} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Nombre del ítem</label>
                <input type="text" value={itemNombre} onChange={e => setItemNombre(e.target.value)}
                  placeholder="Ej: Harina de trigo, Aceite girasol..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Categoría</label>
                  <select value={itemCategoria} onChange={e => setItemCategoria(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40 appearance-none">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Unidad</label>
                  <select value={itemUnidad} onChange={e => setItemUnidad(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40 appearance-none">
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Stock actual</label>
                  <input type="number" min="0" step="0.1" value={itemStockActual} onChange={e => setItemStockActual(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Stock mínimo</label>
                  <input type="number" min="0" step="0.1" value={itemStockMinimo} onChange={e => setItemStockMinimo(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40" />
                  <p className="text-[10px] text-slate-600 mt-1">Alerta cuando llegue a este nivel</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Proveedor <span className="text-slate-600 normal-case font-normal">(opcional)</span>
                </label>
                <input type="text" value={itemProveedor} onChange={e => setItemProveedor(e.target.value)}
                  placeholder="Ej: Distribuidora García..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={handleGuardarItem} disabled={savingItem}
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {savingItem ? 'Guardando...' : editingItem ? 'Guardar cambios' : 'Agregar ítem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Registrar Entrada ──────────────────────────────────────────── */}
      {showEntradaModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0B0F1B] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="font-display font-bold text-white flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-emerald-400" /> Registrar entrada
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedItem.nombre}</p>
              </div>
              <button onClick={() => setShowEntradaModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Cantidad recibida ({selectedItem.unidad})
                </label>
                <input type="number" min="0.1" step="0.1" value={entradaCantidad} onChange={e => setEntradaCantidad(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40" />
                <p className="text-[10px] text-slate-500 mt-1">
                  Stock actual: {selectedItem.stock_actual} → nuevo: {(selectedItem.stock_actual + (parseFloat(entradaCantidad) || 0)).toFixed(2)} {selectedItem.unidad}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Notas <span className="text-slate-600 normal-case font-normal">(opcional)</span>
                </label>
                <input type="text" value={entradaNotas} onChange={e => setEntradaNotas(e.target.value)}
                  placeholder="Ej: Pedido proveedor García..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={handleEntrada} disabled={savingItem}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-500/90 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {savingItem ? 'Guardando...' : 'Registrar entrada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Ajustar Stock ──────────────────────────────────────────────── */}
      {showAjusteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0B0F1B] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="font-display font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Ajustar stock
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedItem.nombre}</p>
              </div>
              <button onClick={() => setShowAjusteModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Nueva cantidad real ({selectedItem.unidad})
                </label>
                <input type="number" min="0" step="0.1" value={ajusteNuevaCantidad} onChange={e => setAjusteNuevaCantidad(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/40" />
                <p className="text-[10px] text-slate-500 mt-1">
                  Ingresa el conteo físico real. Actual en sistema: {selectedItem.stock_actual} {selectedItem.unidad}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  Motivo del ajuste <span className="text-slate-600 normal-case font-normal">(opcional)</span>
                </label>
                <input type="text" value={ajusteNotas} onChange={e => setAjusteNotas(e.target.value)}
                  placeholder="Ej: conteo físico mensual..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/40" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={handleAjuste} disabled={savingItem}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-500/90 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {savingItem ? 'Guardando...' : 'Aplicar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
