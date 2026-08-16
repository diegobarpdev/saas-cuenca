'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, CheckCircle2, Clock, AlertTriangle, X, Save, RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Business, BillingRecord } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/currency';
import { CustomSelect } from '@/components/ui/CustomSelect';

function calcularMonto(business: Business): number {
  let total = business.plan === 'pro' ? 30 : 15;
  if (business.has_payphone) total += 9;
  if (business.has_live_kitchen) total += 7;
  if (business.has_pos_printing) total += 7;
  if (business.has_crm_export) total += 5;
  if (business.has_facturacion_sri) total += 12;
  return total;
}

function getMesLabel(mes: string): string {
  const [year, month] = mes.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
}

function getMesActual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function navegarMes(mes: string, delta: number): string {
  const [year, month] = mes.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

type EstadoFilter = 'todos' | 'pendiente' | 'pagado' | 'vencido';

const estadoBadge = {
  pendiente: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  pagado: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  vencido: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const estadoIcon = {
  pendiente: <Clock className="w-3 h-3" />,
  pagado: <CheckCircle2 className="w-3 h-3" />,
  vencido: <AlertTriangle className="w-3 h-3" />,
};

interface RegistroPagoModal {
  record: BillingRecord;
  business: Business;
}

export default function SuperAdminFacturacionPage() {
  const [mes, setMes] = useState(getMesActual());
  const [filtro, setFiltro] = useState<EstadoFilter>('todos');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [modal, setModal] = useState<RegistroPagoModal | null>(null);

  // Modal state
  const [modalEstado, setModalEstado] = useState<'pagado' | 'vencido'>('pagado');
  const [modalTipoReceptor, setModalTipoReceptor] = useState<'consumidor_final' | 'ruc' | 'cedula'>('consumidor_final');
  const [modalNumDoc, setModalNumDoc] = useState('');
  const [modalRazonSocial, setModalRazonSocial] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalMetodo, setModalMetodo] = useState<'transferencia' | 'efectivo' | 'payphone'>('transferencia');
  const [modalFecha, setModalFecha] = useState(new Date().toISOString().split('T')[0]);
  const [modalNotas, setModalNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: biz }, { data: recs }] = await Promise.all([
      supabase.from('businesses').select('*').order('nombre'),
      supabase.from('billing_records').select('*').eq('mes', mes),
    ]);
    setBusinesses((biz as Business[]) || []);
    setRecords((recs as BillingRecord[]) || []);
    setLoading(false);
  }, [mes]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerarMes = async () => {
    setGenerando(true);
    setErrorMsg(null);
    const supabase = createClient();
    const activosConRecords = new Set(records.map((r) => r.business_id));
    const nuevos = businesses
      .filter((b) => b.plan !== 'trial' && !activosConRecords.has(b.id))
      .map((b) => ({
        business_id: b.id,
        mes,
        monto: calcularMonto(b),
        estado: 'pendiente',
      }));

    if (nuevos.length === 0) {
      setGenerando(false);
      return;
    }

    const { error } = await supabase.from('billing_records').insert(nuevos);
    if (error) setErrorMsg(error.message);
    await loadData();
    setGenerando(false);
  };

  const abrirModal = (record: BillingRecord, business: Business) => {
    setModal({ record, business });
    setModalEstado('pagado');
    setModalTipoReceptor('consumidor_final');
    setModalNumDoc(business.ruc || '');
    setModalRazonSocial(business.nombre);
    setModalEmail('');
    setModalMetodo('transferencia');
    setModalFecha(new Date().toISOString().split('T')[0]);
    setModalNotas('');
    setErrorMsg(null);
  };

  const handleGuardarPago = async () => {
    if (!modal) return;
    setSaving(true);
    setErrorMsg(null);
    const supabase = createClient();
    const updates: Partial<BillingRecord> = {
      estado: modalEstado,
      tipo_receptor: modalTipoReceptor,
      metodo_pago: modalEstado === 'pagado' ? modalMetodo : null,
      fecha_pago: modalEstado === 'pagado' ? new Date(modalFecha).toISOString() : null,
      notas: modalNotas || null,
    };
    if (modalTipoReceptor !== 'consumidor_final') {
      updates.num_doc = modalNumDoc || null;
      updates.razon_social = modalRazonSocial || null;
      updates.email_receptor = modalEmail || null;
    } else {
      updates.num_doc = null;
      updates.razon_social = null;
      updates.email_receptor = null;
    }

    const { error } = await supabase.from('billing_records').update(updates).eq('id', modal.record.id);
    if (error) { setErrorMsg(error.message); setSaving(false); return; }
    await loadData();
    setModal(null);
    setSaving(false);
  };

  // Merge businesses con records
  const rows = businesses
    .filter((b) => b.plan !== 'trial')
    .map((b) => ({
      business: b,
      record: records.find((r) => r.business_id === b.id) || null,
    }))
    .filter(({ record }) => filtro === 'todos' || (record?.estado === filtro) || (!record && filtro === 'pendiente'));

  const totalPagado = records.filter((r) => r.estado === 'pagado').reduce((s, r) => s + Number(r.monto), 0);
  const totalPendiente = records.filter((r) => r.estado === 'pendiente').reduce((s, r) => s + Number(r.monto), 0);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="font-bold text-sm text-zinc-100">Facturación Mensual</h1>
            <p className="text-xs text-zinc-400">Registra y gestiona los pagos de suscripción de cada negocio.</p>
          </div>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center gap-2">
          <button onClick={() => setMes((m) => navegarMes(m, -1))} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-zinc-100 min-w-[120px] text-center capitalize">
            {getMesLabel(mes)}
          </span>
          <button onClick={() => setMes((m) => navegarMes(m, 1))} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{errorMsg}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase">Negocios activos</span>
          <p className="text-xl font-mono font-bold text-zinc-100">{businesses.filter((b) => b.plan !== 'trial').length}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-purple-500/20 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase">Cobrado</span>
          <p className="text-xl font-mono font-bold text-purple-400">{formatCurrency(totalPagado)}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/20 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase">Pendiente</span>
          <p className="text-xl font-mono font-bold text-amber-400">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase">Sin registro</span>
          <p className="text-xl font-mono font-bold text-zinc-300">
            {businesses.filter((b) => b.plan !== 'trial' && !records.find((r) => r.business_id === b.id)).length}
          </p>
        </div>
      </div>

      {/* Acciones + Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(['todos', 'pendiente', 'pagado', 'vencido'] as EstadoFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filtro === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerarMes}
          disabled={generando}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
        >
          {generando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Generar registros del mes
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 text-xs">
          No hay registros para este mes y filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(({ business, record }) => (
            <div key={business.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0">
                  {business.nombre.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{business.nombre}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">/{business.slug}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                <span className="text-sm font-mono font-bold text-zinc-100">
                  {record ? formatCurrency(Number(record.monto)) : formatCurrency(calcularMonto(business))}
                </span>

                {record ? (
                  <>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${estadoBadge[record.estado]}`}>
                      {estadoIcon[record.estado]}
                      {record.estado.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {record.tipo_receptor === 'consumidor_final' ? 'Consumidor Final' : `${record.tipo_receptor.toUpperCase()}: ${record.num_doc || '—'}`}
                    </span>
                    {record.fecha_pago && (
                      <span className="text-[10px] text-zinc-500">
                        {new Date(record.fecha_pago).toLocaleDateString('es-EC')}
                      </span>
                    )}
                    {record.estado !== 'pagado' && (
                      <button
                        onClick={() => abrirModal(record, business)}
                        className="px-3 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-medium border border-purple-500/30 transition-colors"
                      >
                        Registrar pago
                      </button>
                    )}
                    {record.estado === 'pagado' && (
                      <button
                        onClick={() => abrirModal(record, business)}
                        className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium border border-zinc-700 transition-colors"
                      >
                        Editar
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-zinc-500 italic">Sin registro — usa "Generar"</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Registrar Pago */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-purple-500/20 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-zinc-100">Registrar Pago</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{modal.business.nombre} — {getMesLabel(mes)}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{errorMsg}</div>
            )}

            <div className="space-y-3.5">
              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Estado</label>
                <CustomSelect
                  options={[
                    { value: 'pagado', label: 'Pagado' },
                    { value: 'vencido', label: 'Vencido' },
                  ]}
                  value={modalEstado}
                  onChange={(v) => setModalEstado(v as any)}
                  accentColor="purple"
                />
              </div>

              {/* Tipo receptor */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de receptor</label>
                <CustomSelect
                  options={[
                    { value: 'consumidor_final', label: 'Consumidor Final' },
                    { value: 'ruc', label: 'RUC' },
                    { value: 'cedula', label: 'Cédula' },
                  ]}
                  value={modalTipoReceptor}
                  onChange={(v) => setModalTipoReceptor(v as any)}
                  accentColor="purple"
                />
              </div>

              {/* Datos fiscales si aplica */}
              {modalTipoReceptor !== 'consumidor_final' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      {modalTipoReceptor === 'ruc' ? 'RUC' : 'Cédula'}
                    </label>
                    <input
                      type="text"
                      value={modalNumDoc}
                      onChange={(e) => setModalNumDoc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                      placeholder={modalTipoReceptor === 'ruc' ? '0104598123001' : '0104598123'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Razón Social</label>
                    <input
                      type="text"
                      value={modalRazonSocial}
                      onChange={(e) => setModalRazonSocial(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
                      placeholder="Nombre o razón social"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Email receptor</label>
                    <input
                      type="email"
                      value={modalEmail}
                      onChange={(e) => setModalEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
                      placeholder="facturacion@empresa.com"
                    />
                  </div>
                </>
              )}

              {/* Método y fecha solo si pagado */}
              {modalEstado === 'pagado' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Método de pago</label>
                    <CustomSelect
                      options={[
                        { value: 'transferencia', label: 'Transferencia Bancaria' },
                        { value: 'efectivo', label: 'Efectivo' },
                        { value: 'payphone', label: 'PayPhone' },
                      ]}
                      value={modalMetodo}
                      onChange={(v) => setModalMetodo(v as any)}
                      accentColor="purple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha de pago</label>
                    <input
                      type="date"
                      value={modalFecha}
                      onChange={(e) => setModalFecha(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                  </div>
                </>
              )}

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={modalNotas}
                  onChange={(e) => setModalNotas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Referencia, comprobante, etc."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPago}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
