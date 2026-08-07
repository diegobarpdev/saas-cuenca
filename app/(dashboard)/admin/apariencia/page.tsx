'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Save, UploadCloud, CheckCircle2, RefreshCw, Sparkles, Image as ImageIcon, Type, Layout, Eye } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { BusinessBranding } from '@/lib/types/database';
import { compressImage } from '@/lib/utils/imageCompressor';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { PATTERNS_LIST, getPatternSvgUrl, PatternType } from '@/lib/utils/patterns';

const typographyOptions = [
  { value: 'Outfit', label: 'Outfit (Moderna & Vanguardista)' },
  { value: 'Inter', label: 'Inter (Limpia & Minimalista)' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Equilibrada)' },
  { value: 'Playfair', label: 'Playfair Display (Bistro / Serif)' },
];

const buttonStyleOptions = [
  { value: 'redondeado', label: 'Redondeado Suave (2xl)' },
  { value: 'semi-redondeado', label: 'Semi-Redondeado (xl)' },
  { value: 'pill', label: 'Cápsula / Pill (Full)' },
  { value: 'recto', label: 'Recto / Modern (md)' },
];

const defaultThemeOptions = [
  { value: 'oscuro', label: 'Oscuro (Luxe Black)' },
  { value: 'claro', label: 'Claro (Clean White)' },
];

// Presets Profesionales predeterminados
const PRESET_THEMES = [
  {
    id: 'luxe-bistro',
    name: 'Luxe Bistro',
    desc: 'Oscuro elegante con acentos en oro ámbar',
    colors: {
      color_primario: '#F59E0B',
      color_secundario: '#1E293B',
      color_acento: '#10B981',
      color_fondo: '#080B11',
      color_texto: '#F8FAFC',
    },
    tipografia: 'Outfit' as const,
    estilo_botones: 'redondeado' as const,
    tema_defecto: 'oscuro' as const,
  },
  {
    id: 'cafe-artesanal',
    name: 'Café Artesanal',
    desc: 'Tonos tostados y calidez de espresso',
    colors: {
      color_primario: '#D97706',
      color_secundario: '#451A03',
      color_acento: '#F59E0B',
      color_fondo: '#0F0B08',
      color_texto: '#FEF3C7',
    },
    tipografia: 'Plus Jakarta Sans' as const,
    estilo_botones: 'semi-redondeado' as const,
    tema_defecto: 'oscuro' as const,
  },
  {
    id: 'fresh-organic',
    name: 'Fresh Organic',
    desc: 'Esmeralda botánico y frescura natural',
    colors: {
      color_primario: '#10B981',
      color_secundario: '#064E3B',
      color_acento: '#34D399',
      color_fondo: '#06100D',
      color_texto: '#ECFDF5',
    },
    tipografia: 'Inter' as const,
    estilo_botones: 'pill' as const,
    tema_defecto: 'oscuro' as const,
  },
  {
    id: 'bistro-moderno',
    name: 'Crimson Bistro',
    desc: 'Carmesí apasionado y alta intensidad',
    colors: {
      color_primario: '#EF4444',
      color_secundario: '#450A0A',
      color_acento: '#F59E0B',
      color_fondo: '#0F0808',
      color_texto: '#FEF2F2',
    },
    tipografia: 'Playfair' as const,
    estilo_botones: 'recto' as const,
    tema_defecto: 'oscuro' as const,
  },
  {
    id: 'clean-light',
    name: 'Clean Slate (Claro)',
    desc: 'Minimalismo claro, moderno y luminoso',
    colors: {
      color_primario: '#2563EB',
      color_secundario: '#E2E8F0',
      color_acento: '#10B981',
      color_fondo: '#FFFFFF',
      color_texto: '#0F172A',
    },
    tipografia: 'Inter' as const,
    estilo_botones: 'semi-redondeado' as const,
    tema_defecto: 'claro' as const,
  },
];

