'use client';

import React, { use, useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Package, Tag, RefreshCw, FolderPlus, Save, UploadCloud, Link as LinkIcon, Loader2, Flame, AlertTriangle, Lock, GripVertical } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { Product, Category } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import { compressImage } from '@/lib/utils/imageCompressor';
import { getProductPriceInfo } from '@/lib/utils/promo';

export default function AdminProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { business, loading: loadingBusiness } = useAdminBusiness(slug);
  const planLimits = usePlanLimits(business);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('yapi_simulated_role') || 'dueño';
      if (role !== 'dueño') {
        toast.error('Acceso denegado: solo el Administrador (Dueño) puede gestionar productos.');
        const _s = JSON.parse(localStorage.getItem('yapi_admin_session') || '{}');
        window.location.href = `/${_s?.business?.slug || ''}/caja`;
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

  // Estados para variantes / opciones del producto
  const [productOptionGroups, setProductOptionGroups] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Estado para Drag and Drop de Categorías
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);


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
    setProductOptionGroups([]);
    setIsModalOpen(true);
  };

  const loadProductOptions = async (productId: string) => {
    setLoadingOptions(true);
    try {
      const supabase = createClient();
      const { data: groups } = await supabase
        .from('product_option_groups')
        .select('*')
        .eq('product_id', productId)
        .order('orden');

      if (!groups || groups.length === 0) {
        setProductOptionGroups([]);
        return;
      }

      const groupIds = groups.map((g: any) => g.id);
      const { data: values } = await supabase
        .from('product_option_values')
        .select('*')
        .in('group_id', groupIds)
        .order('orden');

      const enriched = groups.map((g: any) => ({
        ...g,
        values: (values || []).filter((v: any) => v.group_id === g.id),
      }));

      setProductOptionGroups(enriched);
    } catch (err) {
      console.error('Error cargando opciones:', err);
    } finally {
      setLoadingOptions(false);
    }
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
    loadProductOptions(p.id);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !nombre || !precio) return;

    // Verificar límite del plan solo para productos nuevos
    if (!editingProduct && !planLimits.puedeAgregarProducto(products.length)) {
      toast.error(`Plan Demo: Límite de ${planLimits.maxProductos} productos alcanzado.`, {
        description: 'Contacta a Yapi.ec para activar un plan completo.',
      });
      return;
    }

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

        let targetProductId = editingProduct ? editingProduct.id : null;

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
            targetProductId = data.id;
            setProducts((prev) => [data as Product, ...prev]);
            toast.success(`Producto "${nombre}" creado exitosamente`);
          } else if (error) {
            toast.error(`Error al crear producto: ${error.message}`);
          }
        }

        // Guardar variantes / opciones si existen
        if (targetProductId && productOptionGroups.length > 0) {
          // Eliminar grupos anteriores
          const { error: delErr } = await supabase.from('product_option_groups').delete().eq('product_id', targetProductId);
          if (delErr) {
            console.error('Error limpiando opciones anteriores:', delErr);
          }

          for (let gIdx = 0; gIdx < productOptionGroups.length; gIdx++) {
            const group = productOptionGroups[gIdx];
            if (!group.nombre || !group.nombre.trim()) continue;

            const groupPayload = {
              product_id: targetProductId,
              nombre: group.nombre.trim(),
              tipo: group.tipo || 'radio',
              requerido: group.requerido ?? true,
              seleccion_minima: group.tipo === 'radio' ? 1 : (group.seleccion_minima || 0),
              seleccion_maxima: group.tipo === 'radio' ? 1 : (group.seleccion_maxima || 5),
              orden: gIdx,
            };

            const { data: gData, error: gErr } = await supabase
              .from('product_option_groups')
              .insert(groupPayload)
              .select()
              .single();

            if (gErr) {
              console.error('Error insertando grupo de opciones:', gErr);
              toast.error(`Error guardando grupo "${group.nombre}": ${gErr.message}`);
              continue;
            }

            if (gData && group.values && group.values.length > 0) {
              const valPayloads = group.values
                .filter((v: any) => v.nombre && v.nombre.trim())
                .map((v: any, vIdx: number) => ({
                  group_id: gData.id,
                  nombre: v.nombre.trim(),
                  precio_adicional: parseFloat(v.precio_adicional) || 0,
                  disponible: true,
                  orden: vIdx,
                }));

              if (valPayloads.length > 0) {
                const { error: vErr } = await supabase.from('product_option_values').insert(valPayloads);
                if (vErr) {
                  console.error('Error insertando valores de opciones:', vErr);
                  toast.error(`Error guardando opciones para "${group.nombre}": ${vErr.message}`);
                }
              }
            }
          }
          toast.success('Variantes y opciones guardadas.');
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
      const nextOrden = categories.length + 1;
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
        toast.success(`Categoría "${newCatNombre}" creada.`);
      } else if (error) {
        toast.error(`Error al crear categoría: ${error.message}`);
      }
    } catch (err: any) {
      console.error('Error creando categoría:', err);
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedCategoryIndex, 1);
    newCategories.splice(dropIndex, 0, draggedItem);

    const updated = newCategories.map((cat, idx) => ({ ...cat, orden: idx + 1 }));
    setCategories(updated);
    setDraggedCategoryIndex(null);
  };

  const handleSaveCategoriesOrder = async () => {
    setIsSavingCat(true);
    try {
      const supabase = createClient();
      await Promise.all(
        categories.map((cat, idx) =>
          supabase.from('categories').update({ orden: idx + 1 }).eq('id', cat.id)
        )
      );
      toast.success('Orden de categorías guardado exitosamente.');
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      console.error('Error guardando orden:', err);
      toast.error('Error al guardar el nuevo orden de categorías.');
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleStartEditCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatNombre(cat.nombre);
  };

  const handleSaveEditCategory = async (catId: string) => {
    if (!editCatNombre.trim()) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .update({
          nombre: editCatNombre.trim(),
        })
        .eq('id', catId)
        .select()
        .single();

      if (!error && data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === catId ? (data as Category) : c))
        );
        setEditingCatId(null);
        toast.success('Categoría actualizada.');
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
      {/* Header Producción (Optimizado Móvil) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="truncate">Productos — {business?.nombre}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Administra el catálogo de productos y organiza las secciones visibles.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Categorías ({categories.length})</span>
          </button>

          {planLimits.puedeAgregarProducto(products.length) ? (
            <button
              onClick={handleOpenCreateProduct}
              className="px-3 py-2.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Añadir Producto</span>
            </button>
          ) : (
            <button
              disabled
              title={`Límite del plan demo: máximo ${planLimits.maxProductos} productos`}
              className="px-3 py-2.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400/60 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Límite alcanzado</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de límite de plan */}
      {planLimits.isDemo && planLimits.maxProductos !== null && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300">
              Cuenta Demo — Plan Trial
            </p>
            <p className="text-[11px] text-amber-400/70">
              {products.length}/{planLimits.maxProductos} productos usados · Para eliminar el límite, contrata un plan en Yapi.ec
            </p>
          </div>
        </div>
      )}

      {/* Pestañas de Filtro (Scroller Táctil para Móviles) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSelectedCategoryFilter('todas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 ${
            selectedCategoryFilter === 'todas'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
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
              className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.nombre} ({count})
            </button>
          );
        })}

        {products.some((p) => !p.category_id) && (
          <button
            onClick={() => setSelectedCategoryFilter('sin_categoria')}
            className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 ${
              selectedCategoryFilter === 'sin_categoria'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Sin Categoría ({products.filter((p) => !p.category_id).length})
          </button>
        )}
      </div>

      {/* Grid de Productos (Optimizado Tarjetas Móviles) */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30 text-zinc-500 text-xs font-medium">
          No hay productos registrados en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const catObj = categories.find((c) => c.id === p.category_id);
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-lg ${
                  p.disponible
                    ? 'bg-[#0B0F1B] hover:bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700'
                    : 'bg-zinc-950/80 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-18 h-18 sm:w-16 sm:h-16 rounded-xl bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">Sin foto</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-zinc-100 leading-tight line-clamp-1">{p.nombre}</h3>
                      <div className="text-right flex-shrink-0 font-mono-tech">
                        {p.en_oferta && p.precio_oferta && p.precio_oferta < p.precio ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-500 line-through">
                              {formatCurrency(p.precio)}
                            </span>
                            <span className="font-black text-sm text-emerald-400">
                              {formatCurrency(p.precio_oferta)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-sm text-emerald-400">{formatCurrency(p.precio)}</span>
                        )}
                      </div>
                    </div>

                    {p.en_oferta && p.precio_oferta && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-black border border-amber-500/30">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        <span>{p.etiqueta_promo || 'PROMO'}</span>
                      </div>
                    )}

                    {catObj && (
                      <span className="inline-block text-[10px] font-mono-tech text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-white/5">
                        {catObj.nombre}
                      </span>
                    )}

                    {p.descripcion && <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{p.descripcion}</p>}
                  </div>
                </div>

                {/* Footer Acciones */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
                  <button
                    onClick={() => handleToggleDisponible(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      p.disponible
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    }`}
                  >
                    {p.disponible ? 'Disponible' : 'Pausado'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all active:scale-95"
                      title="Editar Producto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all active:scale-95"
                      title="Eliminar Producto"
                    >
                      <Trash2 className="w-4 h-4" />
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

              {/* Lista de Categorías con Drag and Drop */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                <h4 className="font-medium text-xs text-zinc-400">
                  Categorías Registradas ({categories.length}) — Arrastra desde los 6 puntos para reordenar
                </h4>

                {categories.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">No hay categorías registradas.</p>
                ) : (
                  categories.map((cat, idx) => {
                    const prodCount = products.filter((p) => p.category_id === cat.id).length;
                    const isEditingThis = editingCatId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        draggable={!isEditingThis}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={`p-2.5 rounded-xl bg-zinc-950 border transition-all flex items-center justify-between gap-3 ${
                          draggedCategoryIndex === idx
                            ? 'border-emerald-500 bg-emerald-500/10 opacity-50'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {isEditingThis ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editCatNombre}
                              onChange={(e) => setEditCatNombre(e.target.value)}
                              className="flex-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100"
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
                              {/* Manilla para Arrastrar (Grip) */}
                              <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-300 p-0.5">
                                <GripVertical className="w-4 h-4" />
                              </div>

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

            <div className="pt-3 border-t border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-semibold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCategoriesOrder}
                disabled={isSavingCat}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingCat ? 'Guardando...' : 'Guardar Orden de Categorías'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulario Crear / Editar Producto (Optimizado Móvil) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 p-4 sm:p-6 md:p-8 rounded-t-3xl sm:rounded-3xl border border-zinc-800 max-w-4xl w-full h-[92vh] sm:h-auto max-h-[95vh] space-y-4 sm:space-y-6 shadow-2xl flex flex-col my-0 sm:my-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 shrink-0">
              <div>
                <h3 className="font-display font-bold text-zinc-100 text-sm sm:text-base">
                  {editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  Detalles principales, foto, promociones y variantes.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Layout en 2 Columnas con scroll independiente en móvil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 overflow-y-auto pr-1 flex-1 pb-4 scrollbar-thin">
                
                {/* COLUMNA 1: Datos Básicos & Fotografía */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    1. Información General
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre del Producto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Humita Especial"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/60"
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
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Categoría</label>
                      <CustomSelect
                        options={categoryOptions}
                        value={categoryId}
                        onChange={(val) => setCategoryId(val)}
                        accentColor="emerald"
                        size="compact"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Descripción</label>
                    <textarea
                      rows={3}
                      placeholder="Detalles del producto (ingredientes, porciones...)"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/60 resize-none"
                    />
                  </div>

                  {/* Subidor de Foto */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
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
                          <div className="relative w-full h-32 rounded-xl bg-zinc-950 overflow-hidden border border-zinc-800 group">
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
                          <label className="w-full h-28 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 hover:border-zinc-700 flex flex-col items-center justify-center p-3 cursor-pointer transition-colors">
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
                </div>

                {/* COLUMNA 2: Ofertas & Variantes */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    2. Promociones & Variantes
                  </h4>

                  {/* Sección de Ofertas & Promociones */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/30 space-y-3">
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
                                         {/* Sección de Variantes y Opciones Adicionales (Rediseño Limpio) */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          <span>Opciones & Variantes</span>
                        </h4>
                        <p className="text-[10px] text-zinc-400">Personaliza extras, tamaños o sabores.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProductOptionGroups((prev) => [
                            ...prev,
                            {
                              id: `temp-${Date.now()}`,
                              nombre: '',
                              tipo: 'radio',
                              requerido: true,
                              values: [{ id: `val-${Date.now()}`, nombre: '', precio_adicional: 0 }],
                            },
                          ]);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Grupo de Opciones</span>
                      </button>
                    </div>

                    {loadingOptions ? (
                      <div className="flex items-center justify-center py-6 text-xs text-zinc-500">
                        <Loader2 className="w-4 h-4 animate-spin mr-2 text-emerald-400" /> Cargando variantes...
                      </div>
                    ) : productOptionGroups.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center space-y-1">
                        <p className="text-xs font-medium text-zinc-400">Este producto no tiene variantes.</p>
                        <p className="text-[10px] text-zinc-600">Ej: "Tamaño (1L, 2L)" o "Acompañado de (Papas, Ensalada)".</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productOptionGroups.map((group, gIdx) => (
                          <div key={group.id || gIdx} className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3.5 shadow-md">
                            
                            {/* Cabecera del Grupo */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono-tech font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  Grupo #{gIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductOptionGroups((prev) => prev.filter((_, idx) => idx !== gIdx));
                                  }}
                                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Eliminar grupo completo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre (Ej: Tamaño / Sabor)"
                                  value={group.nombre}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProductOptionGroups((prev) =>
                                      prev.map((g, idx) => (idx === gIdx ? { ...g, nombre: val } : g))
                                    );
                                  }}
                                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-bold focus:outline-none focus:border-emerald-500/60"
                                />

                                <CustomSelect
                                  options={[
                                    { value: 'radio', label: 'Selección Única' },
                                    { value: 'checkbox', label: 'Múltiple Check' },
                                  ]}
                                  value={group.tipo}
                                  onChange={(val) => {
                                    setProductOptionGroups((prev) =>
                                      prev.map((g, idx) => (idx === gIdx ? { ...g, tipo: val } : g))
                                    );
                                  }}
                                  accentColor="emerald"
                                  size="compact"
                                />
                              </div>
                            </div>

                            {/* Opciones del grupo */}
                            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                Opciones para el cliente:
                              </span>

                              {group.values?.map((valItem: any, vIdx: number) => (
                                <div key={valItem.id || vIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Nombre opción (Ej: 1 Litro / Extra Queso)"
                                    value={valItem.nombre}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setProductOptionGroups((prev) =>
                                        prev.map((g, idx) => {
                                          if (idx !== gIdx) return g;
                                          const updatedVals = g.values.map((v: any, vi: number) =>
                                            vi === vIdx ? { ...v, nombre: text } : v
                                          );
                                          return { ...g, values: updatedVals };
                                        })
                                      );
                                    }}
                                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                                  />

                                  <div className="relative w-24 shrink-0">
                                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500 text-xs pointer-events-none font-mono">+</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={valItem.precio_adicional}
                                      onChange={(e) => {
                                        const cost = e.target.value;
                                        setProductOptionGroups((prev) =>
                                          prev.map((g, idx) => {
                                            if (idx !== gIdx) return g;
                                            const updatedVals = g.values.map((v: any, vi: number) =>
                                              vi === vIdx ? { ...v, precio_adicional: cost } : v
                                            );
                                            return { ...g, values: updatedVals };
                                          })
                                        );
                                      }}
                                      className="w-full pl-6 pr-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/60"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductOptionGroups((prev) =>
                                        prev.map((g, idx) => {
                                          if (idx !== gIdx) return g;
                                          return { ...g, values: g.values.filter((_: any, vi: number) => vi !== vIdx) };
                                        })
                                      );
                                    }}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Eliminar opción"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => {
                                  setProductOptionGroups((prev) =>
                                    prev.map((g, idx) => {
                                      if (idx !== gIdx) return g;
                                      return {
                                        ...g,
                                        values: [...g.values, { id: `val-${Date.now()}`, nombre: '', precio_adicional: 0 }],
                                      };
                                    })
                                  );
                                }}
                                className="w-full py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-dashed border-zinc-800 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1 transition-colors mt-2"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Añadir valor a este grupo</span>
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Acciones de Modal (Fijo en Móvil) */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 font-semibold text-xs border border-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploadingImage}
                  className="flex-2 sm:flex-none px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
