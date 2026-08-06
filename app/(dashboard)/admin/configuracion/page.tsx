'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building2, CreditCard, Clock, ShieldCheck, RefreshCw, QrCode, Banknote, Landmark, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminBusiness } from '@/hooks/useAdminBusiness';
import { createClient } from '@/lib/supabase/client';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomCheckbox } from '@/components/ui/CustomCheckbox';

const prepTimeOptions = [
  { value: '10 - 15 min', label: '10 - 15 min (Express / Comida Rápida)' },
  { value: '15 - 25 min', label: '15 - 25 min (Estándar / Cafetería & Bistro)' },
  { value: '25 - 40 min', label: '25 - 40 min (Platos Fuertes / Gourmet)' },
  { value: '40 - 60 min', label: '40 - 60 min (Especialidades / Horneados)' },
  { value: 'Inmediato / Listo', label: 'Inmediato / Listo (Empaquetados)' },
];

export default function AdminSettingsPage() {
  const { business, loading } = useAdminBusiness();

  // 1. Datos Comerciales del Negocio
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [direccion, setDireccion] = useState('');

  // 2. Tiempos & Modalidades
  const [tiempoPreparacion, setTiempoPreparacion] = useState('15 - 25 min');
  const [permiteDomicilio, setPermiteDomicilio] = useState(true);
  const [permiteRetiro, setPermiteRetiro] = useState(true);

  // 3. Configuración Específica por Método de Pago
  // Deuna!
  const [aceptaDeuna, setAceptaDeuna] = useState(true);
  const [deunaNumero, setDeunaNumero] = useState('');
  const [deunaTitular, setDeunaTitular] = useState('');

  // Transferencia Bancaria Directa
  const [aceptaTransferencia, setAceptaTransferencia] = useState(true);
  const [banco, setBanco] = useState('Banco Pichincha');
  const [tipoCuenta, setTipoCuenta] = useState('Ahorros');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titular, setTitular] = useState('');

  // PayPhone
  const [aceptaPayphone, setAceptaPayphone] = useState(true);
  const [payphoneToken, setPayphoneToken] = useState('');

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
      setPayphoneToken(business.payphone_token || '');

      if (business.datos_bancarios) {
        setBanco(business.datos_bancarios.banco || 'Banco Pichincha');
        setTipoCuenta(business.datos_bancarios.tipo_cuenta || 'Ahorros');
        setNumeroCuenta(business.datos_bancarios.numero_cuenta || '');
        setTitular(business.datos_bancarios.titular || '');
      }

      if (business.configuracion_operativa) {
        const op = business.configuracion_operativa;
        if (op.tiempo_preparacion) setTiempoPreparacion(op.tiempo_preparacion);
        if (op.permite_domicilio !== undefined) setPermiteDomicilio(op.permite_domicilio);
        if (op.permite_retiro !== undefined) setPermiteRetiro(op.permite_retiro);

        if (op.acepta_deuna !== undefined) setAceptaDeuna(op.acepta_deuna);
        if (op.deuna_numero) setDeunaNumero(op.deuna_numero);
        if (op.deuna_titular) setDeunaTitular(op.deuna_titular);

        if (op.acepta_transferencia !== undefined) setAceptaTransferencia(op.acepta_transferencia);
        if (op.banco) setBanco(op.banco);
        if (op.tipo_cuenta) setTipoCuenta(op.tipo_cuenta);
        if (op.numero_cuenta) setNumeroCuenta(op.numero_cuenta);
        if (op.titular) setTitular(op.titular);

        if (op.acepta_payphone !== undefined) setAceptaPayphone(op.acepta_payphone);
        if (op.acepta_efectivo !== undefined) setAceptaEfectivo(op.acepta_efectivo);
        if (op.instrucciones_efectivo) setInstruccionesEfectivo(op.instrucciones_efectivo);
      }
    }
  }, [business]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!business) return;

    setIsSaving(true);

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
            banco,
            tipo_cuenta: tipoCuenta,
            numero_cuenta: numeroCuenta,
            titular,
            ruc_ci: ruc,
            email: '',
          },
          configuracion_operativa: {
            tiempo_preparacion: tiempoPreparacion,
            permite_domicilio: permiteDomicilio,
            permite_retiro: permiteRetiro,

            acepta_deuna: aceptaDeuna,
            deuna_numero: deunaNumero,
            deuna_titular: deunaTitular,

            acepta_transferencia: aceptaTransferencia,
            banco,
            tipo_cuenta: tipoCuenta,
            numero_cuenta: numeroCuenta,
            titular,
            ruc_ci: ruc,

            acepta_payphone: aceptaPayphone,

            acepta_efectivo: aceptaEfectivo,
            instrucciones_efectivo: instruccionesEfectivo,
          },
        })
        .eq('id', business.id);

      if (!error) {
        toast.success('Configuración guardada exitosamente en Supabase');
      } else {
        toast.error(`Error guardando datos: ${error.message}`);
      }
    } catch (err: any) {
      toast.error(`Excepción: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !business) {
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

            {/* B. Transferencia Bancaria Directa */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-display font-bold text-white">Transferencia Bancaria Directa</h3>
                    <p className="text-[11px] text-slate-400">Datos bancarios para recibir transferencias con comprobante adjunto</p>
                  </div>
                </div>

                <CustomCheckbox
                  checked={aceptaTransferencia}
                  onChange={setAceptaTransferencia}
                  label=""
                  accentColor="sky"
                />
              </div>

              {aceptaTransferencia && (
                <div className="space-y-3 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Banco Institución</label>
                      <input
                        type="text"
                        placeholder="Ej: Banco Pichincha / Produbanco"
                        value={banco}
                        onChange={(e) => setBanco(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Tipo de Cuenta</label>
                      <input
                        type="text"
                        placeholder="Ej: Ahorros / Corriente"
                        value={tipoCuenta}
                        onChange={(e) => setTipoCuenta(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Número de Cuenta</label>
                      <input
                        type="text"
                        placeholder="Ej: 2200123456"
                        value={numeroCuenta}
                        onChange={(e) => setNumeroCuenta(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">Titular de la Cuenta</label>
                      <input
                        type="text"
                        placeholder="Nombre completo o Razón Social"
                        value={titular}
                        onChange={(e) => setTitular(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>
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
                    <h3 className="text-xs font-display font-bold text-white">PayPhone Ecuador (Tarjetas de Crédito / Débito)</h3>
                    <p className="text-[11px] text-slate-400">Cobro automatizado en línea con tarjetas Visa / Mastercard</p>
                  </div>
                </div>

                <CustomCheckbox
                  checked={aceptaPayphone}
                  onChange={setAceptaPayphone}
                  label=""
                  accentColor="purple"
                />
              </div>

              {aceptaPayphone && (
                <div className="pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-display font-medium text-slate-300 mb-1">
                    Token de Comercio PayPhone
                  </label>
                  <input
                    type="password"
                    placeholder="Token JWT proporcionado por PayPhone Ecuador"
                    value={payphoneToken}
                    onChange={(e) => setPayphoneToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                  />
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