export default function AdminBrandingPage() {
  const { business, loading } = useAdminBusiness();

  // Estados de Branding
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [slogan, setSlogan] = useState('Gastronomía & Especialidades Artesanales en Cuenca');

  // Colores
  const [colorPrimario, setColorPrimario] = useState('#F59E0B');
  const [colorSecundario, setColorSecundario] = useState('#1E293B');
  const [colorAcento, setColorAcento] = useState('#10B981');
  const [colorFondo, setColorFondo] = useState('#080B11');
  const [colorTexto, setColorTexto] = useState('#F8FAFC');

  // Tipografía, Botones & Patrón de Fondo
  const [tipografia, setTipografia] = useState<'Outfit' | 'Inter' | 'Playfair' | 'Plus Jakarta Sans'>('Outfit');
  const [estiloBotones, setEstiloBotones] = useState<'redondeado' | 'semi-redondeado' | 'pill' | 'recto'>('redondeado');
  const [temaDefecto, setTemaDefecto] = useState<'oscuro' | 'claro'>('oscuro');
  const [patronFondo, setPatronFondo] = useState<PatternType>('sin_patron');

  // Subida de Archivos
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setLogoUrl(business.logo_url || '');

      if (business.branding) {
        const b = business.branding;
        if (b.slogan) setSlogan(b.slogan);
        if (b.banner_url) setBannerUrl(b.banner_url);
        if (b.favicon_url) setFaviconUrl(b.favicon_url);
        if (b.color_primario) setColorPrimario(b.color_primario);
        if (b.color_secundario) setColorSecundario(b.color_secundario);
        if (b.color_acento) setColorAcento(b.color_acento);
        if (b.color_fondo) setColorFondo(b.color_fondo);
        if (b.color_texto) setColorTexto(b.color_texto);
        if (b.tipografia) setTipografia(b.tipografia);
        if (b.estilo_botones) setEstiloBotones(b.estilo_botones);
        if (b.tema_defecto) setTemaDefecto(b.tema_defecto);
        if (b.patron_fondo) setPatronFondo(b.patron_fondo);
      }
    }
  }, [business]);

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setColorPrimario(preset.colors.color_primario);
    setColorSecundario(preset.colors.color_secundario);
    setColorAcento(preset.colors.color_acento);
    setColorFondo(preset.colors.color_fondo);
    setColorTexto(preset.colors.color_texto);
    setTipografia(preset.tipografia);
    setEstiloBotones(preset.estilo_botones);
    setTemaDefecto(preset.tema_defecto);
    toast.info(`Tema "${preset.name}" aplicado a la vista previa`);
  };

  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !business) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBanner(true);

    try {
      const file = await compressImage(rawFile, {
        maxWidth: type === 'banner' ? 1600 : 800,
        maxHeight: type === 'banner' ? 800 : 800,
        quality: 0.85,
        mimeType: 'image/webp',
      });

      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'webp';
      const fileName = `${business.id}/branding-${type}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, { cacheControl: '31536000', contentType: file.type, upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(data.path);
        if (publicUrlData?.publicUrl) {
          if (type === 'logo') setLogoUrl(publicUrlData.publicUrl);
          else setBannerUrl(publicUrlData.publicUrl);
          toast.success(`Imagen de ${type === 'logo' ? 'logotipo' : 'portada'} cargada correctamente`);
        }
      } else if (error) {
        toast.error(`Error al subir imagen: ${error.message}`);
      }
    } catch (err: any) {
      toast.error(`Excepción al subir imagen: ${err.message}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setIsSaving(true);

    const brandingPayload: BusinessBranding = {
      slogan,
      banner_url: bannerUrl || undefined,
      favicon_url: faviconUrl || undefined,
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
      color_acento: colorAcento,
      color_fondo: colorFondo,
      color_texto: colorTexto,
      tipografia,
      estilo_botones: estiloBotones,
      tema_defecto: temaDefecto,
      patron_fondo: patronFondo,
    };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('businesses')
        .update({
          logo_url: logoUrl || null,
          branding: brandingPayload,
        })
        .eq('id', business.id);

      if (!error) {
        toast.success('¡Apariencia y Branding guardados exitosamente!', {
          description: 'Tu catálogo público ha sido actualizado con los nuevos colores y tipografía.',
        });
      } else {
        toast.error(`Error al guardar apariencia: ${error.message}`);
      }
    } catch (err: any) {
      toast.error(`Excepción al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !business) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
        <span>Cargando configuración de apariencia...</span>
      </div>
    );
  }

  // Mapeo de clase de botón para la previsualización
  const getButtonRadiusClass = () => {
    switch (estiloBotones) {
      case 'pill': return 'rounded-full';
      case 'semi-redondeado': return 'rounded-xl';
      case 'recto': return 'rounded-md';
      default: return 'rounded-2xl';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Fijo */}
      <div className="p-5 rounded-2xl bg-[#0F1420] border border-white/10 shadow-xl">
        <div>
          <h1 className="text-xl font-display font-black text-white tracking-tight flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-amber-400" />
            <span>Apariencia y Branding — {business.nombre}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Personaliza la identidad visual de tu catálogo digital, paleta de colores, tipografías y banners en tiempo real.
          </p>
        </div>
      </div>

      {/* Selector de Presets Profesionales */}
      <div className="space-y-2">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Temas Prediseñados 1-Click</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-2xl bg-[#0F1420] hover:bg-[#151C2C] border border-white/10 hover:border-amber-500/40 text-left transition-all group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs text-white">{preset.name}</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.color_primario }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.color_fondo }}></div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Layout de 2 Columnas: Controles a la Izquierda / Previsualización a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Formulario de Configuración (7 Cols) */}
        <form onSubmit={handleSaveBranding} className="lg:col-span-7 space-y-6">
          
          {/* 1. Identidad & Imágenes */}
          <div className="p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>1. Logotipo, Portada & Eslogan</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                  Eslogan o Tagline Comercial
                </label>
                <input
                  type="text"
                  placeholder="Ej: Panadería artesanal & café gourmet en Cuenca"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Carga de Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                    Logotipo Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1 flex-shrink-0">
                      <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadingLogo ? '...' : 'Subir'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadFile(e, 'logo')}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                </div>

                {/* Carga de Banner (Opcional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-display font-semibold text-slate-300">
                      Imagen de Fondo / Portada Hero <span className="text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    {bannerUrl && (
                      <button
                        type="button"
                        onClick={() => setBannerUrl('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Quitar Imagen
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    No es obligatoria. La mayoría de restaurantes operan solo con su Logo y Slogan.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://... (Opcional)"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1 flex-shrink-0">
                      <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadingBanner ? '...' : 'Subir'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadFile(e, 'banner')}
                        disabled={uploadingBanner}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Paleta de Colores */}
          <div className="p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>2. Paleta de Colores de Marca</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Color Primario (CTAs)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Color de Fondo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorFondo}
                    onChange={(e) => setColorFondo(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorFondo}
                    onChange={(e) => setColorFondo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Color de Texto</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorTexto}
                    onChange={(e) => setColorTexto(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorTexto}
                    onChange={(e) => setColorTexto(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Color Secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Color Acento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorAcento}
                    onChange={(e) => setColorAcento(e.target.value)}
                    className="w-9 h-9 rounded-xl border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorAcento}
                    onChange={(e) => setColorAcento(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Tipografía & Estilos de Componentes */}
          <div className="p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-sm text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-sky-400" />
              <span>3. Tipografía & Estilos Visuales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Familia Tipográfica</label>
                <CustomSelect
                  options={typographyOptions}
                  value={tipografia}
                  onChange={(val) => setTipografia(val as any)}
                  accentColor="amber"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Estilo de Botones</label>
                <CustomSelect
                  options={buttonStyleOptions}
                  value={estiloBotones}
                  onChange={(val) => setEstiloBotones(val as any)}
                  accentColor="amber"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Tema por Defecto</label>
                <CustomSelect
                  options={defaultThemeOptions}
                  value={temaDefecto}
                  onChange={(val) => setTemaDefecto(val as any)}
                  accentColor="amber"
                />
              </div>
            </div>
          </div>

          {/* 4. Patrón y Textura de Fondo del Catálogo */}
          <div className="p-6 rounded-3xl bg-[#0F1420] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>4. Estampa & Textura de Fondo del Catálogo</span>
              </h3>
              <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                5 Estilos
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Personaliza el fondo visual de tu catálogo público eligiendo entre 4 patrones dinámicos o un fondo oscuro limpio.
            </p>

            <div className="space-y-6">
              {(['Universal', 'Comida', 'Bebida', 'Dulces'] as const).map((cat) => {
                const catPatterns = PATTERNS_LIST.filter((p) => p.category === cat);
                if (catPatterns.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1 flex items-center justify-between">
                      <span>
                        {cat === 'Universal'
                          ? 'Universales y Texturas'
                          : cat === 'Comida'
                          ? 'Especialidades de Comida'
                          : cat === 'Bebida'
                          ? 'Bebidas y Copas'
                          : 'Heladerías y Dulces'}
                      </span>
                      <span className="text-[10px] font-normal lowercase text-slate-500">
                        {catPatterns.length} {catPatterns.length === 1 ? 'estilo' : 'estilos'}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                      {catPatterns.map((opt) => {
                        let previewNode = null;
                        if (opt.id === 'sin_patron') {
                          previewNode = (
                            <div className="w-full h-16 rounded-xl relative overflow-hidden border border-white/10 bg-[#07090E] mb-2.5 flex items-center justify-center text-[10px] font-mono text-slate-500">
                              <span>[ 100% Sólido ]</span>
                            </div>
                          );
                        } else {
                          const svgUrl = getPatternSvgUrl(opt.id, colorPrimario);
                          previewNode = (
                            <div
                              className="w-full h-16 rounded-xl relative overflow-hidden border border-white/10 bg-[#07090E] mb-2.5 opacity-70"
                              style={{
                                backgroundImage: `url("${svgUrl}")`,
                                backgroundRepeat: 'repeat',
                              }}
                            ></div>
                          );
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPatronFondo(opt.id)}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              patronFondo === opt.id
                                ? 'bg-purple-500/15 border-purple-500 text-white shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/40'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {previewNode}
                            <span className="font-display font-bold block text-[13px] text-white mb-0.5 truncate">
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-slate-400 leading-snug block line-clamp-2">
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* COLUMNA DERECHA: Previsualización en Tiempo Real (5 Cols - Sticky) */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Previsualización en Tiempo Real</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Vista Catálogo
            </span>
          </div>

          {/* Simulación del Catálogo en Vivo */}
          <div
            className="p-5 rounded-3xl border border-white/15 space-y-4 shadow-2xl transition-all overflow-hidden"
            style={{
              backgroundColor: colorFondo,
              color: colorTexto,
              fontFamily:
                tipografia === 'Playfair'
                  ? "'Playfair Display', Georgia, serif"
                  : tipografia === 'Inter'
                  ? "'Inter', sans-serif"
                  : tipografia === 'Plus Jakarta Sans'
                  ? "'Plus Jakarta Sans', sans-serif"
                  : "'Outfit', sans-serif",
            }}
          >
            {/* Header Simulado */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-white/20" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-950 text-sm"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    {business.nombre.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm leading-none" style={{ color: colorTexto }}>
                    {business.nombre}
                  </h4>
                  <p className="text-[10px] opacity-70 truncate max-w-[140px]">{slogan}</p>
                </div>
              </div>

              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-bold shadow-md ${getButtonRadiusClass()}`}
                style={{ backgroundColor: colorPrimario, color: colorFondo }}
              >
                Mi Pedido
              </button>
            </div>

            {/* Banner Simulado */}
            <div
              className="w-full h-28 rounded-2xl bg-slate-900 overflow-hidden relative border border-white/10 flex items-center justify-center text-center p-4"
              style={{
                backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!bannerUrl && (
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPrimario }}>
                    Especialidades de la Casa
                  </span>
                  <p className="text-[11px] opacity-90">{slogan}</p>
                </div>
              )}
            </div>

            {/* Tarjeta de Plato Simulada */}
            <div
              className="p-3.5 rounded-2xl border flex items-center gap-3 transition-all"
              style={{ backgroundColor: colorSecundario, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="w-14 h-14 rounded-xl bg-slate-950 overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold opacity-60">
                Plato
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs truncate" style={{ color: colorTexto }}>
                    Humita Gourmet
                  </h5>
                  <span className="font-mono text-xs font-bold" style={{ color: colorPrimario }}>
                    $2.50
                  </span>
                </div>
                <p className="text-[10px] opacity-70 line-clamp-1">Maíz tierno con queso fresco de hoja.</p>

                <button
                  type="button"
                  className={`w-full py-1 text-[11px] font-bold mt-1 shadow-sm ${getButtonRadiusClass()}`}
                  style={{ backgroundColor: colorPrimario, color: colorFondo }}
                >
                  + Agregar al Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Flotante de Guardado (Siempre disponible al hacer scroll) */}
      <div className="fixed bottom-6 right-6 md:right-8 z-40">
        <button
          type="button"
          onClick={handleSaveBranding}
          disabled={isSaving}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-display font-black text-xs md:text-sm shadow-2xl shadow-amber-500/30 border border-amber-400/30 flex items-center gap-2.5 active:scale-95 transition-all backdrop-blur-xl group"
        >
          <Save className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
          <span>{isSaving ? 'Guardando en Supabase...' : 'Guardar Apariencia'}</span>
        </button>
      </div>
    </div>
  );
}
