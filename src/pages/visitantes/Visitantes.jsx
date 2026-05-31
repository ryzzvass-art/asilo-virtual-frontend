// src/pages/visitantes/Visitantes.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { visitantesService } from '../../services/visitantesService'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'


function tiempoTranscurrido(fechaEntrada) {
  const diff = Math.floor((new Date() - new Date(fechaEntrada)) / 60000)
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h ${diff % 60}min`
}

const RELACION_LABEL = {
  familiar: '👨‍👩‍👧 Familiar',
  amigo: '👫 Amigo',
  representante_legal: '⚖️ Representante legal',
  otro: '📌 Otro',
}

// ════════════════════════════════════════════════════════════
// MODAL NUEVA VISITA
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">📥 Registrar Nueva Visita</h2>
            <div className="flex items-center gap-2 mt-3">
              {['Visitante', 'Residente', 'Confirmar'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition
                      ${paso > i + 1 ? 'bg-green-500 text-white' : paso === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {paso > i + 1 ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs ${paso === i + 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < 2 && <div className={`w-6 h-0.5 ${paso > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl ml-4">×</button>
        </div>

        <div className="p-6">
          {paso === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Busca al visitante por su nombre o número de C.I.</p>
              <input type="text" placeholder="Escribe nombre o C.I...." value={busqueda}
                onChange={e => setBusqueda(e.target.value)} autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {buscando && <p className="text-sm text-gray-400 text-center py-2">Buscando...</p>}
              {busqueda.length >= 2 && !buscando && visitantes?.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm">No se encontró ningún visitante</p>
                </div>
              )}
              {visitantes?.length > 0 && (
                <ul className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {visitantes.map(v => (
                    <li key={v.id}>
                      <button onClick={() => { setVisitante(v); setPaso(2); setError('') }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">{v.nombre[0]}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">{v.nombre}</p>
                          <p className="text-xs text-gray-400">C.I.: {v.dni} · Tel: {v.telefono}</p>
                        </div>
                        <span className="text-blue-500 text-sm">Elegir →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {paso === 2 && visitante && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">{visitante.nombre[0]}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{visitante.nombre}</p>
                  <p className="text-xs text-gray-400">C.I.: {visitante.dni}</p>
                </div>
                <button onClick={() => { setPaso(1); setVisitante(null) }} className="text-xs text-blue-600 hover:text-blue-800">Cambiar</button>
              </div>
              <p className="text-sm text-gray-500">¿A quién viene a visitar?</p>
              {cargandoAuth ? (
                <p className="text-sm text-gray-400 text-center py-6">Cargando autorizaciones...</p>
              ) : autorizacionesActivas.length === 0 ? (
                <div className="text-center py-6 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-3xl mb-2">⚠️</p>
                  <p className="text-sm text-yellow-700 font-medium">Este visitante no tiene autorizaciones activas</p>
                  <p className="text-xs text-yellow-600 mt-1 px-4">Autorízalo desde la ficha del residente</p>
                </div>
              ) : (
                <ul className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {autorizacionesActivas.map(a => (
                    <li key={a.id}>
                      <button onClick={() => { setAutorizacion(a); setPaso(3); setError('') }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                          {a.residente_nombre?.split(' ').map(n => n[0]).slice(0,2).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">{a.residente_nombre}</p>
                          <p className="text-xs text-gray-400">{RELACION_LABEL[a.relacion] || a.relacion}</p>
                        </div>
                        <span className="text-blue-500 text-sm">Elegir →</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => { setPaso(1); setVisitante(null) }}
                className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600">← Atrás</button>
            </div>
          )}

          {paso === 3 && autorizacion && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Visitante</span><span className="font-medium text-gray-800">{visitante.nombre}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Residente</span><span className="font-medium text-gray-800">{autorizacion.residente_nombre}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Relación</span><span className="font-medium text-gray-800">{RELACION_LABEL[autorizacion.relacion]}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Hora de entrada</span><span className="font-medium text-gray-800">{new Date().toLocaleTimeString('es-BO')}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                <input type="text" value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Visita de rutina"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => { setPaso(2); setError('') }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">← Atrás</button>
                <button onClick={() => mutation.mutate({
                  visitante_id: visitante.id, residente_id: autorizacion.residente, observaciones,
                })} disabled={mutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {mutation.isPending ? 'Registrando...' : '✅ Confirmar ingreso'}
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
// MODAL NUEVO VISITANTE (con autorización opcional en el mismo flujo)
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
    onError: (err) => setError(
      JSON.stringify(err.response?.data?.detalle || 'Error al crear visitante')
    ),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">Nuevo Visitante</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Nombre completo', key: 'nombre',   placeholder: 'Ej: Carlos Mamani' },
            { label: 'C.I.',            key: 'dni',      placeholder: 'Ej: 9876543' },
            { label: 'Teléfono',        key: 'telefono', placeholder: 'Ej: 70012345' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="text" value={form[key]} placeholder={placeholder}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}

          {/* Autorización opcional en el mismo flujo */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={autorizarAhora}
                onChange={e => setAutorizarAhora(e.target.checked)}
                className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-gray-700">Autorizar a un residente ahora</span>
            </label>
            {autorizarAhora && (
              <div className="space-y-3 mt-3">
                <select value={autForm.residente_id}
                  onChange={e => setAutForm({ ...autForm, residente_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar residente...</option>
                  {residentes?.results?.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} {r.apellido} — C.I.: {r.dni}</option>
                  ))}
                </select>
                <select value={autForm.relacion}
                  onChange={e => setAutForm({ ...autForm, relacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="familiar">👨‍👩‍👧 Familiar</option>
                  <option value="amigo">👫 Amigo</option>
                  <option value="representante_legal">⚖️ Representante legal</option>
                  <option value="otro">📌 Otro</option>
                </select>
              </div>
            )}
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm">Cancelar</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL — solo Activas e Historial
// ════════════════════════════════════════════════════════════
export default function Visitas() {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [tab, setTab] = useState('activas')
  const [modalNuevaVisita, setModalNuevaVisita] = useState(false)
  const [modalNuevoVisitante, setModalNuevoVisitante] = useState(false)
  const [salidaRegistrada, setSalidaRegistrada] = useState(null) // id con feedback visual

  // Filtros de historial
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
      // Feedback visual breve antes de quitar la fila
      setSalidaRegistrada(id)
      setTimeout(() => {
        queryClient.invalidateQueries(['visitas-activas'])
        queryClient.invalidateQueries(['historial-visitas'])
        setSalidaRegistrada(null)
      }, 800)
    },
  })

  // Filtrar historial por fecha en el cliente
  const historialFiltrado = historial?.filter(v => {
    if (!filtroFecha) return true
    return v.fecha_hora_entrada?.startsWith(filtroFecha)
  })

  const tabs = [
    { key: 'activas',   label: '🟢 Visitas activas', badge: visitasActivas?.length },
    { key: 'historial', label: '📋 Historial' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visitas</h1>
          <p className="text-gray-500 text-sm mt-1">Control de acceso de visitantes</p>
        </div>
        <div className="flex gap-2">
          {esAdmin && (
            <button onClick={() => setModalNuevoVisitante(true)}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium">
              + Nuevo visitante
            </button>
          )}
          <button onClick={() => setModalNuevaVisita(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            📥 Nueva visita
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2
              ${tab === t.key ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t.label}
            {t.badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                ${tab === t.key ? 'bg-white text-blue-600' : 'bg-green-100 text-green-700'}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: Visitas activas */}
      {tab === 'activas' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-green-50">
  <h3 className="font-semibold text-green-700">🟢 {visitasActivas?.length ?? 0} visitas en curso</h3>
</div>
          {cargandoActivas ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin text-3xl">⚙️</div></div>
          ) : visitasActivas?.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🏠</p>
              <p className="font-medium">No hay visitas activas en este momento</p>
              <button onClick={() => setModalNuevaVisita(true)}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">
                📥 Registrar primera visita
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Visitante', 'Residente', 'Hora entrada', 'Tiempo', 'Observaciones', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visitasActivas?.map(v => {
                  const registrando = salidaRegistrada === v.id
                  return (
                    <tr key={v.id} className={`transition ${registrando ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">{v.visitante_nombre?.[0]}</div>
                          <p className="font-medium text-gray-800 text-sm">{v.visitante_nombre}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{v.residente_nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(v.fecha_hora_entrada).toLocaleTimeString('es-BO')}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">⏱ {tiempoTranscurrido(v.fecha_hora_entrada)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{v.observaciones || '—'}</td>
                      <td className="px-6 py-4">
                        {registrando ? (
                          <span className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 w-fit">
                            ✓ Salida registrada
                          </span>
                        ) : (
                          <button onClick={() => mutacionSalida.mutate(v.id)}
                            disabled={mutacionSalida.isPending}
                            className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                            📤 Registrar salida
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB: Historial */}
      {tab === 'historial' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap">
            <select value={filtroResidente} onChange={e => setFiltroResidente(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los residentes</option>
              {residentes?.results?.map(r => (
                <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
              ))}
            </select>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {(filtroResidente || filtroFecha) && (
              <button onClick={() => { setFiltroResidente(''); setFiltroFecha('') }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Limpiar</button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-700">📋 {historialFiltrado?.length ?? 0} visitas</h3>
            </div>
            {cargandoHistorial ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin text-3xl">⚙️</div></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Visitante', 'Residente', 'Entrada', 'Salida', 'Duración', 'Observaciones', 'Estado'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historialFiltrado?.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Sin visitas para los filtros seleccionados</td></tr>
                  ) : (
                    historialFiltrado?.map(v => {
                      const dur = v.fecha_hora_salida
                        ? Math.floor((new Date(v.fecha_hora_salida) - new Date(v.fecha_hora_entrada)) / 60000) : null
                      return (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">{v.visitante_nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{v.residente_nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(v.fecha_hora_entrada).toLocaleString('es-BO')}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {v.fecha_hora_salida ? new Date(v.fecha_hora_salida).toLocaleTimeString('es-BO')
                              : <span className="text-green-600 font-medium">En curso</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {dur !== null ? (dur < 60 ? `${dur} min` : `${Math.floor(dur/60)}h ${dur%60}min`) : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{v.observaciones || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium
                              ${v.estado === 'en_curso' ? 'bg-green-100 text-green-700' :
                                v.estado === 'finalizada' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
                              {v.estado === 'en_curso' ? '🟢 En curso' : v.estado === 'finalizada' ? '✅ Finalizada' : '⏳ Pendiente'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
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
    </div>
  )
}
