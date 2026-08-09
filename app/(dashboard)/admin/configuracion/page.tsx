'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building2, CreditCard, Clock, ShieldCheck, RefreshCw, QrCode, Banknote, Landmark, Smartphone, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';
import { BankDetails } from '@/lib/types/database';

const prepTimeOptions = [
  { value: '10 - 15 min', label: '10 - 15 min (Express / Comida Rápida)' },
  { value: '15 - 25 min', label: '15 - 25 min (Estándar / Cafetería & Bistro)' },
  { value: '25 - 40 min', label: '25 - 40 min (Platos Fuertes / Gourmet)' },
  { value: '40 - 60 min', label: '40 - 60 min (Especialidades / Horneados)' },
  { value: 'Inmediato / Listo', label: 'Inmediato / Listo (Empaquetados)' },
];

const ECUADOR_BANKS = [
  // Bancos Privados
  'Banco Pichincha',
  'Banco Guayaquil',
  'Produbanco',
  'Banco del Pacífico',
  'Banco del Austro',
  'Banco Internacional',
  'Banco Bolivariano',
  'Banco de Loja',
  'Banco Machala',
  'Banco Solidario',
  'Banco D-MIRO',
  'Banco ProCredit',
  'Citibank Ecuador',

  // Cooperativas de Ahorro y Crédito
  'Cooperativa JEP',
  'Cooperativa Jardín Azuayo',
  'Cooperativa Policía Nacional (CPN)',
  'Cooperativa Alianza del Valle',
  'Cooperativa 29 de Octubre',
  'Cooperativa Atuntaqui',
  'Cooperativa San Francisco',
  'Cooperativa Oscus',
  'Cooperativa Cacpeco',
  'Cooperativa Comercio',
  'Cooperativa Andalucía',
  'Cooperativa CoopNacional',
  'Cooperativa CACPE Loja',
  'Cooperativa Padre Julián Lorente',

  // Mutualistas & Estatales
  'Mutualista Pichincha',
  'Mutualista Azuay',
  'BanEcuador B.P.',
  'BIESS (Banco del IESS)',
  'Otro / Institución Financiera',
];

