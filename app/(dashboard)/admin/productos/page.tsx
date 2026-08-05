'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Package, Tag, RefreshCw } from 'lucide-react';
import { Product, Category } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function AdminProductsPage() {
  const { business, loading: loadingBusiness } = useAdminBusiness();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('20');
  const [imagenUrl, setImagenUrl] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar categorías y productos REALES desde Supabase Postgres DB
  useEffect(() => {
    async function loadData() {
      if (!business) return;
      setLoading(true);
      try {
        const supabase = createClient();
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').eq('business_id', business.id).order('orden'),
          supabase.from('products').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
        ]);

        if (catRes.data) setCategories(catRes.data as Category[]);
        if (prodRes.data) setProducts(prodRes.data as Product[]);
      } catch (err) {
        console.error('Error cargando productos de Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [business]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoryId(categories[0]?.id || '');
    setStock('25');
    setImagenUrl('');
    setDisponible(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setPrecio(p.precio.toString());
    setCategoryId(p.category_id || '');
    setStock(p.stock.toString());
    setImagenUrl(p.imagen_url || '');
    setDisponible(p.disponible);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !nombre || !precio) return;

    setIsSaving(true);
    const numPrecio = parseFloat(precio);
    const numStock = parseInt(stock) || 0;

    try {
      const supabase = createClient();

      if (editingProduct) {
        // Actualizar en Supabase DB
        const { data, error } = await supabase
          .from('products')
          .update({
            nombre,
            descripcion,
            precio: numPrecio,
            category_id: categoryId || null,
            stock: numStock,
            imagen_url: imagenUrl || null,
            disponible,
          })
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (!error && data) {
          setProducts((prev) => prev.map((p) => (p.id === data.id ? (data as Product) : p)));
        }
      } else {
        // Crear nuevo en Supabase DB
        const { data, error } = await supabase
          .from('products')
          .insert({
            business_id: business.id,
            category_id: categoryId || null,
            nombre,
            descripcion,
            precio: numPrecio,
            stock: numStock,
            imagen_url: imagenUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
            disponible,
          })
          .select()
          .single();

        if (!error && data) {
          setProducts((prev) => [data as Product, ...prev]);
        }
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando producto:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisponible = async (p: Product) => {
    const nextState = !p.disponible;
    setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, disponible: nextState } : item)));

    try {
      const supabase = createClient();
      await supabase.from('products').update({ disponible: nextState }).eq('id', p.id);
    } catch (err) {
      console.error('Error actualizando disponibilidad:', err);
    }
  };

  if (loadingBusiness || loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-display text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Cargando productos reales desde Supabase Postgres...</span>
      </div>
    );
  }

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.nombre,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D1322] p-5 rounded-3xl border border-white/10 glass-panel">
        <div>
          <h1 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Gestión de Productos — {business?.nombre}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Añade, edita precios o pausa la disponibilidad de tus productos en el catálogo público en vivo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-display font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all border border-emerald-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Nuevo Producto</span>
        </button>
      </div>

      {/* Lista de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <div
            key={p.id}
            className={`glass-card rounded-3xl p-5 border space-y-4 shadow-xl transition-all ${
              p.disponible ? 'border-white/10' : 'border-rose-500/30 opacity-70 bg-rose-950/10'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden flex-shrink-0 border border-white/10">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold">Sin foto</div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-white text-base leading-snug">{p.nombre}</h3>
                  <span className="font-mono-tech font-black text-emerald-400 text-sm">{formatCurrency(p.precio)}</span>
                </div>
                {p.descripcion && <p className="text-xs text-slate-400 line-clamp-2">{p.descripcion}</p>}
              </div>
            </div>

            {/* Footer Acciones */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => handleToggleDisponible(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold border transition-colors ${
                  p.disponible
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                }`}
              >
                {p.disponible ? '🟢 Disponible' : '🔴 Pausado'}
              </button>

              <button
                onClick={() => handleOpenEdit(p)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="Editar Producto"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Formulario Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="font-display font-black text-white text-base">
                {editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Humita Especial"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Precio ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2.50"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono-tech"
                  />
                </div>
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Categoría</label>
                  <CustomSelect
                    options={categoryOptions}
                    value={categoryId}
                    onChange={(val) => setCategoryId(val)}
                    accentColor="emerald"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Ingredientes o detalles..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">URL Foto Imagen</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {isSaving ? 'Guardando en Supabase DB...' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
