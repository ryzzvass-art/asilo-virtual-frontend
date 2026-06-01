// src/pages/nutricion/Nutricion.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Salad, Ban, AlertTriangle, CheckCircle2, Clock, FolderArchive,
  X, Plus, Pencil, Archive, Apple, ShieldX, UtensilsCrossed, Loader2, Trash2
} from 'lucide-react'
import { nutricionService } from '../../services/nutricionService'
import useAuthStore from '../../store/authStore'

// Clases cálidas reutilizables
const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

// ── Badges ─────────────────────────────────────────────────
function BadgeSeveridad({ severidad }) {
  const obligatorio = severidad === 'obligatorio'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border
      ${obligatorio ? 'bg-danger-100 text-danger-600 border-danger-600/20' : 'bg-alert-100 text-alert-600 border-alert-600/20'}`}>
      {obligatorio ? <Ban size={12} /> : <AlertTriangle size={12} />}
      {obligatorio ? 'Obligatorio' : 'Recomendado'}
    </span>
  )
}

function BadgeEstadoAlimento({ estado }) {
  const cfg = {
    activo:     { cls: 'bg-health-100 text-health-600 border-health-600/20', Icon: CheckCircle2,  label: 'Activo' },
    pendiente:  { cls: 'bg-alert-100 text-alert-600 border-alert-600/20',    Icon: Clock,         label: 'Pendiente' },
    archivado:  { cls: 'bg-gray-100 text-gray-500 border-gray-300',          Icon: FolderArchive, label: 'Archivado' },
  }
  const { cls, Icon, label } = cfg[estado] || cfg.archivado
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL RESTRICCIÓN
// ════════════════════════════════════════════════════════════
function ModalRestriccion({ restriccion, onClose, onGuardado }) {
  const esEdicion = !!restriccion
  const [form, setForm] = useState({
    nombre: restriccion?.nombre || '',
    descripcion: restriccion?.descripcion || '',
    condiciones_asociadas: restriccion?.condiciones_asociadas || '',
    severidad: restriccion?.severidad || 'obligatorio',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => esEdicion
      ? nutricionService.editarRestriccion(restriccion.id, data)
      : nutricionService.crearRestriccion(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al guardar')),
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <ShieldX size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">{esEdicion ? 'Editar' : 'Nueva'} restricción</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre</label>
            <input type="text" value={form.nombre} placeholder="Ej: Sin azúcar"
              onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Descripción</label>
            <textarea rows={2} value={form.descripcion} placeholder="Explicación clínica"
              onChange={e => setForm({ ...form, descripcion: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Condiciones asociadas</label>
            <input type="text" value={form.condiciones_asociadas} placeholder="Ej: Diabetes tipo 2, Diabetes"
              onChange={e => setForm({ ...form, condiciones_asociadas: e.target.value })} className={inputCls} />
            <p className="text-xs text-warm-400 mt-1">Separa varias con comas. Se usan para sugerir restricciones automáticamente.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Severidad</label>
            <select value={form.severidad}
              onChange={e => setForm({ ...form, severidad: e.target.value })}
              className={`${inputCls} cursor-pointer`}>
              <option value="obligatorio">Obligatorio (bloquea alimentos)</option>
              <option value="recomendado">Recomendado (solo advierte)</option>
            </select>
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400 sticky bottom-0 bg-white">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className={`flex-1 ${btnPrimario}`}>
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL ALIMENTO
// ════════════════════════════════════════════════════════════
function ModalAlimento({ alimento, onClose, onGuardado }) {
  const queryClient = useQueryClient()
  const esEdicion = !!alimento
  const [form, setForm] = useState({
    nombre: alimento?.nombre || '',
    grupo_alimentario: alimento?.grupo_alimentario || '',
  })
  const [error, setError] = useState('')
  const [restriccionSel, setRestriccionSel] = useState('')

  const { data: restricciones } = useQuery({
    queryKey: ['restricciones-activas'],
    queryFn: () => nutricionService.listarRestricciones(),
  })

  const { data: vinculadas } = useQuery({
    queryKey: ['restricciones-alimento', alimento?.id],
    queryFn: () => nutricionService.listarRestriccionesAlimento(alimento.id),
    enabled: esEdicion,
  })

  const mutGuardar = useMutation({
    mutationFn: (data) => esEdicion
      ? nutricionService.editarAlimento(alimento.id, data)
      : nutricionService.crearAlimento(data),
    onSuccess: () => { onGuardado(); if (!esEdicion) onClose() },
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al guardar')),
  })

  const mutVincular = useMutation({
    mutationFn: (rid) => nutricionService.vincularRestriccion(alimento.id, rid),
    onSuccess: () => {
      queryClient.invalidateQueries(['restricciones-alimento', alimento.id])
      queryClient.invalidateQueries(['alimentos'])
      setRestriccionSel('')
    },
  })

  const mutDesvincular = useMutation({
    mutationFn: (rid) => nutricionService.desvincularRestriccion(alimento.id, rid),
    onSuccess: () => {
      queryClient.invalidateQueries(['restricciones-alimento', alimento.id])
      queryClient.invalidateQueries(['alimentos'])
    },
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Apple size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">{esEdicion ? 'Editar' : 'Nuevo'} alimento</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre</label>
            <input type="text" value={form.nombre} placeholder="Ej: Arroz blanco"
              onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Grupo alimentario</label>
            <input type="text" value={form.grupo_alimentario} placeholder="Ej: cereal, lácteo, postre..."
              onChange={e => setForm({ ...form, grupo_alimentario: e.target.value })} className={inputCls} />
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}

          <button onClick={() => mutGuardar.mutate(form)} disabled={mutGuardar.isPending} className={`w-full ${btnPrimario}`}>
            {mutGuardar.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : (esEdicion ? 'Guardar cambios' : 'Crear alimento')}
          </button>

          {!esEdicion && (
            <p className="text-xs text-warm-400 text-center">
              Tras crearlo podrás vincular las restricciones que viola, editándolo.
            </p>
          )}

          {esEdicion && (
            <div className="border-t border-cream-400 pt-4">
              <h3 className="text-sm font-bold text-warm-700 mb-2">Restricciones que viola</h3>
              {vinculadas?.length === 0 ? (
                <p className="text-xs text-warm-400 mb-3">Ninguna restricción vinculada</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {vinculadas?.map(r => (
                    <div key={r.restriccion} className="flex items-center justify-between bg-warm-50 border border-cream-400/60 rounded-xl px-3 py-2 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-warm-800">{r.restriccion_nombre}</span>
                        <BadgeSeveridad severidad={r.restriccion_severidad} />
                      </div>
                      <button onClick={() => mutDesvincular.mutate(r.restriccion)}
                        className="text-xs text-danger-600 hover:text-danger-700 font-semibold inline-flex items-center gap-1 shrink-0 transition"><Trash2 size={12} /> Quitar</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select value={restriccionSel} onChange={e => setRestriccionSel(e.target.value)}
                  className={`flex-1 ${inputCls} cursor-pointer`}>
                  <option value="">Agregar restricción...</option>
                  {restricciones?.filter(r =>
                    !vinculadas?.some(v => v.restriccion === r.id)
                  ).map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} ({r.severidad})</option>
                  ))}
                </select>
                <button onClick={() => restriccionSel && mutVincular.mutate(restriccionSel)}
                  disabled={!restriccionSel || mutVincular.isPending}
                  className={btnPrimario}>
                  Vincular
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Nutricion() {
  const queryClient = useQueryClient()
  const esAdmin = useAuthStore(s => s.usuario)?.rol === 'administrador'

  const [tab, setTab] = useState('restricciones')
  const [modalRestriccion, setModalRestriccion] = useState(null)
  const [modalAlimento, setModalAlimento] = useState(null)
  const [filtroSeveridad, setFiltroSeveridad] = useState('')
  const [filtroEstadoR, setFiltroEstadoR] = useState('activo')

  const { data: restricciones, isLoading: cargandoR } = useQuery({
    queryKey: ['restricciones'],
    queryFn: () => nutricionService.listarRestricciones({ incluir_archivadas: true }),
  })

  const { data: alimentos, isLoading: cargandoA } = useQuery({
    queryKey: ['alimentos'],
    queryFn: () => nutricionService.listarAlimentos({ incluir_no_activos: true }),
  })

  const restriccionesFiltradas = restricciones?.filter(r => {
    if (filtroEstadoR === 'activo' && r.estado !== 'activo') return false
    if (filtroEstadoR === 'archivado' && r.estado !== 'archivado') return false
    if (filtroSeveridad && r.severidad !== filtroSeveridad) return false
    return true
  })

  const mutArchivarR = useMutation({
    mutationFn: (id) => nutricionService.archivarRestriccion(id),
    onSuccess: () => queryClient.invalidateQueries(['restricciones']),
  })

  const mutActivarA = useMutation({
    mutationFn: (id) => nutricionService.activarAlimento(id),
    onSuccess: () => queryClient.invalidateQueries(['alimentos']),
  })

  const tabs = [
    { key: 'restricciones', label: 'Restricciones', icon: ShieldX },
    { key: 'alimentos',     label: 'Alimentos',     icon: UtensilsCrossed },
  ]

  const Spinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ animation: 'fadeUp 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-warm-100 flex items-center justify-center">
            <Salad size={22} className="text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-warm-800 tracking-tight">Nutrición</h1>
            <p className="text-warm-600 text-sm">Catálogos de restricciones y alimentos</p>
          </div>
        </div>
        {esAdmin && (
          <button
            onClick={() => tab === 'restricciones' ? setModalRestriccion({}) : setModalAlimento({})}
            className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <Plus size={16} /> {tab === 'restricciones' ? 'Nueva restricción' : 'Nuevo alimento'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-cream-400 w-fit" style={{ animation: 'fadeUp 0.45s ease both' }}>
        {tabs.map(t => {
          const Icon = t.icon
          const activo = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2
                ${activo ? 'bg-gradient-to-br from-warm-600 to-warm-500 text-white shadow' : 'text-warm-600 hover:bg-warm-50'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Restricciones ── */}
      {tab === 'restricciones' && (
        <div className="space-y-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400 flex gap-3 flex-wrap">
            <select value={filtroEstadoR} onChange={e => setFiltroEstadoR(e.target.value)}
              className={`${inputCls} cursor-pointer min-w-40 flex-none`}>
              <option value="activo">Solo activos</option>
              <option value="todos">Todos</option>
            </select>
            <select value={filtroSeveridad} onChange={e => setFiltroSeveridad(e.target.value)}
              className={`${inputCls} cursor-pointer min-w-40 flex-none`}>
              <option value="">Toda severidad</option>
              <option value="obligatorio">Obligatorio</option>
              <option value="recomendado">Recomendado</option>
            </select>
          </div>

          {cargandoR ? <Spinner /> : (
            <>
              {/* TABLA escritorio */}
              <div className="nut-tabla bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-warm-50 border-b border-cream-400">
                      {['Restricción', 'Condiciones asociadas', 'Severidad', 'Acciones'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restriccionesFiltradas?.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-gray-400">Sin restricciones</td></tr>
                    ) : (
                      restriccionesFiltradas?.map((r, i) => (
                        <tr key={r.id} className={`hover:bg-warm-50 transition ${i < restriccionesFiltradas.length - 1 ? 'border-b border-warm-50' : ''}`}>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-warm-800">{r.nombre}</p>
                            <p className="text-xs text-warm-400">{r.descripcion}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-warm-600">{r.condiciones_asociadas || '—'}</td>
                          <td className="px-6 py-4"><BadgeSeveridad severidad={r.severidad} /></td>
                          <td className="px-6 py-4">
                            {esAdmin && (
                              <div className="flex gap-3">
                                <button onClick={() => setModalRestriccion(r)}
                                  className="text-warm-500 hover:text-warm-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Pencil size={13} /> Editar</button>
                                <button onClick={() => mutArchivarR.mutate(r.id)}
                                  className="text-danger-600 hover:text-danger-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Archive size={13} /> Archivar</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* CARDS móvil */}
              <div className="nut-cards hidden flex-col gap-3">
                {restriccionesFiltradas?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-cream-400 p-8 text-center text-gray-400 text-sm">Sin restricciones</div>
                ) : (
                  restriccionesFiltradas?.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-warm-800">{r.nombre}</p>
                        <BadgeSeveridad severidad={r.severidad} />
                      </div>
                      {r.descripcion && <p className="text-xs text-warm-500 mb-2">{r.descripcion}</p>}
                      <p className="text-sm text-warm-600"><span className="text-warm-400">Condiciones:</span> {r.condiciones_asociadas || '—'}</p>
                      {esAdmin && (
                        <div className="flex gap-3 pt-3 mt-3 border-t border-warm-50">
                          <button onClick={() => setModalRestriccion(r)} className="text-warm-500 text-sm font-semibold inline-flex items-center gap-1"><Pencil size={13} /> Editar</button>
                          <button onClick={() => mutArchivarR.mutate(r.id)} className="text-danger-600 text-sm font-semibold inline-flex items-center gap-1 ml-auto"><Archive size={13} /> Archivar</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Alimentos ── */}
      {tab === 'alimentos' && (
        <div style={{ animation: 'fadeUp 0.5s ease both' }}>
          {cargandoA ? <Spinner /> : (
            <>
              {/* TABLA escritorio */}
              <div className="nut-tabla bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-warm-50 border-b border-cream-400">
                      {['Alimento', 'Grupo', 'Restricciones que viola', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alimentos?.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-gray-400">Sin alimentos</td></tr>
                    ) : (
                      alimentos?.map((a, i) => (
                        <tr key={a.id} className={`hover:bg-warm-50 transition ${i < alimentos.length - 1 ? 'border-b border-warm-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                                <Apple size={16} className="text-warm-600" />
                              </div>
                              <span className="font-semibold text-warm-800">{a.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-warm-600">{a.grupo_alimentario}</td>
                          <td className="px-6 py-4">
                            {a.restricciones_que_viola?.length === 0 ? (
                              <span className="text-xs text-gray-400">Ninguna</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {a.restricciones_que_viola?.map(r => (
                                  <span key={r.id} className={`text-xs px-2 py-0.5 rounded-full
                                    ${r.severidad === 'obligatorio' ? 'bg-danger-100 text-danger-600' : 'bg-alert-100 text-alert-600'}`}>
                                    {r.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4"><BadgeEstadoAlimento estado={a.estado} /></td>
                          <td className="px-6 py-4">
                            {esAdmin && (
                              <div className="flex gap-3">
                                <button onClick={() => setModalAlimento(a)}
                                  className="text-warm-500 hover:text-warm-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Pencil size={13} /> Editar</button>
                                {a.estado === 'pendiente' && (
                                  <button onClick={() => mutActivarA.mutate(a.id)}
                                    className="text-health-600 hover:text-health-700 text-sm font-semibold inline-flex items-center gap-1 transition"><CheckCircle2 size={13} /> Activar</button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* CARDS móvil */}
              <div className="nut-cards hidden flex-col gap-3">
                {alimentos?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-cream-400 p-8 text-center text-gray-400 text-sm">Sin alimentos</div>
                ) : (
                  alimentos?.map(a => (
                    <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                          <Apple size={18} className="text-warm-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-warm-800">{a.nombre}</p>
                          <p className="text-xs text-warm-400">{a.grupo_alimentario}</p>
                        </div>
                        <BadgeEstadoAlimento estado={a.estado} />
                      </div>
                      {a.restricciones_que_viola?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {a.restricciones_que_viola?.map(r => (
                            <span key={r.id} className={`text-xs px-2 py-0.5 rounded-full
                              ${r.severidad === 'obligatorio' ? 'bg-danger-100 text-danger-600' : 'bg-alert-100 text-alert-600'}`}>
                              {r.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                      {esAdmin && (
                        <div className="flex gap-3 pt-3 border-t border-warm-50">
                          <button onClick={() => setModalAlimento(a)} className="text-warm-500 text-sm font-semibold inline-flex items-center gap-1"><Pencil size={13} /> Editar</button>
                          {a.estado === 'pendiente' && (
                            <button onClick={() => mutActivarA.mutate(a.id)} className="text-health-600 text-sm font-semibold inline-flex items-center gap-1 ml-auto"><CheckCircle2 size={13} /> Activar</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modales */}
      {modalRestriccion !== null && (
        <ModalRestriccion
          restriccion={modalRestriccion.id ? modalRestriccion : null}
          onClose={() => setModalRestriccion(null)}
          onGuardado={() => queryClient.invalidateQueries(['restricciones'])}
        />
      )}
      {modalAlimento !== null && (
        <ModalAlimento
          alimento={modalAlimento.id ? modalAlimento : null}
          onClose={() => setModalAlimento(null)}
          onGuardado={() => queryClient.invalidateQueries(['alimentos'])}
        />
      )}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 767px) {
          .nut-tabla { display: none !important; }
          .nut-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