export default function AdminSettingsPage() {
  const { business, loading } = useAdminBusiness();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('yapi_simulated_role') || 'dueño';
      if (role !== 'dueño') {
        toast.error('Acceso denegado: solo el Administrador (Dueño) puede gestionar la configuración.');
        window.location.href = '/caja';
      } else {
        setAuthorized(true);
      }
    }
  }, []);

  // 1. Datos Comerciales del Negocio
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [direccion, setDireccion] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // 2. Tiempos & Modalidades
  const [tiempoPreparacion, setTiempoPreparacion] = useState('15 - 25 min');
  const [permiteDomicilio, setPermiteDomicilio] = useState(true);
  const [permiteRetiro, setPermiteRetiro] = useState(true);
  const [tipoServicioMesa, setTipoServicioMesa] = useState<'mesero' | 'barra'>('mesero');

  // 3. Configuración Específica por Método de Pago
  // Deuna!
  const [aceptaDeuna, setAceptaDeuna] = useState(true);
  const [deunaNumero, setDeunaNumero] = useState('');
  const [deunaTitular, setDeunaTitular] = useState('');

  // Transferencia Bancaria Directa (Soporte Múltiples Bancos)
  const [aceptaTransferencia, setAceptaTransferencia] = useState(true);
  const [cuentasBancarias, setCuentasBancarias] = useState<BankDetails[]>([]);

  // PayPhone
  const [aceptaPayphone, setAceptaPayphone] = useState(true);
  const [payphoneToken, setPayphoneToken] = useState('');
  const [showPayphoneToken, setShowPayphoneToken] = useState(false);

  // Efectivo
  const [aceptaEfectivo, setAceptaEfectivo] = useState(true);
  const [instruccionesEfectivo, setInstruccionesEfectivo] = useState('Pago en efectivo directamente al entregar el pedido o en caja.');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setNombre(business.nombre);
      setRuc(business.ruc || '');
      setTelefonoWhatsapp(business.telefono_whatsapp || '');
      setDireccion(business.direccion || '');
      setGoogleMapsUrl(business.configuracion_operativa?.google_maps_url || business.google_maps_url || '');
      setPayphoneToken(business.payphone_token || '');

      // Cargar Cuentas Bancarias
      const cuentas = business.cuentas_bancarias || business.configuracion_operativa?.cuentas_bancarias;
      if (cuentas && cuentas.length > 0) {
        setCuentasBancarias(cuentas);
      } else if (business.datos_bancarios && business.datos_bancarios.banco) {
        setCuentasBancarias([
          {
            id: 'bank-1',
            banco: business.datos_bancarios.banco || 'Banco Pichincha',
            tipo_cuenta: business.datos_bancarios.tipo_cuenta || 'Ahorros',
            numero_cuenta: business.datos_bancarios.numero_cuenta || '',
            titular: business.datos_bancarios.titular || business.nombre,
            ruc_ci: business.datos_bancarios.ruc_ci || business.ruc || '',
            activa: true,
          },
        ]);
      } else {
        setCuentasBancarias([
          {
            id: 'bank-1',
            banco: 'Banco Pichincha',
            tipo_cuenta: 'Ahorros',
            numero_cuenta: '',
            titular: business.nombre,
            ruc_ci: business.ruc || '',
            activa: true,
          },
        ]);
      }

      if (business.configuracion_operativa) {
        const op = business.configuracion_operativa;
        if (op.tiempo_preparacion) setTiempoPreparacion(op.tiempo_preparacion);
        if (op.permite_domicilio !== undefined) setPermiteDomicilio(op.permite_domicilio);
        if (op.permite_retiro !== undefined) setPermiteRetiro(op.permite_retiro);
        if (op.tipo_servicio_mesa) setTipoServicioMesa(op.tipo_servicio_mesa);

        if (op.acepta_deuna !== undefined) setAceptaDeuna(op.acepta_deuna);
        if (op.deuna_numero) setDeunaNumero(op.deuna_numero);
        if (op.deuna_titular) setDeunaTitular(op.deuna_titular);

        if (op.acepta_transferencia !== undefined) setAceptaTransferencia(op.acepta_transferencia);
        if (op.acepta_payphone !== undefined) setAceptaPayphone(op.acepta_payphone);
        if (op.acepta_efectivo !== undefined) setAceptaEfectivo(op.acepta_efectivo);
        if (op.instrucciones_efectivo) setInstruccionesEfectivo(op.instrucciones_efectivo);
      }
    }
  }, [business]);

  const handleAddAccount = () => {
    const newAcc: BankDetails = {
      id: `bank-${Date.now()}`,
      banco: 'Banco Pichincha',
      tipo_cuenta: 'Ahorros',
      numero_cuenta: '',
      titular: nombre || '',
      ruc_ci: ruc || '',
      activa: true,
    };
    setCuentasBancarias((prev) => [...prev, newAcc]);
    toast.info('Nueva cuenta bancaria agregada');
  };

  const handleUpdateAccount = (index: number, field: keyof BankDetails, value: any) => {
    setCuentasBancarias((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveAccount = (index: number) => {
    setCuentasBancarias((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setAceptaTransferencia(false);
        toast.info('Se desactivó la transferencia bancaria automáticamente al no tener cuentas.');
      }
      return updated;
    });
    toast.success('Cuenta eliminada');
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!business) return;

    setIsSaving(true);

    let finalAceptaDeuna = aceptaDeuna;
    if (aceptaDeuna && (!deunaNumero || deunaNumero.trim() === '')) {
      finalAceptaDeuna = false;
      setAceptaDeuna(false);
      toast.info('Deuna! fue desactivado automáticamente porque no ingresaste un número o alias de cobro.');
    }

    const primaryBank = cuentasBancarias[0] || {
      banco: 'Banco Pichincha',
      tipo_cuenta: 'Ahorros',
      numero_cuenta: '',
      titular: nombre,
      ruc_ci: ruc,
    };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('businesses')
        .update({
          nombre,
          ruc,
          telefono_whatsapp: telefonoWhatsapp,
          direccion,
          payphone_token: payphoneToken || null,
          datos_bancarios: {
            banco: primaryBank.banco,
            tipo_cuenta: primaryBank.tipo_cuenta,
            numero_cuenta: primaryBank.numero_cuenta,
            titular: primaryBank.titular,
            ruc_ci: primaryBank.ruc_ci || ruc,
            email: primaryBank.email || '',
          },
          configuracion_operativa: {
            tiempo_preparacion: tiempoPreparacion,
            permite_domicilio: permiteDomicilio,
            permite_retiro: permiteRetiro,
            tipo_servicio_mesa: tipoServicioMesa,
            google_maps_url: googleMapsUrl || undefined,

            acepta_deuna: finalAceptaDeuna,
            deuna_numero: deunaNumero,
            deuna_titular: deunaTitular,

            acepta_transferencia: aceptaTransferencia,
            banco: primaryBank.banco,
            tipo_cuenta: primaryBank.tipo_cuenta,
            numero_cuenta: primaryBank.numero_cuenta,
            titular: primaryBank.titular,
            ruc_ci: primaryBank.ruc_ci || ruc,
            cuentas_bancarias: cuentasBancarias,

            acepta_payphone: aceptaPayphone,

            acepta_efectivo: aceptaEfectivo,
            instrucciones_efectivo: instruccionesEfectivo,
          },
        })
        .eq('id', business.id);

      if (!error) {
        toast.success('Configuración guardada exitosamente');
      } else {
        toast.error(`Error guardando datos: ${error.message}`);
      }
    } catch (err: any) {
      toast.error(`Excepción: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !business || !authorized) {
    return (
      <div className="p-12 text-center text-slate-400 font-display text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Cargando datos de configuración desde Supabase...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-24">
      {/* Header Fijo Inmóvil */}
      <div className="bg-[#0D1322] p-5 rounded-3xl border border-white/10 glass-panel shadow-xl">
        <h1 className="text-xl font-display font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>Configuración de Empresa — {business.nombre}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configura tus datos comerciales, tiempos de entrega y personaliza la información de cada método de pago de forma independiente.
        </p>
      </div>



      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Perfil Comercial del Negocio */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <h2 className="font-display font-black text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>1. Datos Comerciales del Negocio</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Nombre Comercial</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">RUC del Negocio</label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">WhatsApp Notificaciones</label>
              <input
                type="text"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Dirección del Local en Cuenca</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-slate-300 mb-1">Enlace de Google Maps (Ubicación del Local)</label>
            <input
              type="url"
              placeholder="Ej: https://maps.app.goo.gl/... o https://goo.gl/maps/..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enlace directo al mapa de tu local que se abrirá cuando los clientes hagan clic en el botón "Maps" del catálogo.
            </p>
          </div>
        </div>

        {/* 2. Tiempos & Modalidades Operativas */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <h2 className="font-display font-black text-sm text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>2. Tiempos de Preparación & Modalidades de Entrega</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                Tiempo Estimado de Preparación
              </label>
              <CustomSelect
                options={prepTimeOptions}
                value={tiempoPreparacion}
                onChange={(val) => setTiempoPreparacion(val)}
                accentColor="emerald"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Este tiempo aparecerá visible para tus clientes en la cabecera de la carta.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-display font-semibold text-slate-300 mb-1">
                Modalidades de Entrega Habilitadas
              </label>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <CustomCheckbox
                  checked={permiteDomicilio}
                  onChange={setPermiteDomicilio}
                  label="Entrega a Domicilio"
                  description="Permite que tus clientes pidan despacho directo a su dirección"
                  accentColor="emerald"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <CustomCheckbox
                  checked={permiteRetiro}
                  onChange={setPermiteRetiro}
                  label="Retiro en Local / Takeaway"
                  description="Permite a los clientes hacer el pedido y retirarlo personalmente"
                  accentColor="emerald"
                />
              </div>
            </div>
          </div>

          {/* Modalidad de Servicio en Mesa (Dine-in) */}
          <div className="border-t border-white/5 pt-5 mt-2 space-y-3">
            <label className="block text-xs font-display font-semibold text-slate-300">
              Modalidad de Servicio en Mesa (Consumo en Local)
            </label>
            <p className="text-[11px] text-slate-400">
              ¿Cómo debe operar el flujo cuando el cliente realiza un pedido para consumir en el establecimiento?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipoServicioMesa('mesero')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  tipoServicioMesa === 'mesero'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${tipoServicioMesa === 'mesero' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                  Servicio Tradicional (Mesero a la Mesa)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  El cliente espera en la mesa y un mesero le sirve su comida directamente.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTipoServicioMesa('barra')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  tipoServicioMesa === 'barra'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${tipoServicioMesa === 'barra' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                  Autoservicio / Retiro en Caja (Estilo Fast Food)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  El cliente recibe una notificación y retira su comida de la barra/caja por su cuenta.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Configuración Independiente por Método de Pago */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6 shadow-xl">
          <div>
            <h2 className="font-display font-black text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>3. Métodos de Pago & Datos Específicos por Opción</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Habilita los métodos de pago deseados e ingresa la información requerida para que tus clientes puedan pagar de forma correcta.
            </p>
          </div>

          <div className="space-y-4">
            {/* A. Deuna! Pichincha */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white">Deuna! (Banco Pichincha)</h3>
                    <p className="text-[11px] text-slate-400">Cobro rápido mediante código QR o número registrado Deuna!</p>
                  </div>
                </div>

                <CustomCheckbox
                  checked={aceptaDeuna}
                  onChange={setAceptaDeuna}
                  label=""
                  accentColor="amber"
                />
              </div>

              {aceptaDeuna && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">
                      Teléfono / Alias Deuna!
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 0991234567"
                      value={deunaNumero}
                      onChange={(e) => setDeunaNumero(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">
                      Titular Deuna!
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Juan Pérez / Mi Empresa S.A."
                      value={deunaTitular}
                      onChange={(e) => setDeunaTitular(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* B. Transferencia Bancaria Directa (Múltiples Cuentas Bancarias) */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white flex items-center gap-2">
                      <span>Transferencia Bancaria Directa</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono font-semibold border border-sky-500/30">
                        {cuentasBancarias.length} {cuentasBancarias.length === 1 ? 'cuenta' : 'cuentas'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Configura una o varias cuentas bancarias para que tus clientes puedan elegir dónde transferir.</p>
                  </div>
                </div>

                <CustomCheckbox
                  checked={aceptaTransferencia}
                  onChange={(val) => {
                    setAceptaTransferencia(val);
                    if (val && cuentasBancarias.length === 0) {
                      handleAddAccount();
                    }
                  }}
                  label=""
                  accentColor="sky"
                />
              </div>

              {aceptaTransferencia && (
                <div className="space-y-4 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  {cuentasBancarias.map((acc, index) => (
                    <div key={acc.id || index} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 relative group">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-xs font-display font-bold text-sky-400 flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5" /> Cuenta Bancaria #{index + 1}
                        </span>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveAccount(index)}
                            title="Eliminar cuenta bancaria"
                            className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Eliminar</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Banco / Institución</label>
                          <CustomSelect
                            options={ECUADOR_BANKS.map((b) => ({ value: b, label: b }))}
                            value={acc.banco || 'Banco Pichincha'}
                            onChange={(val) => handleUpdateAccount(index, 'banco', val)}
                            accentColor="sky"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Tipo de Cuenta</label>
                          <input
                            type="text"
                            placeholder="Ej: Cuenta de Ahorros / Corriente"
                            value={acc.tipo_cuenta}
                            onChange={(e) => handleUpdateAccount(index, 'tipo_cuenta', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Número de Cuenta</label>
                          <input
                            type="text"
                            placeholder="Ej: 2200123456"
                            value={acc.numero_cuenta}
                            onChange={(e) => handleUpdateAccount(index, 'numero_cuenta', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Titular de la Cuenta</label>
                          <input
                            type="text"
                            placeholder="Nombre completo o Razón Social"
                            value={acc.titular}
                            onChange={(e) => handleUpdateAccount(index, 'titular', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">RUC / Cédula Identificación</label>
                          <input
                            type="text"
                            placeholder="Ej: 0104598123001"
                            value={acc.ruc_ci || ''}
                            onChange={(e) => handleUpdateAccount(index, 'ruc_ci', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-sky-500/40 bg-sky-500/5 text-sky-400 text-xs font-display font-semibold hover:bg-sky-500/10 hover:border-sky-500 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar Otra Cuenta Bancaria</span>
                  </button>
                </div>
              )}
            </div>

            {/* C. PayPhone Pasarela Online */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white flex items-center gap-2">
                      <span>PayPhone Ecuador (Tarjetas de Crédito / Débito)</span>
                      {!business.has_payphone && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono-tech font-bold border border-purple-500/30">
                          Módulo no contratado (+$9/m)
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">Cobro automatizado en línea con tarjetas Visa / Mastercard</p>
                  </div>
                </div>

                {business.has_payphone && (
                  <CustomCheckbox
                    checked={aceptaPayphone}
                    onChange={setAceptaPayphone}
                    label=""
                    accentColor="purple"
                  />
                )}
              </div>

              {!business.has_payphone ? (
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Activa la pasarela de cobros PayPhone para recibir pagos con tarjeta de crédito o débito en tu catálogo.
                  </p>
                  <a
                    href={`https://wa.me/593969307527?text=${encodeURIComponent(`Hola! Soy de ${business.nombre} (/${business.slug}). Me gustaría activar el módulo Add-on de PayPhone Tarjetas (+$9/mes) en Yapi.ec.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display font-bold text-xs shrink-0 shadow-lg shadow-purple-500/20 transition-all"
                  >
                    Solicitar Módulo por WhatsApp
                  </a>
                </div>
              ) : aceptaPayphone && (
                <div className="pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">
                    Token de Comercio PayPhone
                  </label>
                  <div className="relative">
                    <input
                      type={showPayphoneToken ? 'text' : 'password'}
                      placeholder="Token JWT proporcionado por PayPhone Ecuador"
                      value={payphoneToken}
                      onChange={(e) => setPayphoneToken(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPayphoneToken((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                      aria-label={showPayphoneToken ? 'Ocultar token' : 'Mostrar token'}
                    >
                      {showPayphoneToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* D. Efectivo Contra Entrega */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white">Efectivo Contra Entrega</h3>
                    <p className="text-[11px] text-slate-400">Cobro directo en efectivo al repartidor o en caja al retirar</p>
                  </div>
                </div>

                <CustomCheckbox
                  checked={aceptaEfectivo}
                  onChange={setAceptaEfectivo}
                  label=""
                  accentColor="emerald"
                />
              </div>

              {aceptaEfectivo && (
                <div className="pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">
                    Instrucciones para Pago en Efectivo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pago en efectivo al entregar. El cliente indicará si necesita cambio de billete."
                    value={instruccionesEfectivo}
                    onChange={(e) => setInstruccionesEfectivo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* ÚNICO BOTÓN DE GUARDADO FLOTANTE (Anclado a la esquina inferior derecha) */}
      <div className="fixed bottom-6 right-6 md:right-8 z-50">
        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={isSaving}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-xs md:text-sm shadow-2xl shadow-emerald-500/40 border border-emerald-400/30 flex items-center gap-2.5 active:scale-95 transition-all backdrop-blur-xl group"
        >
          <Save className="w-4 h-4 text-emerald-100 group-hover:rotate-12 transition-transform" />
          <span>{isSaving ? 'Guardando en Supabase...' : 'Guardar Cambios de Configuración'}</span>
        </button>
      </div>
    </div>
  );
}
