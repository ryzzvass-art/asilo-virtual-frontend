// src/pages/visitantes/Visitantes.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LogIn, LogOut, X, Search, UserPlus, Users, ArrowRight, ArrowLeft,
  Check, CheckCircle2, AlertTriangle, Clock, CalendarHeart, House,
  ClipboardList, Circle, Loader2
} from 'lucide-react'
import { visitantesService } from '../../services/visitantesService'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

function tiempoTranscurrido(fechaEntrada) {
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
    queryFn: async () => {
      const [porNombre, porDni] = await Promise.all([
        visitantesService.listar({ nombre: busqueda }),
        visitantesService.listar({ dni: busqueda }),
      ])
      const todos = [...(porNombre || []), ...(porDni || [])]
      return todos.filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
    },
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
    onError: (err) => setError(
      err.response?.data?.detalle?.error || err.response?.data?.error || 'Error al registrar el ingreso.'
    ),
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
            {/* Stepper */}
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
          {/* PASO 1 */}
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
                        <div className="w-10 h-10 rounded-full bg-health-100 flex items-center justify-center text-health-600 font-bold text-sm shrink-0">{v.nombre[0]}</div>
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

          {/* PASO 2 */}
          {paso === 2 && visitante && (
            <div className="space-y-4">
              <div className="bg-warm-50 border border-cream-400 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-health-100 flex items-center justify-center text-health-600 font-bold text-sm shrink-0">{visitante.nombre[0]}</div>
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
                          {a.residente_nombre?.split(' ').map(n => n[0]).slice(0,2).join('')}
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

          {/* PASO 3 */}
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
  const [error, setError] = useState('')

  const { data: residentes } = useQuery({
    queryKey: ['residentes-activos'],
    queryFn: () => residentesService.listar({ estado: 'activo' }),
    enabled: autorizarAhora,
  })

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
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al crear visitante')),
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
              <input type="text" value={form[key]} placeholder={placeholder}
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
                <select value={autForm.residente_id}
                  onChange={e => setAutForm({ ...autForm, residente_id: e.target.value })}
                  className={`${inputCls} cursor-pointer`}>
                  <option value="">Seleccionar residente...</option>
                  {residentes?.results?.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} {r.apellido} — C.I.: {r.dni}</option>
                  ))}
                </select>
                <select value={autForm.relacion}
                  onChange={e => setAutForm({ ...autForm, relacion: e.target.value })}
                  className={`${inputCls} cursor-pointer`}>
                  <option value="familiar">Familiar</option>
                  <option value="amigo">Amigo</option>
                  <option value="representante_legal">Representante legal</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            )}
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
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Visitas() {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [tab, setTab] = useState('activas')
  const [modalNuevaVisita, setModalNuevaVisita] = useState(false)
  const [modalNuevoVisitante, setModalNuevoVisitante] = useState(false)
  const [salidaRegistrada, setSalidaRegistrada] = useState(null)

  const [filtroResidente, setFiltroResidente] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [, setTick] = useState(0)
  useEffect(() => {
    const intervalo = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(intervalo)
  }, [])

  const { data: visitasActivas, isLoading: cargandoActivas } = useQuery({
    queryKey: ['visitas-activas'],
    queryFn: () => visitantesService.listarVisitas({ estado: 'en_curso' }),
    refetchInterval: 30000,
  })

  const { data: residentes } = useQuery({
    queryKey: ['residentes-activos'],
    queryFn: () => residentesService.listar({ estado: 'activo' }),
    enabled: tab === 'historial',
  })

  const { data: historial, isLoading: cargandoHistorial } = useQuery({
    queryKey: ['historial-visitas', filtroResidente],
    queryFn: () => visitantesService.listarVisitas(
      filtroResidente ? { residente_id: filtroResidente } : {}
    ),
    enabled: tab === 'historial',
  })

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
  })

  const tabs = [
    { key: 'activas',   label: 'Visitas activas', icon: Circle,        badge: visitasActivas?.length },
    { key: 'historial', label: 'Historial',       icon: ClipboardList },
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
          <button onClick={() => setModalNuevaVisita(true)}
            className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <LogIn size={16} /> Nueva visita
          </button>
        </div>
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
              <Icon size={14} className={t.key === 'activas' && !activo ? 'text-health-600 fill-health-600' : ''} /> {t.label}
              {t.badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${activo ? 'bg-white text-warm-600' : 'bg-health-100 text-health-600'}`}>{t.badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* TAB: Activas */}
      {tab === 'activas' && (
        <div style={{ animation: 'fadeUp 0.5s ease both' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-cream-400 bg-health-100 flex items-center gap-2">
              <Circle size={12} className="text-health-600 fill-health-600" />
              <h3 className="font-bold text-health-700">{visitasActivas?.length ?? 0} visita{(visitasActivas?.length ?? 0) !== 1 ? 's' : ''} en curso</h3>
            </div>
          </div>

          {cargandoActivas ? <Spinner /> : visitasActivas?.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-cream-400 text-center py-16 text-warm-400">
              <House size={40} className="mx-auto mb-3 text-cream-400" />
              <p className="font-semibold text-warm-600">No hay visitas activas en este momento</p>
              <button onClick={() => setModalNuevaVisita(true)}
                className="mt-4 bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition">
                <LogIn size={15} /> Registrar primera visita
              </button>
            </div>
          ) : (
            <>
              {/* TABLA escritorio */}
              <div className="vis-tabla bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-warm-50 border-b border-cream-400">
                      {['Visitante', 'Residente', 'Hora entrada', 'Tiempo', 'Observaciones', 'Acciones'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitasActivas?.map((v, i) => {
                      const registrando = salidaRegistrada === v.id
                      return (
                        <tr key={v.id} className={`transition ${registrando ? 'bg-health-100' : 'hover:bg-warm-50'} ${i < visitasActivas.length - 1 ? 'border-b border-warm-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-health-100 flex items-center justify-center text-health-600 font-bold text-xs shrink-0">{v.visitante_nombre?.[0]}</div>
                              <p className="font-semibold text-warm-800 text-sm">{v.visitante_nombre}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-warm-600">{v.residente_nombre}</td>
                          <td className="px-6 py-4 text-sm text-warm-600">{new Date(v.fecha_hora_entrada).toLocaleTimeString('es-BO')}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-health-100 text-health-600 px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1"><Clock size={11} /> {tiempoTranscurrido(v.fecha_hora_entrada)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-warm-400">{v.observaciones || '—'}</td>
                          <td className="px-6 py-4">
                            {registrando ? (
                              <span className="bg-health-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 w-fit"><Check size={14} /> Salida registrada</span>
                            ) : (
                              <button onClick={() => mutacionSalida.mutate(v.id)} disabled={mutacionSalida.isPending}
                                className="bg-alert-100 text-alert-600 hover:bg-alert-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 inline-flex items-center gap-1.5"><LogOut size={14} /> Registrar salida</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* CARDS móvil */}
              <div className="vis-cards hidden flex-col gap-3">
                {visitasActivas?.map(v => {
                  const registrando = salidaRegistrada === v.id
                  return (
                    <div key={v.id} className={`rounded-2xl p-4 shadow-sm border transition ${registrando ? 'bg-health-100 border-health-600/30' : 'bg-white border-cream-400'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-health-100 flex items-center justify-center text-health-600 font-bold text-sm shrink-0">{v.visitante_nombre?.[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-warm-800">{v.visitante_nombre}</p>
                          <p className="text-xs text-warm-400">visita a {v.residente_nombre}</p>
                        </div>
                        <span className="text-xs bg-health-100 text-health-600 px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 shrink-0"><Clock size={11} /> {tiempoTranscurrido(v.fecha_hora_entrada)}</span>
                      </div>
                      <p className="text-xs text-warm-500 mb-1">Entrada: {new Date(v.fecha_hora_entrada).toLocaleTimeString('es-BO')}</p>
                      {v.observaciones && <p className="text-xs text-warm-400 mb-3">{v.observaciones}</p>}
                      <div className="pt-3 border-t border-warm-50">
                        {registrando ? (
                          <span className="bg-health-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 w-fit"><Check size={14} /> Salida registrada</span>
                        ) : (
                          <button onClick={() => mutacionSalida.mutate(v.id)} disabled={mutacionSalida.isPending}
                            className="bg-alert-100 text-alert-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 inline-flex items-center gap-1.5"><LogOut size={14} /> Registrar salida</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: Historial */}
      {tab === 'historial' && (
        <div className="space-y-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400 flex gap-3 flex-wrap">
            <select value={filtroResidente} onChange={e => setFiltroResidente(e.target.value)}
              className={`flex-1 min-w-48 ${inputCls} cursor-pointer`}>
              <option value="">Todos los residentes</option>
              {residentes?.results?.map(r => (
                <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
              ))}
            </select>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              className={`${inputCls} flex-none min-w-40`} />
            {(filtroResidente || filtroFecha) && (
              <button onClick={() => { setFiltroResidente(''); setFiltroFecha('') }}
                className="px-3 py-2 text-sm text-warm-500 hover:text-warm-700 font-semibold">Limpiar</button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-400">
              <h3 className="font-bold text-warm-700 flex items-center gap-2"><ClipboardList size={16} className="text-warm-500" /> {historialFiltrado?.length ?? 0} visitas</h3>
            </div>
            {cargandoHistorial ? <Spinner /> : (
              <>
                {/* TABLA escritorio */}
                <table className="vis-hist-tabla w-full">
                  <thead>
                    <tr className="bg-warm-50 border-b border-cream-400">
                      {['Visitante', 'Residente', 'Entrada', 'Salida', 'Duración', 'Observaciones', 'Estado'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado?.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">Sin visitas para los filtros seleccionados</td></tr>
                    ) : (
                      historialFiltrado?.map((v, i) => {
                        const dur = v.fecha_hora_salida
                          ? Math.floor((new Date(v.fecha_hora_salida) - new Date(v.fecha_hora_entrada)) / 60000) : null
                        return (
                          <tr key={v.id} className={`hover:bg-warm-50 transition ${i < historialFiltrado.length - 1 ? 'border-b border-warm-50' : ''}`}>
                            <td className="px-6 py-4 text-sm font-semibold text-warm-800">{v.visitante_nombre}</td>
                            <td className="px-6 py-4 text-sm text-warm-600">{v.residente_nombre}</td>
                            <td className="px-6 py-4 text-sm text-warm-600">{new Date(v.fecha_hora_entrada).toLocaleString('es-BO')}</td>
                            <td className="px-6 py-4 text-sm text-warm-600">
                              {v.fecha_hora_salida ? new Date(v.fecha_hora_salida).toLocaleTimeString('es-BO')
                                : <span className="text-health-600 font-semibold">En curso</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-warm-400">
                              {dur !== null ? (dur < 60 ? `${dur} min` : `${Math.floor(dur/60)}h ${dur%60}min`) : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-warm-400">{v.observaciones || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1
                                ${v.estado === 'en_curso' ? 'bg-health-100 text-health-600' :
                                  v.estado === 'finalizada' ? 'bg-gray-100 text-gray-500' : 'bg-alert-100 text-alert-600'}`}>
                                {v.estado === 'en_curso' ? <><Circle size={9} className="fill-health-600" /> En curso</> : v.estado === 'finalizada' ? <><CheckCircle2 size={11} /> Finalizada</> : <><Clock size={11} /> Pendiente</>}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>

                {/* CARDS móvil */}
                <div className="vis-hist-cards hidden flex-col gap-3 p-4">
                  {historialFiltrado?.length === 0 ? (
                    <p className="text-center py-8 text-gray-400 text-sm">Sin visitas para los filtros seleccionados</p>
                  ) : (
                    historialFiltrado?.map(v => {
                      const dur = v.fecha_hora_salida
                        ? Math.floor((new Date(v.fecha_hora_salida) - new Date(v.fecha_hora_entrada)) / 60000) : null
                      return (
                        <div key={v.id} className="bg-warm-50 rounded-xl p-3 border border-cream-400/60">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="font-bold text-warm-800 text-sm">{v.visitante_nombre}</p>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1
                              ${v.estado === 'en_curso' ? 'bg-health-100 text-health-600' :
                                v.estado === 'finalizada' ? 'bg-gray-100 text-gray-500' : 'bg-alert-100 text-alert-600'}`}>
                              {v.estado === 'en_curso' ? <><Circle size={9} className="fill-health-600" /> En curso</> : v.estado === 'finalizada' ? <><CheckCircle2 size={11} /> Finalizada</> : <><Clock size={11} /> Pendiente</>}
                            </span>
                          </div>
                          <p className="text-xs text-warm-500">visita a {v.residente_nombre}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-warm-600 mt-2">
                            <div><span className="text-warm-400">Entrada:</span> {new Date(v.fecha_hora_entrada).toLocaleString('es-BO')}</div>
                            <div><span className="text-warm-400">Duración:</span> {dur !== null ? (dur < 60 ? `${dur} min` : `${Math.floor(dur/60)}h ${dur%60}min`) : '—'}</div>
                          </div>
                          {v.observaciones && <p className="text-xs text-warm-400 mt-2">{v.observaciones}</p>}
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modales */}
      {modalNuevaVisita && (
        <ModalNuevaVisita onClose={() => setModalNuevaVisita(false)}
          onGuardado={() => {
            queryClient.invalidateQueries(['visitas-activas'])
            queryClient.invalidateQueries(['historial-visitas'])
          }} />
      )}
      {modalNuevoVisitante && (
        <ModalNuevoVisitante onClose={() => setModalNuevoVisitante(false)}
          onGuardado={() => queryClient.invalidateQueries(['visitantes'])} />
      )}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 767px) {
          .vis-tabla, .vis-hist-tabla { display: none !important; }
          .vis-cards { display: flex !important; }
          .vis-hist-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
