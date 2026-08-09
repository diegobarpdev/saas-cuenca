'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Package, Tag, RefreshCw, FolderPlus, Save, UploadCloud, Link as LinkIcon, Loader2, Flame } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { Product, Category } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import { compressImage } from '@/lib/utils/imageCompressor';
import { getProductPriceInfo } from '@/lib/utils/promo';

export default function AdminProductsPage() {
  const { business, loading: loadingBusiness } = useAdminBusiness();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('yapi_simulated_role') || 'dueño';
      if (role !== 'dueño') {
        toast.error('Acceso denegado: solo el Administrador (Dueño) puede gestionar productos.');
        window.location.href = '/admin/caja';
      } else {
        setAuthorized(true);
      }
    }
  }, []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro de Categoría seleccionado
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todas');

  // Modal Estado Producto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Campos Formulario Producto
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [enOferta, setEnOferta] = useState(false);
  const [precioOferta, setPrecioOferta] = useState('');
  const [etiquetaPromo, setEtiquetaPromo] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('20');
  const [imagenUrl, setImagenUrl] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estado Subida de Foto Local
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modal Estado Categorías
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatNombre, setNewCatNombre] = useState('');
  const [newCatOrden, setNewCatOrden] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Edición Inline Categoría
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatNombre, setEditCatNombre] = useState('');
  const [editCatOrden, setEditCatOrden] = useState('');

  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('business_id', business.id).order('orden', { ascending: true }),
        supabase.from('products').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      ]);

      if (catRes.data) setCategories(catRes.data as Category[]);
      if (prodRes.data) setProducts(prodRes.data as Product[]);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !business) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const file = await compressImage(rawFile, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        mimeType: 'image/webp',
      });

      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'webp';
      const fileName = `${business.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '31536000',
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        setUploadError(`Error al subir la imagen: ${error.message}`);
        toast.error(`Error al subir imagen: ${error.message}`);
      } else if (data) {
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(data.path);
        if (publicUrlData?.publicUrl) {
          setImagenUrl(publicUrlData.publicUrl);
          toast.success('Foto optimizada y cargada a Supabase Storage');
        }
      }
    } catch (err: any) {
      setUploadError(`Excepción al procesar archivo: ${err.message}`);
      toast.error(`Error procesando archivo: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setEnOferta(false);
    setPrecioOferta('');
    setEtiquetaPromo('');
    setCategoryId(categories[0]?.id || '');
    setStock('25');
    setImagenUrl('');
    setDisponible(true);
    setImageMode('upload');
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setPrecio(p.precio.toString());
    setEnOferta(p.en_oferta || false);
    setPrecioOferta(p.precio_oferta ? p.precio_oferta.toString() : '');
    setEtiquetaPromo(p.etiqueta_promo || '');
    setCategoryId(p.category_id || '');
    setStock(p.stock.toString());
    setImagenUrl(p.imagen_url || '');
    setDisponible(p.disponible);
    setImageMode('upload');
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !nombre || !precio) return;

    setIsSaving(true);
    const numPrecio = parseFloat(precio);
    const numPrecioOferta = enOferta && precioOferta ? parseFloat(precioOferta) : null;
    const numStock = parseInt(stock) || 0;

    try {
      const supabase = createClient();

      const productPayload = {
        nombre,
        descripcion,
        precio: numPrecio,
        en_oferta: enOferta,
        precio_oferta: numPrecioOferta,
        etiqueta_promo: enOferta ? etiquetaPromo || null : null,
        category_id: categoryId || null,
        stock: numStock,
        imagen_url: imagenUrl || null,
        disponible,
      };

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (!error && data) {
          setProducts((prev) => prev.map((p) => (p.id === data.id ? (data as Product) : p)));
          toast.success(`Producto "${nombre}" actualizado correctamente`);
        } else if (error) {
          toast.error(`Error al editar producto: ${error.message}`);
        }
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({
            business_id: business.id,
            ...productPayload,
          })
          .select()
          .single();

        if (!error && data) {
          setProducts((prev) => [data as Product, ...prev]);
          toast.success(`Producto "${nombre}" creado exitosamente`);
        } else if (error) {
          toast.error(`Error al crear producto: ${error.message}`);
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(`Excepción: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisponible = async (p: Product) => {
    const nextState = !p.disponible;
    setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, disponible: nextState } : item)));
    toast.info(`"${p.nombre}" marcado como ${nextState ? 'Disponible' : 'Pausado'}`);

    try {
      const supabase = createClient();
      await supabase.from('products').update({ disponible: nextState }).eq('id', p.id);
    } catch (err) {
      console.error('Error actualizando disponibilidad:', err);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.nombre}"?`)) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (!error) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        toast.success(`Producto "${product.nombre}" eliminado`);
      } else {
        toast.error(`Error eliminando producto: ${error.message}`);
      }
    } catch (err: any) {
      toast.error(`Excepción eliminando producto: ${err.message}`);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newCatNombre.trim()) return;

    setIsSavingCat(true);
    try {
      const supabase = createClient();
      const nextOrden = parseInt(newCatOrden) || (categories.length + 1) * 10;
      const { data, error } = await supabase
        .from('categories')
        .insert({
          business_id: business.id,
          nombre: newCatNombre.trim(),
          orden: nextOrden,
        })
        .select()
        .single();

      if (!error && data) {
        setCategories((prev) => [...prev, data as Category].sort((a, b) => a.orden - b.orden));
        setNewCatNombre('');
        setNewCatOrden('');
      } else if (error) {
        alert(`Error al crear categoría: ${error.message}`);
      }
    } catch (err: any) {
      console.error('Error creando categoría:', err);
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleStartEditCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatNombre(cat.nombre);
    setEditCatOrden(cat.orden.toString());
  };

  const handleSaveEditCategory = async (catId: string) => {
    if (!editCatNombre.trim()) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .update({
          nombre: editCatNombre.trim(),
          orden: parseInt(editCatOrden) || 0,
        })
        .eq('id', catId)
        .select()
        .single();

      if (!error && data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === catId ? (data as Category) : c)).sort((a, b) => a.orden - b.orden)
        );
        setEditingCatId(null);
      } else if (error) {
        alert(`Error al guardar categoría: ${error.message}`);
      }
    } catch (err: any) {
      console.error('Error editando categoría:', err);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const prodCount = products.filter((p) => p.category_id === cat.id).length;
    const msg =
      prodCount > 0
        ? `¿Eliminar la categoría "${cat.nombre}"? Hay ${prodCount} producto(s) asignados a ella que quedarán sin categoría.`
        : `¿Estás seguro de eliminar la categoría "${cat.nombre}"?`;

    if (!confirm(msg)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);

      if (!error) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setProducts((prev) =>
          prev.map((p) => (p.category_id === cat.id ? { ...p, category_id: null } : p))
        );
        if (selectedCategoryFilter === cat.id) {
          setSelectedCategoryFilter('todas');
        }
      } else {
        alert(`Error al eliminar categoría: ${error.message}`);
      }
    } catch (err: any) {
      console.error('Error eliminando categoría:', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter === 'todas') return true;
    if (selectedCategoryFilter === 'sin_categoria') return !p.category_id;
    return p.category_id === selectedCategoryFilter;
  });

  if (loadingBusiness || loading || !authorized) {
    return (
      <div className="p-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
        <span>Cargando productos...</span>
      </div>
    );
  }

  const categoryOptions = [
    { value: '', label: 'Sin categoría específica' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.nombre,
    })),
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header Producción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-zinc-400" />
            <span>Productos y Categorías — {business?.nombre}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Administra el catálogo de productos y organiza las secciones visibles para tus clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-zinc-400" />
            <span>Gestionar Categorías ({categories.length})</span>
          </button>

          <button
            onClick={handleOpenCreateProduct}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Producto</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Filtro */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter('todas')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategoryFilter === 'todas'
              ? 'bg-zinc-100 text-zinc-950 font-semibold'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          Todas ({products.length})
        </button>

        {categories.map((cat) => {
          const count = products.filter((p) => p.category_id === cat.id).length;
          const isActive = selectedCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              {cat.nombre} ({count})
            </button>
          );
        })}

        {products.some((p) => !p.category_id) && (
          <button
            onClick={() => setSelectedCategoryFilter('sin_categoria')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategoryFilter === 'sin_categoria'
                ? 'bg-zinc-100 text-zinc-950 font-semibold'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            Sin Categoría ({products.filter((p) => !p.category_id).length})
          </button>
        )}
      </div>

      {/* Grid de Productos */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 text-zinc-500 text-xs font-medium">
          No hay productos registrados en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const catObj = categories.find((c) => c.id === p.category_id);
            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  p.disponible
                    ? 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                    : 'bg-zinc-950 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 rounded-lg bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">Sin foto</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-zinc-100 leading-snug truncate">{p.nombre}</h3>
                      <div className="text-right flex-shrink-0 font-mono">
                        {p.en_oferta && p.precio_oferta && p.precio_oferta < p.precio ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-500 line-through">
                              {formatCurrency(p.precio)}
                            </span>
                            <span className="font-bold text-sm text-amber-400">
                              {formatCurrency(p.precio_oferta)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold text-sm text-zinc-200">{formatCurrency(p.precio)}</span>
                        )}
                      </div>
                    </div>

                    {p.en_oferta && p.precio_oferta && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        <span>{p.etiqueta_promo || 'OFERTA'}</span>
                      </div>
                    )}

                    {catObj && (
                      <span className="inline-block text-[10px] font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700">
                        {catObj.nombre}
                      </span>
                    )}

                    {p.descripcion && <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{p.descripcion}</p>}
                  </div>
                </div>

                {/* Footer Acciones */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleDisponible(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      p.disponible
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    }`}
                  >
                    {p.disponible ? 'Disponible' : 'Pausado'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                      title="Editar Producto"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Eliminar Producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Gestionar Categorías */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-400" />
                <span>Gestión de Categorías ({business?.nombre})</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario Nueva Categoría */}
            <form onSubmit={handleCreateCategory} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
              <h4 className="font-semibold text-xs text-zinc-200 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-zinc-400" />
                <span>Crear Nueva Categoría</span>
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre categoría..."
                  value={newCatNombre}
                  onChange={(e) => setNewCatNombre(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500"
                />

                <input
                  type="number"
                  placeholder="Orden (10)"
                  value={newCatOrden}
                  onChange={(e) => setNewCatOrden(e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono placeholder-zinc-500"
                />

                <button
                  type="submit"
                  disabled={isSavingCat}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSavingCat ? '...' : 'Crear'}</span>
                </button>
              </div>
            </form>

            {/* Lista de Categorías */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              <h4 className="font-medium text-xs text-zinc-400">
                Categorías Registradas ({categories.length})
              </h4>

              {categories.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">No hay categorías registradas.</p>
              ) : (
                categories.map((cat) => {
                  const prodCount = products.filter((p) => p.category_id === cat.id).length;
                  const isEditingThis = editingCatId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                    >
                      {isEditingThis ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editCatNombre}
                            onChange={(e) => setEditCatNombre(e.target.value)}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100"
                          />
                          <input
                            type="number"
                            value={editCatOrden}
                            onChange={(e) => setEditCatOrden(e.target.value)}
                            className="w-14 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono"
                          />
                          <button
                            onClick={() => handleSaveEditCategory(cat.id)}
                            className="p-1 rounded bg-emerald-600 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] font-bold">
                              #{cat.orden}
                            </span>
                            <div>
                              <p className="font-semibold text-xs text-zinc-100">{cat.nombre}</p>
                              <span className="text-[10px] text-zinc-500">{prodCount} producto(s)</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditCat(cat)}
                              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulario Crear / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-zinc-100 text-sm">
                {editingProduct ? 'Editar Producto' : 'Añadir Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Humita Especial"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Precio Normal ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2.50"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Categoría</label>
                  <CustomSelect
                    options={categoryOptions}
                    value={categoryId}
                    onChange={(val) => setCategoryId(val)}
                    accentColor="emerald"
                  />
                </div>
              </div>

              {/* Sección de Ofertas & Promociones */}
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    ¿Activar Precio de Oferta / Promo?
                  </span>
                  <CustomCheckbox
                    checked={enOferta}
                    onChange={setEnOferta}
                    label=""
                    accentColor="amber"
                  />
                </div>

                {enOferta && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-display font-medium text-zinc-300 mb-1">
                          Precio Oferta ($ USD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ej: 1.75"
                          value={precioOferta}
                          onChange={(e) => setPrecioOferta(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-display font-medium text-zinc-300 mb-1">
                          Badge / Etiqueta Promo
                        </label>
                        <input
                          type="text"
                          list="promo-labels-list"
                          placeholder="Ej: 20% OFF / PROMO"
                          value={etiquetaPromo}
                          onChange={(e) => setEtiquetaPromo(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                        <datalist id="promo-labels-list">
                          <option value="20% OFF" />
                          <option value="PROMO DEL DÍA" />
                          <option value="2X1 ESPECIAL" />
                          <option value="MÁS VENDIDO" />
                          <option value="COMBO DESTACADO" />
                        </datalist>
                      </div>
                    </div>

                    {precio && precioOferta && parseFloat(precio) > parseFloat(precioOferta) && (
                      <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <span>
                          ¡Tu cliente ahorrará ${(parseFloat(precio) - parseFloat(precioOferta)).toFixed(2)} (
                          {Math.round(((parseFloat(precio) - parseFloat(precioOferta)) / parseFloat(precio)) * 100)}% OFF)!
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalles del producto..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                />
              </div>

              {/* Subidor de Foto */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Foto del Producto
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                      imageMode === 'upload'
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Subir de mi Equipo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                      imageMode === 'url'
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>URL Web</span>
                  </button>
                </div>

                {imageMode === 'upload' ? (
                  <div className="space-y-1.5">
                    {imagenUrl ? (
                      <div className="relative w-full h-32 rounded-lg bg-zinc-950 overflow-hidden border border-zinc-800 group">
                        <img src={imagenUrl} alt="Vista previa" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                          <label className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold cursor-pointer flex items-center gap-1">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Cambiar</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                          </label>
                          <button
                            type="button"
                            onClick={() => setImagenUrl('')}
                            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="w-full h-28 rounded-lg bg-zinc-950 border border-dashed border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center p-3 cursor-pointer transition-colors">
                        {uploadingImage ? (
                          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-200" />
                            <span>Subiendo imagen...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-center">
                            <UploadCloud className="w-4 h-4 text-zinc-400" />
                            <p className="text-xs font-medium text-zinc-300">
                              Seleccionar foto desde equipo
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              Compresión automática WebP
                            </p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={handleFileUpload}
                        />
                      </label>
                    )}

                    {uploadError && (
                      <p className="text-[11px] text-rose-400">{uploadError}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={imagenUrl}
                      onChange={(e) => setImagenUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving || uploadingImage}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shadow-sm transition-colors"
              >
                {isSaving ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
