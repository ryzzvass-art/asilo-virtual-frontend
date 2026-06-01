// src/pages/visitantes/Visitantes.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LogIn, LogOut, X, Search, UserPlus, ArrowRight, ArrowLeft,
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

// ==================== MODAL NUEVA VISITA ====================
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
        {/* Header del modal */}
        <div className="flex items-start gap-3 p-5 border-b border-cream-400 bg-warm-50 rounded-t-[22px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <LogIn size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Registrar Nueva Visita</h2>
            <div className="flex items-center gap-2 mt-3">
              {['Visitante', 'Residente', 'Confirmar'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition
                    ${paso > i + 1 ? 'bg-health-600 text-white' : paso === i + 1 ? 'bg-warm-500 text-white' : 'bg-cream-300 text-warm-400'}`}>
                    {paso > i + 1 ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={`text-xs ${paso === i + 1 ? 'text-warm-700 font-semibold' : 'text-warm-400'}`}>{label}</span>
                  {i < 2 && <div className={`w-6 h-0.5 ${paso > i + 1 ? 'bg-health-600' : 'bg-cream-300'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>

        <div className="p-5">
          {/* Paso 1, 2 y 3 ... (mantengo tu lógica original) */}
          {paso === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-warm-500">Busca al visitante por su nombre o número de C.I.</p>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
                <input type="text" placeholder="Escribe nombre o C.I...." value={busqueda}
                  onChange={e => setBusqueda(e.target.value)} autoFocus
                  className={`${inputCls} pl-10 py-3`} />
              </div>
              {/* ... resto del paso 1 igual que tenías ... */}
            </div>
          )}
          {/* Puedes copiar el resto de los pasos 2 y 3 desde tu código original */}
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL NUEVO VISITANTE (CORREGIDO) ====================
function ModalNuevoVisitante({ onClose, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', dni: '', telefono: '' })
  const [autorizarAhora, setAutorizarAhora] = useState(false)
  const [autForm, setAutForm] = useState({ residente_id: '', relacion: 'familiar' })
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
        await visitantesService.autorizar(visitante.id, autForm.residente_id, { relacion: autForm.relacion })
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
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
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
                  <input 
                    list="residentes-list"
                    placeholder="Buscar residente por nombre..."
                    value={residentes.find(r => r.id === autForm.residente_id) 
                      ? `${residentes.find(r => r.id === autForm.residente_id).nombre} ${residentes.find(r => r.id === autForm.residente_id).apellido}` 
                      : ''}
                    onChange={(e) => {
                      const seleccionado = residentes.find(r => 
                        `${r.nombre} ${r.apellido}`.toLowerCase().includes(e.target.value.toLowerCase())
                      )
                      if (seleccionado) setAutForm({ ...autForm, residente_id: seleccionado.id })
                    }}
                    className={`${inputCls}`}
                  />
                  <datalist id="residentes-list">
                    {residentes.map(r => (
                      <option key={r.id} value={`${r.nombre} ${r.apellido} — C.I.: ${r.dni}`} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-1.5">Relación</label>
                  <select value={autForm.relacion} onChange={e => setAutForm({ ...autForm, relacion: e.target.value })} className={`${inputCls} cursor-pointer`}>
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
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar Visitante'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== PÁGINA PRINCIPAL ====================
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

  // ... (el resto de tu lógica de queries, useEffect, mutaciones, etc. se mantiene igual)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
            <button 
              onClick={() => setModalNuevoVisitante(true)} 
              className={`${btnSecundario} flex items-center gap-2`}
            >
              <UserPlus size={15} /> Nuevo visitante
            </button>
          )}
          <button 
            onClick={() => setModalNuevaVisita(true)}
            className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <LogIn size={16} /> Nueva visita
          </button>
        </div>
      </div>

      {/* Tabs y contenido (mantén tu código original aquí) */}

      {/* MODALES */}
      {modalNuevaVisita && (
        <ModalNuevaVisita 
          onClose={() => setModalNuevaVisita(false)} 
          onGuardado={() => queryClient.invalidateQueries(['visitas-activas'])} 
        />
      )}

      {modalNuevoVisitante && (
        <ModalNuevoVisitante 
          onClose={() => setModalNuevoVisitante(false)} 
          onGuardado={() => {
            queryClient.invalidateQueries(['residentes-activos-todos'])
            queryClient.invalidateQueries(['visitas-activas'])
          }} 
        />
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}