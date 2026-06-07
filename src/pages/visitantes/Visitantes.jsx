// src/pages/visitantes/Visitantes.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LogIn, LogOut, X, Search, UserPlus, Users, ArrowRight, ArrowLeft,
  Check, CheckCircle2, AlertTriangle, Clock, CalendarHeart, House,
  ClipboardList, Circle, Loader2, Pencil, ShieldCheck, ShieldOff
} from 'lucide-react'
import { visitantesService } from '../../services/visitantesService'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

// Extrae un mensaje de error legible desde la respuesta del backend.
// Maneja: { error }, { detalle }, { detail }, non_field_errors,
// errores por campo del serializer, y fallos de red.
function extraerError(err, fallback = 'Ocurrió un error inesperado.') {
  const data = err?.response?.data
  if (!data) {
    if (err?.message) return `No se pudo conectar con el servidor (${err.message}).`
    return fallback
  }
  if (typeof data === 'string') return data
  if (typeof data.error === 'string')   return data.error
  if (typeof data.detalle === 'string') return data.detalle
  if (typeof data.detail === 'string')  return data.detail
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return data.non_field_errors.join(' ')
  }
  const partes = []
  for (const valor of Object.values(data)) {
    partes.push(Array.isArray(valor) ? valor.join(' ') : String(valor))
  }
  return partes.length ? partes.join(' ') : fallback
}

// Paginador con numeración — copia del patrón usado en Nutrición.
function PaginadorSimple({ pagina, total, porPagina, onChange }) {
  const totalPaginas = Math.ceil(total / porPagina)
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-cream-400 bg-warm-50/50 flex-wrap gap-2">
      <p className="text-xs text-warm-400">
        Mostrando {Math.min((pagina - 1) * porPagina + 1, total)}–{Math.min(pagina * porPagina, total)} de {total}
      </p>
      <div className="flex gap-1 flex-wrap">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1}
          className="px-3 py-1.5 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
          ← Anterior
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition
              ${n === pagina ? 'bg-warm-600 text-white border-warm-600' : 'border-cream-400 text-warm-600 hover:bg-warm-100'}`}>
            {n}
          </button>
        ))}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas}
          className="px-3 py-1.5 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Siguiente →
        </button>
      </div>
    </div>
  )
}

function tiempoTranscurrido(fechaEntrada) {
  if (!fechaEntrada) return '—'
  const diff = Math.floor((new Date() - new Date(fechaEntrada)) / 60000)
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h ${diff % 60}min`
}

const RELACION_LABEL = {
  familiar: 'Familiar',
  amigo: 'Amigo',
  representante_legal: 'Representante legal',
  otro: 'Otro',
}

