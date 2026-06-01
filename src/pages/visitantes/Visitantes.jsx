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
// MODAL NUEVA VISITA (wizard)
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
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-lg">
        {/* ... resto del modal de nueva visita sin cambios ... */}
        {/* (Mantengo el código igual que tenías, solo cambio lo necesario) */}
        {/* ... (código del modal igual al que enviaste) ... */}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL NUEVO VISITANTE (CORREGIDO)
// ════════════════════════════════════════════════════════════
function ModalNuevoVisitante({ onClose, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '' })
  const [autorizarAhora, setAutorizarAhora] = useState(false)
  const [autForm, setAutForm] = useState({ residente_id: '', relacion: 'familiar' })
  const [error, setError] = useState('')

  // ←←← SOLUCIÓN AQUÍ: Traemos TODOS los residentes
  const { data: residentesData } = useQuery({
    queryKey: ['residentes-activos-todos'],
    queryFn: () => residentesService.listar({ 
      estado: 'activo',
      page_size: 500   // Trae hasta 500 (más que suficiente)
    }),
    enabled: autorizarAhora,
  })

  const residentes = residentesData?.results || []

  const mutation = useMutation({
    mutationFn: async (data) => {
      const visitante = await visitantesService.crear(data)
      if (autorizarAhora && autForm.residente_id) {
        await visitantesService.autorizar(
          visitante.id, 
          autForm.residente_id, 
          { relacion: autForm.relacion }
        )
      }
      return visitante
    },
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al crear visitante')),
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <UserPlus size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">Nuevo Visitante</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {[
            { label: 'Nombre completo', key: 'nombre', placeholder: 'Ej: Carlos Mamani' },
            { label: 'C.I.', key: 'dni', placeholder: 'Ej: 9876543' },
            { label: 'Teléfono', key: 'telefono', placeholder: 'Ej: 70012345' },
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
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-1.5">Residente</label>
                  <div className="relative">
                    <input 
                      list="residentes-list"
                      placeholder="Buscar residente..."
                      value={residentes.find(r => r.id === autForm.residente_id)?.nombre + " " + 
                             (residentes.find(r => r.id === autForm.residente_id)?.apellido || '') || ''}
                      onChange={(e) => {
                        const selected = residentes.find(r => 
                          `${r.nombre} ${r.apellido}`.toLowerCase() === e.target.value.toLowerCase()
                        )
                        if (selected) {
                          setAutForm({ ...autForm, residente_id: selected.id })
                        }
                      }}
                      className={`${inputCls} cursor-pointer`}
                    />
                    <datalist id="residentes-list">
                      {residentes.map(r => (
                        <option key={r.id} 
                          value={`${r.nombre} ${r.apellido} — C.I.: ${r.dni}`} />
                      ))}
                    </datalist>
                  </div>
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
    { key: 'activas', label: 'Visitas activas', icon: Circle, badge: visitasActivas?.length },
    { key: 'historial', label: 'Historial', icon: ClipboardList },
  ]

  const Spinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header - igual que antes */}
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

      {/* Tabs y contenido restante (sin cambios) */}
      {/* ... (el resto del código de tabs, tabla activa, historial, etc. se mantiene igual) ... */}

      {modalNuevaVisita && <ModalNuevaVisita onClose={() => setModalNuevaVisita(false)} onGuardado={() => queryClient.invalidateQueries(['visitas-activas'])} />}
      {modalNuevoVisitante && <ModalNuevoVisitante onClose={() => setModalNuevoVisitante(false)} onGuardado={() => queryClient.invalidateQueries(['visitas-activas'])} />}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}