// ════════════════════════════════════════════════════════════
// MODAL NUEVA VISITA (wizard 3 pasos)
// ════════════════════════════════════════════════════════════
function ModalNuevaVisita({ onClose, onGuardado }) {
  const [paso, setPaso] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [visitante, setVisitante] = useState(null)
  const [autorizacion, setAutorizacion] = useState(null)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')

  const { data: visitantes, isFetching: buscando } = useQuery({
    queryKey: ['buscar-visitante', busqueda],
    queryFn: () => visitantesService.buscar(busqueda),
    enabled: busqueda.length >= 2,
  })

  const { data: autorizaciones, isLoading: cargandoAuth } = useQuery({
    queryKey: ['autorizaciones-visitante', visitante?.id],
    queryFn: () => visitantesService.listarAutorizaciones(visitante.id),
    enabled: !!visitante && paso === 2,
  })

  const mutation = useMutation({
    mutationFn: (data) => visitantesService.registrarIngreso(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo registrar el ingreso.')),
  })

  const autorizacionesActivas = autorizaciones?.filter(a => a.estado === 'activo') || []

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-lg" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-start gap-3 p-5 border-b border-cream-400 bg-warm-50 rounded-t-[22px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <LogIn size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Registrar Nueva Visita</h2>
            <div className="flex items-center gap-2 mt-3">
              {['Visitante', 'Residente', 'Confirmar'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition
                      ${paso > i + 1 ? 'bg-health-600 text-white' : paso === i + 1 ? 'bg-warm-500 text-white' : 'bg-cream-300 text-warm-400'}`}>
                      {paso > i + 1 ? <Check size={12} /> : i + 1}
                    </div>
                    <span className={`text-xs ${paso === i + 1 ? 'text-warm-700 font-semibold' : 'text-warm-400'}`}>{label}</span>
                  </div>
                  {i < 2 && <div className={`w-6 h-0.5 ${paso > i + 1 ? 'bg-health-600' : 'bg-cream-300'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition shrink-0"><X size={16} /></button>
        </div>

        <div className="p-5">
          {paso === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-warm-500">Busca al visitante por su nombre o número de C.I.</p>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
                <input type="text" placeholder="Escribe nombre o C.I...." value={busqueda}
                  onChange={e => setBusqueda(e.target.value)} autoFocus
                  className={`${inputCls} pl-10 py-3`} />
              </div>
              {buscando && <p className="text-sm text-warm-400 text-center py-2">Buscando...</p>}
              {busqueda.length >= 2 && !buscando && visitantes?.length === 0 && (
                <div className="text-center py-6 text-warm-400">
                  <Search size={28} className="mx-auto mb-2 text-cream-400" />
                  <p className="text-sm">No se encontró ningún visitante</p>
                </div>
              )}
              {visitantes?.length > 0 && (
                <ul className="border border-cream-400 rounded-xl overflow-hidden divide-y divide-warm-50 max-h-64 overflow-y-auto">
                  {visitantes.map(v => (
                    <li key={v.id}>
                      <button onClick={() => { setVisitante(v); setPaso(2); setError('') }}
                        className="w-full text-left px-4 py-3 hover:bg-warm-50 transition flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-health-100 flex items-center justify-center text-health-600 font-bold text-sm shrink-0">{v.nombre ? v.nombre[0] : '?'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-warm-800 text-sm">{v.nombre}</p>
                          <p className="text-xs text-warm-400">C.I.: {v.dni} · Tel: {v.telefono}</p>
                        </div>
                        <span className="text-warm-500 text-sm font-medium inline-flex items-center gap-1 shrink-0">Elegir <ArrowRight size={13} /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {paso === 2 && visitante && (
            <div className="space-y-4">
              <div className="bg-warm-50 border border-cream-400 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-health-100 flex items-center justify-center text-health-600 font-bold text-sm shrink-0">{visitante.nombre ? visitante.nombre[0] : '?'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-800 text-sm">{visitante.nombre}</p>
                  <p className="text-xs text-warm-400">C.I.: {visitante.dni}</p>
                </div>
                <button onClick={() => { setPaso(1); setVisitante(null) }} className="text-xs text-warm-600 hover:text-warm-800 font-semibold">Cambiar</button>
              </div>
              <p className="text-sm text-warm-500">¿A quién viene a visitar?</p>
              {cargandoAuth ? (
                <p className="text-sm text-warm-400 text-center py-6">Cargando autorizaciones...</p>
              ) : autorizacionesActivas.length === 0 ? (
                <div className="text-center py-6 bg-alert-100 rounded-xl border border-alert-600/25">
                  <AlertTriangle size={28} className="mx-auto mb-2 text-alert-600" />
                  <p className="text-sm text-alert-600 font-semibold">Este visitante no tiene autorizaciones activas</p>
                  <p className="text-xs text-alert-600/80 mt-1 px-4">Autorízalo desde la ficha del residente</p>
                </div>
              ) : (
                <ul className="border border-cream-400 rounded-xl overflow-hidden divide-y divide-warm-50 max-h-64 overflow-y-auto">
                  {autorizacionesActivas.map(a => (
                    <li key={a.id}>
                      <button onClick={() => { setAutorizacion(a); setPaso(3); setError('') }}
                        className="w-full text-left px-4 py-3 hover:bg-warm-50 transition flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center text-warm-600 font-bold text-sm shrink-0">
                          {a.residente_nombre ? a.residente_nombre.split(' ').map(n => n[0]).slice(0,2).join('') : 'R'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-warm-800 text-sm">{a.residente_nombre}</p>
                          <p className="text-xs text-warm-400">{RELACION_LABEL[a.relacion] || a.relacion}</p>
                        </div>
                        <span className="text-warm-500 text-sm font-medium inline-flex items-center gap-1 shrink-0">Elegir <ArrowRight size={13} /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => { setPaso(1); setVisitante(null) }}
                className={`w-full ${btnSecundario} flex items-center justify-center gap-1`}><ArrowLeft size={14} /> Atrás</button>
            </div>
          )}

          {paso === 3 && autorizacion && (
            <div className="space-y-4">
              <div className="bg-warm-50 border border-cream-400 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-warm-500">Visitante</span><span className="font-semibold text-warm-800">{visitante.nombre}</span></div>
                <div className="flex justify-between text-sm"><span className="text-warm-500">Residente</span><span className="font-semibold text-warm-800">{autorizacion.residente_nombre}</span></div>
                <div className="flex justify-between text-sm"><span className="text-warm-500">Relación</span><span className="font-semibold text-warm-800">{RELACION_LABEL[autorizacion.relacion]}</span></div>
                <div className="flex justify-between text-sm"><span className="text-warm-500">Hora de entrada</span><span className="font-semibold text-warm-800">{new Date().toLocaleTimeString('es-BO')}</span></div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Observaciones (opcional)</label>
                <input type="text" value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Visita de rutina" className={inputCls} />
              </div>
              {error && <div className="bg-danger-100 border border-danger-600/25 rounded-xl p-3 text-danger-600 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => { setPaso(2); setError('') }}
                  className={`flex-1 ${btnSecundario} flex items-center justify-center gap-1`}><ArrowLeft size={14} /> Atrás</button>
                <button onClick={() => mutation.mutate({
                  visitante_id: visitante.id, residente_id: autorizacion.residente, observaciones,
                })} disabled={mutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-br from-health-600 to-health-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                  {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Registrando…</> : <><CheckCircle2 size={15} /> Confirmar ingreso</>}
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
// MODAL NUEVO VISITANTE
// ════════════════════════════════════════════════════════════
function ModalNuevoVisitante({ onClose, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '' })
  const [autorizarAhora, setAutorizarAhora] = useState(false)
  const [autForm, setAutForm] = useState({ residente_id: '', relacion: 'familiar' })
  const [textoBusqueda, setTextoBusqueda] = useState('') 
  const [error, setError] = useState('')

  const { data: residentesData } = useQuery({
    queryKey: ['residentes-activos-todos'],
    queryFn: () => residentesService.listar({ 
      estado: 'activo',
      page_size: 500
    }),
    enabled: autorizarAhora,
  })

  const residentes = residentesData?.results || []

  const mutation = useMutation({
    mutationFn: async (data) => {
      const visitante = await visitantesService.crear(data)
      if (autorizarAhora && autForm.residente_id) {
        await visitantesService.autorizar(
          visitante.id, autForm.residente_id, { relacion: autForm.relacion }
        )
      }
      return visitante
    },
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo crear el visitante.')),
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <UserPlus size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">Nuevo Visitante</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Nombre completo', key: 'nombre',   placeholder: 'Ej: Carlos Mamani' },
            { label: 'C.I.',            key: 'dni',      placeholder: 'Ej: 9876543' },
            { label: 'Teléfono',        key: 'telefono', placeholder: 'Ej: 70012345' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">{label}</label>
              <input type="text" value={form[key] || ''} placeholder={placeholder}
                onChange={e => setForm({ ...form, [key]: e.target.value })} className={inputCls} />
            </div>
          ))}

          <div className="border-t border-cream-400 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={autorizarAhora}
                onChange={e => setAutorizarAhora(e.target.checked)}
                className="w-4 h-4 rounded accent-warm-500" />
              <span className="text-sm font-semibold text-warm-700">Autorizar a un residente ahora</span>
            </label>
            {autorizarAhora && (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-1.5">Residente</label>
                  <div className="relative">
                    <input 
                      list="residentes-list"
                      placeholder="Escribe nombre, apellido o C.I..."
                      value={textoBusqueda}
                      onChange={(e) => {
                        const valorInput = e.target.value
                        setTextoBusqueda(valorInput)

                        const selected = residentes.find(r => {
                          const stringIdentificacion = `${r?.nombre || ''} ${r?.apellido || ''} [C.I.: ${r?.dni || ''}]`.trim().toLowerCase()
                          return stringIdentificacion === valorInput.toLowerCase()
                        })

                        if (selected) {
                          setAutForm({ ...autForm, residente_id: selected.id })
                        } else {
                          setAutForm({ ...autForm, residente_id: '' })
                        }
                      }}
                      className={`${inputCls} cursor-pointer`}
                    />
                    <datalist id="residentes-list">
                      {residentes.map(r => {
                        const valorCompleto = `${r?.nombre || ''} ${r?.apellido || ''} [C.I.: ${r?.dni || ''}]`.trim()
                        return (
                          <option key={r.id} value={valorCompleto} />
                        )
                      })}
                    </datalist>
                  </div>
                  {autForm.residente_id && (
                    <p className="text-xs text-health-600 font-medium mt-1 flex items-center gap-1">
                      <Check size={12} /> Residente seleccionado correctamente.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-1.5">Relación</label>
                  <select value={autForm.relacion}
                    onChange={e => setAutForm({ ...autForm, relacion: e.target.value })}
                    className={`${inputCls} cursor-pointer`}>
                    <option value="familiar">Familiar</option>
                    <option value="amigo">Amigo</option>
                    <option value="representante_legal">Representante legal</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400 sticky bottom-0 bg-white">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || (autorizarAhora && !autForm.residente_id)} className={`flex-1 ${btnPrimario}`}>
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
// ── Modal: editar visitante ───────────────────────────────
function ModalEditarVisitante({ visitante, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre:   visitante.nombre   || '',
    dni:      visitante.dni      || '',
    telefono: visitante.telefono || '',
  })
  const [error, setError] = useState('')

  const mutacion = useMutation({
    mutationFn: () => visitantesService.actualizar(visitante.id, form),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo actualizar el visitante.')),
  })

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim() || !form.dni.trim()) {
      setError('Nombre y C.I. son obligatorios.')
      return
    }
    mutacion.mutate()
  }

  return (
    <div className="fixed inset-0 bg-warm-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()} style={{ animation: 'modalPop 0.25s ease' }}>
        <div className="p-5 border-b border-cream-300 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center">
            <Pencil size={16} className="text-warm-600" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">Editar visitante</h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-warm-700 mb-1 block">Nombre completo *</label>
            <input className={inputCls} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-warm-700 mb-1 block">C.I. *</label>
            <input className={inputCls} value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-warm-700 mb-1 block">Teléfono</label>
            <input className={inputCls} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
          {error && (
            <div className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-xl px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
            <button type="submit" disabled={mutacion.isPending} className={`flex-1 ${btnPrimario}`}>
              {mutacion.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: gestionar autorizaciones del visitante ─────────
function ModalGestionarAutorizaciones({ visitante, esAdmin, onClose }) {
  const queryClient = useQueryClient()
  const [residenteSel, setResidenteSel] = useState('')
  const [relacion, setRelacion] = useState('familiar')
  const [error, setError] = useState('')

  const { data: autorizaciones, isLoading } = useQuery({
    queryKey: ['visitante-autorizaciones', visitante.id],
    queryFn: () => visitantesService.listarAutorizaciones(visitante.id),
  })

  const { data: residentesData } = useQuery({
    queryKey: ['residentes-activos-modal-auth'],
    queryFn: () => residentesService.listar({ estado: 'activo', page_size: 500 }),
    enabled: esAdmin,
  })
  const residentes = residentesData?.results || []

  const invalidar = () => {
    queryClient.invalidateQueries(['visitante-autorizaciones', visitante.id])
    queryClient.invalidateQueries(['lista-visitantes'])
  }

  const autorizar = useMutation({
    mutationFn: () => visitantesService.autorizar(visitante.id, residenteSel, { relacion }),
    onSuccess: () => { setResidenteSel(''); setError(''); invalidar() },
    onError: (err) => setError(extraerError(err, 'No se pudo autorizar.')),
  })

  const suspender = useMutation({
    mutationFn: (residenteId) => visitantesService.suspender(visitante.id, residenteId),
    onSuccess: invalidar,
    onError: (err) => setError(extraerError(err, 'No se pudo suspender.')),
  })

  // El endpoint POST /autorizar/ reactiva automáticamente las autorizaciones suspendidas
  const reactivar = useMutation({
    mutationFn: ({ residenteId, relacion }) =>
      visitantesService.autorizar(visitante.id, residenteId, { relacion }),
    onSuccess: invalidar,
    onError: (err) => setError(extraerError(err, 'No se pudo reactivar.')),
  })

  // Residentes que aún no están autorizados (para el dropdown)
  const idsAutorizados = new Set((autorizaciones || []).map(a => a.residente))
  const residentesDisponibles = residentes.filter(r => !idsAutorizados.has(r.id))

  return (
    <div className="fixed inset-0 bg-warm-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()} style={{ animation: 'modalPop 0.25s ease' }}>
        <div className="p-5 border-b border-cream-300 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center">
            <ShieldCheck size={16} className="text-warm-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Autorizaciones</h2>
            <p className="text-xs text-warm-500">{visitante.nombre} — C.I. {visitante.dni}</p>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Lista de autorizaciones existentes */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="animate-spin text-warm-400" />
            </div>
          ) : !autorizaciones || autorizaciones.length === 0 ? (
            <div className="text-center py-8 bg-warm-50 rounded-xl border border-dashed border-cream-400">
              <Users size={32} className="mx-auto text-cream-400 mb-2" />
              <p className="text-warm-700 font-semibold text-sm">Sin autorizaciones</p>
              <p className="text-warm-400 text-xs mt-0.5">Este visitante aún no está autorizado para ningún residente.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {autorizaciones.map(a => (
                <li key={a.id} className="flex items-center gap-3 p-3 bg-warm-50 border border-cream-300 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-warm-800 truncate">{a.residente_nombre}</div>
                    <div className="text-xs text-warm-500">
                      {RELACION_LABEL[a.relacion] || a.relacion}
                      {' · '}
                      <span className={a.estado === 'activo' ? 'text-health-600 font-semibold' : 'text-danger-600 font-semibold'}>
                        {a.estado === 'activo' ? 'Activa' : 'Suspendida'}
                      </span>
                    </div>
                  </div>
                  {esAdmin && a.estado === 'activo' && (
                    <button
                      onClick={() => suspender.mutate(a.residente)}
                      disabled={suspender.isPending}
                      className="px-2.5 py-1.5 text-xs font-bold text-danger-700 border border-danger-200 bg-danger-50 hover:bg-danger-100 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50">
                      <ShieldOff size={12} /> Suspender
                    </button>
                  )}
                  {esAdmin && a.estado === 'suspendido' && (
                    <button
                      onClick={() => reactivar.mutate({ residenteId: a.residente, relacion: a.relacion })}
                      disabled={reactivar.isPending}
                      className="px-2.5 py-1.5 text-xs font-bold text-health-700 border border-health-200 bg-health-50 hover:bg-health-100 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50">
                      <ShieldCheck size={12} /> Reactivar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Formulario para autorizar a un nuevo residente (solo admin) */}
          {esAdmin && (
            <div className="pt-4 border-t border-cream-300">
              <div className="text-xs font-bold text-warm-700 mb-2">Autorizar para otro residente</div>
              {residentesDisponibles.length === 0 ? (
                <p className="text-xs text-warm-500 italic">Ya está autorizado para todos los residentes activos.</p>
              ) : (
                <div className="space-y-2">
                  <select className={inputCls} value={residenteSel} onChange={e => setResidenteSel(e.target.value)}>
                    <option value="">Selecciona un residente…</option>
                    {residentesDisponibles.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
                    ))}
                  </select>
                  <select className={inputCls} value={relacion} onChange={e => setRelacion(e.target.value)}>
                    {Object.entries(RELACION_LABEL).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => residenteSel && autorizar.mutate()}
                    disabled={!residenteSel || autorizar.isPending}
                    className={`w-full ${btnPrimario}`}>
                    {autorizar.isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    Autorizar
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-xl px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Visitas() {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [tab, setTab] = useState('activas')
  const [modalNuevaVisita, setModalNuevaVisita] = useState(false)
  const [modalNuevoVisitante, setModalNuevoVisitante] = useState(false)
  const [visitanteEditar, setVisitanteEditar] = useState(null)
  const [visitanteAutorizaciones, setVisitanteAutorizaciones] = useState(null)
  const [salidaRegistrada, setSalidaRegistrada] = useState(null)

  const [filtroResidenteId, setFiltroResidenteId] = useState('') 
  const [textoBusquedaHistorial, setTextoBusquedaHistorial] = useState('') 
  const [filtroFecha, setFiltroFecha] = useState('')
  const [, setTick] = useState(0)

  // Paginación en cliente (patrón Nutrición) — 10 por página en todas las pestañas
  const POR_PAGINA = 10
  const [busquedaVisitantes, setBusquedaVisitantes] = useState('')
  const [paginaVisitantes, setPaginaVisitantes] = useState(1)
  const [paginaActivas, setPaginaActivas]       = useState(1)
  const [paginaHistorial, setPaginaHistorial]   = useState(1)

  useEffect(() => {
    const intervalo = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(intervalo)
  }, [])

  const { data: visitasActivas, isLoading: cargandoActivas } = useQuery({
    queryKey: ['visitas-activas'],
    queryFn: () => visitantesService.listarVisitas({ estado: 'en_curso' }),
    refetchInterval: 30000,
  })

  const { data: residentesData } = useQuery({
    queryKey: ['residentes-activos-historial'],
    queryFn: () => residentesService.listar({ 
      estado: 'activo',
      page_size: 500 
    }),
    enabled: tab === 'historial',
  })
  const residentesList = residentesData?.results || []

  const { data: historial, isLoading: cargandoHistorial } = useQuery({
    queryKey: ['historial-visitas', filtroResidenteId],
    queryFn: () => visitantesService.listarVisitas(
      filtroResidenteId ? { residente_id: filtroResidenteId } : {}
    ),
    enabled: tab === 'historial',
  })

  // Listado de visitantes (catálogo) — todos. Filtro y paginado en cliente.
  const { data: visitantesTodos, isLoading: cargandoVisitantes } = useQuery({
    queryKey: ['lista-visitantes'],
    queryFn: () => visitantesService.listar(),
    enabled: tab === 'visitantes',
  })

  const visitantesFiltrados = (visitantesTodos || []).filter(v => {
    if (!busquedaVisitantes) return true
    const q = busquedaVisitantes.toLowerCase()
    return (
      (v.nombre || '').toLowerCase().includes(q) ||
      (v.dni    || '').toLowerCase().includes(q)
    )
  })

  // Datos paginados de cada pestaña
  const visitantesPagina = visitantesFiltrados.slice(
    (paginaVisitantes - 1) * POR_PAGINA, paginaVisitantes * POR_PAGINA
  )
  const visitasActivasPagina = (visitasActivas || []).slice(
    (paginaActivas - 1) * POR_PAGINA, paginaActivas * POR_PAGINA
  )
  // historialFiltrado se calcula más abajo, así que el slicing está en su sitio

  // Reiniciar a la página 1 cuando cambia el filtro/búsqueda correspondiente
  useEffect(() => { setPaginaVisitantes(1) }, [busquedaVisitantes])
  useEffect(() => { setPaginaHistorial(1) },  [filtroResidenteId, filtroFecha])

  const mutacionSalida = useMutation({
    mutationFn: (id) => visitantesService.registrarSalida(id),
    onSuccess: (data, id) => {
      setSalidaRegistrada(id)
      setTimeout(() => {
        queryClient.invalidateQueries(['visitas-activas'])
        queryClient.invalidateQueries(['historial-visitas'])
        setSalidaRegistrada(null)
      }, 800)
    },
  })

  const historialFiltrado = historial?.filter(v => {
    if (!filtroFecha) return true
    return v.fecha_hora_entrada?.startsWith(filtroFecha)
  }) || []
  const historialPagina = historialFiltrado.slice(
    (paginaHistorial - 1) * POR_PAGINA, paginaHistorial * POR_PAGINA
  )

  const tabs = [
    { key: 'activas',     label: 'Visitas activas', icon: Circle,         badge: visitasActivas?.length },
    { key: 'historial',   label: 'Historial',       icon: ClipboardList },
    { key: 'visitantes',  label: 'Visitantes',      icon: Users,          badge: visitantesTodos?.length },
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
            <CalendarHeart size={22} className="text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-warm-800 tracking-tight">Visitas</h1>
            <p className="text-warm-600 text-sm">Control de acceso de visitantes</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {esAdmin && (
            <button onClick={() => setModalNuevoVisitante(true)} className={btnSecundario + " flex items-center gap-2"}>
              <UserPlus size={15} /> Nuevo visitante
            </button>
          )}
          {esAdmin && (
            <button onClick={() => setModalNuevaVisita(true)}
              className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
              <LogIn size={16} /> Nueva visita
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-cream-400 gap-6">
        {tabs.map(t => {
          const Icon = t.icon
          const activo = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition
                ${activo ? 'text-warm-800' : 'text-warm-400 hover:text-warm-600'}`}>
              <Icon size={16} className={t.key === 'activas' && visitasActivas?.length > 0 ? "text-health-500 fill-health-500 animate-pulse" : ""} />
              {t.label}
              {t.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-black transition
                  ${activo ? 'bg-warm-600 text-white' : 'bg-cream-300 text-warm-600'}`}>{t.badge}</span>
              )}
              {activo && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-warm-600 rounded-full" style={{ animation: 'fadeIn 0.2s ease' }} />}
            </button>
          )
        })}
      </div>

      {/* Contenido de Pestañas */}
      <div style={{ animation: 'fadeIn 0.3s ease both' }}>
        {tab === 'activas' && (
          cargandoActivas ? <Spinner /> : !visitasActivas || visitasActivas.length === 0 ? (
            <div className="text-center py-16 bg-warm-50 rounded-2xl border border-dashed border-cream-400">
              <House size={40} className="mx-auto text-cream-400 mb-3" />
              <p className="text-warm-700 font-bold">No hay visitas activas en este momento</p>
              <p className="text-warm-400 text-xs mt-0.5">Todos los ingresos registrados han marcado su salida.</p>
            </div>
          ) : (
            <div className="bg-white border border-cream-400 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-warm-50 text-warm-700 border-b border-cream-400 font-bold">
                      <th className="p-4 w-14">#</th>
                      <th className="p-4">Visitante</th>
                      <th className="p-4">Residente / Destino</th>
                      <th className="p-4">Ingreso</th>
                      <th className="p-4">Tiempo dentro</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 text-warm-800">
                    {visitasActivasPagina.map((v, i) => {
                      const finalizado = salidaRegistrada === v.id
                      return (
                        <tr key={v.id} className={`transition ${finalizado ? 'opacity-40 bg-health-50' : 'hover:bg-warm-50/50'}`}>
                          <td className="p-4 text-sm font-semibold text-warm-400">{(paginaActivas - 1) * POR_PAGINA + i + 1}</td>
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{v.visitante_nombre}</div>
                            <div className="text-xs text-warm-400">C.I.: {v.visitante_dni}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{v.residente_nombre}</div>
                            <div className="text-xs text-warm-500">{RELACION_LABEL[v.relacion] || v.relacion}</div>
                          </td>
                          <td className="p-4 text-warm-600">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-warm-400" />
                              {v.fecha_hora_entrada ? new Date(v.fecha_hora_entrada).toLocaleTimeString('es-BO', {hour:'2-digit', minute:'2-digit'}) : '—'}
                            </div>
                          </td>
                          <td className="p-4 font-medium text-warm-700">
                            <span className="px-2 py-0.5 rounded-md bg-warm-100 text-warm-700 text-xs font-semibold">
                              {tiempoTranscurrido(v.fecha_hora_entrada)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {esAdmin ? (
                              <button onClick={() => mutacionSalida.mutate(v.id)} disabled={mutacionSalida.isPending || finalizado}
                                className="ml-auto px-3 py-1.5 text-xs font-bold text-danger-700 border border-danger-200 bg-danger-50 hover:bg-danger-100 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50">
                                {finalizado ? <Check size={13} /> : <LogOut size={13} />} Registrar Salida
                              </button>
                            ) : (
                              <span className="text-xs text-warm-400 italic">Solo lectura</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <PaginadorSimple pagina={paginaActivas} total={visitasActivas.length} porPagina={POR_PAGINA} onChange={setPaginaActivas} />
            </div>
          )
        )}

        {tab === 'historial' && (
          /* HISTORIAL */
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 bg-warm-50 border border-cream-400 p-3 rounded-2xl items-center">
              <div className="flex-1 min-w-[250px] relative">
                <input 
                  list="historial-residentes-list"
                  placeholder="🔍 Buscar residente por nombre o apellido..."
                  value={textoBusquedaHistorial}
                  onChange={(e) => {
                    const valorInput = e.target.value
                    setTextoBusquedaHistorial(valorInput)

                    const seleccionado = residentesList.find(r => {
                      const stringIdentificacion = `${r?.nombre || ''} ${r?.apellido || ''} [C.I.: ${r?.dni || ''}]`.trim().toLowerCase()
                      return stringIdentificacion === valorInput.toLowerCase()
                    })

                    if (seleccionado) {
                      setFiltroResidenteId(seleccionado.id)
                    } else if (valorInput === '') {
                      setFiltroResidenteId('')
                    }
                  }}
                  className={inputCls}
                />
                <datalist id="historial-residentes-list">
                  {residentesList.map(r => {
                    const valorCompleto = `${r?.nombre || ''} ${r?.apellido || ''} [C.I.: ${r?.dni || ''}]`.trim()
                    return (
                      <option key={r.id} value={valorCompleto} />
                    )
                  })}
                </datalist>
                
                {filtroResidenteId && (
                  <button 
                    onClick={() => { setTextoBusquedaHistorial(''); setFiltroResidenteId('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-warm-400 hover:text-danger-600 transition"
                  >
                    Ver todos
                  </button>
                )}
              </div>
              
              <div className="w-48">
                <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className={inputCls} />
              </div>
            </div>

            {cargandoHistorial ? <Spinner /> : !historialFiltrado || historialFiltrado.length === 0 ? (
              <div className="text-center py-16 text-warm-400 bg-white border border-cream-400 rounded-2xl">
                <ClipboardList size={36} className="mx-auto mb-2 text-cream-300" />
                <p className="text-sm">No se encontraron registros en el historial</p>
              </div>
            ) : (
              <div className="bg-white border border-cream-400 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-warm-50 text-warm-700 border-b border-cream-400 font-bold">
                        <th className="p-4 w-14">#</th>
                        <th className="p-4">Visitante</th>
                        <th className="p-4">Residente</th>
                        <th className="p-4">Entrada</th>
                        <th className="p-4">Salida</th>
                        <th className="p-4">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200 text-warm-800">
                      {historialPagina.map((h, i) => (
                        <tr key={h.id} className="hover:bg-warm-50/50 transition">
                          <td className="p-4 text-sm font-semibold text-warm-400">{(paginaHistorial - 1) * POR_PAGINA + i + 1}</td>
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{h.visitante_nombre}</div>
                            <div className="text-xs text-warm-400">C.I.: {h.visitante_dni}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{h.residente_nombre}</div>
                            <div className="text-xs text-warm-400">C.I.: {h.residente_dni || '—'}</div>
                            <div className="text-xs text-warm-400">{RELACION_LABEL[h.relacion] || h.relacion}</div>
                          </td>
                          <td className="p-4 text-warm-600 whitespace-nowrap">
                            {h.fecha_hora_entrada ? new Date(h.fecha_hora_entrada).toLocaleString('es-BO', {dateStyle:'short', timeStyle:'short'}) : '—'}
                          </td>
                          <td className="p-4 text-warm-600 whitespace-nowrap">
                            {h.fecha_hora_salida ? new Date(h.fecha_hora_salida).toLocaleString('es-BO', {dateStyle:'short', timeStyle:'short'}) : (
                              <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200 inline-flex items-center gap-1">
                                <Clock size={11} /> Sin salida
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-warm-500 max-w-xs truncate" title={h.observaciones}>
                            {h.observaciones || <span className="text-warm-300 italic">Ninguna</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginadorSimple pagina={paginaHistorial} total={historialFiltrado.length} porPagina={POR_PAGINA} onChange={setPaginaHistorial} />
              </div>
            )}
          </div>
        )}

        {tab === 'visitantes' && (
          /* VISITANTES (catálogo) */
          <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="flex flex-wrap gap-3 bg-warm-50 border border-cream-400 p-3 rounded-2xl items-center">
              <div className="flex-1 min-w-[250px] relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                <input
                  placeholder="Buscar por nombre o C.I…"
                  value={busquedaVisitantes}
                  onChange={(e) => setBusquedaVisitantes(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              <div className="text-xs text-warm-500 font-semibold">
                {visitantesFiltrados.length} {visitantesFiltrados.length === 1 ? 'visitante' : 'visitantes'}
              </div>
            </div>

            {cargandoVisitantes ? <Spinner /> : visitantesFiltrados.length === 0 ? (
              <div className="text-center py-16 bg-warm-50 rounded-2xl border border-dashed border-cream-400">
                <Users size={40} className="mx-auto text-cream-400 mb-3" />
                <p className="text-warm-700 font-bold">
                  {busquedaVisitantes ? 'No se encontraron visitantes' : 'Aún no hay visitantes registrados'}
                </p>
                <p className="text-warm-400 text-xs mt-0.5">
                  {busquedaVisitantes ? 'Prueba con otro nombre o C.I.' : 'Usa "Nuevo visitante" para registrar el primero.'}
                </p>
              </div>
            ) : (
              <>
                {/* Tabla — desktop */}
                <div className="hidden md:block bg-white border border-cream-400 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-warm-50 text-warm-700 border-b border-cream-400 font-bold">
                          <th className="p-4 w-14">#</th>
                          <th className="p-4">Nombre</th>
                          <th className="p-4">C.I.</th>
                          <th className="p-4">Teléfono</th>
                          <th className="p-4">Registrado por</th>
                          <th className="p-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-200 text-warm-800">
                        {visitantesPagina.map((v, i) => (
                          <tr key={v.id} className="hover:bg-warm-50/50 transition">
                            <td className="p-4 text-sm font-semibold text-warm-400">{(paginaVisitantes - 1) * POR_PAGINA + i + 1}</td>
                            <td className="p-4 font-semibold">{v.nombre}</td>
                            <td className="p-4 text-warm-600">{v.dni}</td>
                            <td className="p-4 text-warm-600">{v.telefono || <span className="text-warm-300 italic">—</span>}</td>
                            <td className="p-4 text-warm-500 text-xs">{v.registrado_por_nombre || '—'}</td>
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end flex-wrap">
                                <button
                                  onClick={() => setVisitanteAutorizaciones(v)}
                                  className="px-2.5 py-1.5 text-xs font-bold text-warm-700 border border-cream-400 bg-warm-50 hover:bg-warm-100 rounded-lg flex items-center gap-1.5 transition">
                                  <ShieldCheck size={12} /> Autorizaciones
                                </button>
                                {esAdmin && (
                                  <button
                                    onClick={() => setVisitanteEditar(v)}
                                    className="px-2.5 py-1.5 text-xs font-bold text-warm-700 border border-cream-400 bg-white hover:bg-warm-50 rounded-lg flex items-center gap-1.5 transition">
                                    <Pencil size={12} /> Editar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cards — móvil */}
                <div className="md:hidden space-y-2">
                  {visitantesPagina.map((v, i) => (
                    <div key={v.id} className="bg-white border border-cream-300 rounded-xl p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-xs font-bold text-warm-400 bg-warm-100 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{(paginaVisitantes - 1) * POR_PAGINA + i + 1}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-warm-800 truncate">{v.nombre}</div>
                            <div className="text-xs text-warm-500">C.I.: {v.dni}</div>
                            {v.telefono && <div className="text-xs text-warm-500">Tel: {v.telefono}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setVisitanteAutorizaciones(v)}
                          className="flex-1 px-2.5 py-1.5 text-xs font-bold text-warm-700 border border-cream-400 bg-warm-50 hover:bg-warm-100 rounded-lg flex items-center justify-center gap-1.5">
                          <ShieldCheck size={12} /> Autorizaciones
                        </button>
                        {esAdmin && (
                          <button
                            onClick={() => setVisitanteEditar(v)}
                            className="flex-1 px-2.5 py-1.5 text-xs font-bold text-warm-700 border border-cream-400 bg-white hover:bg-warm-50 rounded-lg flex items-center justify-center gap-1.5">
                            <Pencil size={12} /> Editar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación con numeración */}
                <div className="bg-white border border-cream-300 rounded-xl overflow-hidden">
                  <PaginadorSimple pagina={paginaVisitantes} total={visitantesFiltrados.length} porPagina={POR_PAGINA} onChange={setPaginaVisitantes} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modalNuevaVisita && <ModalNuevaVisita onClose={() => setModalNuevaVisita(false)} onGuardado={() => queryClient.invalidateQueries(['visitas-activas'])} />}
      {modalNuevoVisitante && <ModalNuevoVisitante onClose={() => setModalNuevoVisitante(false)} onGuardado={() => { queryClient.invalidateQueries(['visitas-activas']); queryClient.invalidateQueries(['lista-visitantes']) }} />}
      {visitanteEditar && <ModalEditarVisitante visitante={visitanteEditar} onClose={() => setVisitanteEditar(null)} onGuardado={() => queryClient.invalidateQueries(['lista-visitantes'])} />}
      {visitanteAutorizaciones && <ModalGestionarAutorizaciones visitante={visitanteAutorizaciones} esAdmin={esAdmin} onClose={() => setVisitanteAutorizaciones(null)} />}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}