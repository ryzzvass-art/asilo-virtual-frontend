import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Plus, X, Palette, Dumbbell, Cake, Gamepad2, Pin,
  CalendarClock, CheckCircle2, XCircle, ArrowRight, Users, Loader2
} from 'lucide-react'
import { actividadesService } from '../../services/actividadesService'
import useAuthStore from '../../store/authStore'

const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

// Íconos por tipo de actividad
const TIPO_ICON = {
  taller:       Palette,
  fisioterapia: Dumbbell,
  cumpleanos:   Cake,
  recreativa:   Gamepad2,
  otro:         Pin,
}
const TIPO_LABEL = {
  taller: 'Taller', fisioterapia: 'Fisioterapia', cumpleanos: 'Cumpleaños',
  recreativa: 'Recreativa', otro: 'Otro',
}

function BadgeEstado({ estado }) {
  const cfg = {
    programada: { cls: 'bg-info-100 text-info-600 border-info-600/20',     Icon: CalendarClock, label: 'Programada' },
    realizada:  { cls: 'bg-health-100 text-health-600 border-health-600/20', Icon: CheckCircle2,  label: 'Culminada con éxito' },
    cancelada:  { cls: 'bg-danger-100 text-danger-600 border-danger-600/20', Icon: XCircle,       label: 'Cancelada' },
  }
  const { cls, Icon, label } = cfg[estado] || cfg.programada
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

function BadgeTipo({ tipo }) {
  const Icon = TIPO_ICON[tipo] || Pin
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-warm-100 text-warm-700 px-2.5 py-1 rounded-full font-medium capitalize">
      <Icon size={12} /> {TIPO_LABEL[tipo] || tipo}
    </span>
  )
}

function ModalCrear({ onClose, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'taller', responsable: '', fecha_hora: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => actividadesService.crear(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al crear actividad')),
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 bg-warm-50 rounded-t-[22px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Activity size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">Nueva Actividad</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre</label>
            <input type="text" value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Tipo</label>
            <select value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value })}
              className={`${inputCls} cursor-pointer`}>
              <option value="taller">Taller</option>
              <option value="fisioterapia">Fisioterapia</option>
              <option value="cumpleanos">Cumpleaños</option>
              <option value="recreativa">Recreativa</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Responsable</label>
            <input type="text" value={form.responsable}
              onChange={e => setForm({ ...form, responsable: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Fecha y hora</label>
            <input type="datetime-local" value={form.fecha_hora}
              onChange={e => setForm({ ...form, fecha_hora: e.target.value })} className={inputCls} />
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className={`flex-1 ${btnPrimario}`}>
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Actividades() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'
  const [filtros, setFiltros] = useState({ estado: '', tipo: '' })
  const [modalCrear, setModalCrear] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['actividades', filtros],
    queryFn: () => actividadesService.listar(filtros),
  })

  const mutacionRealizada = useMutation({
    mutationFn: (id) => actividadesService.marcarRealizada(id),
    onSuccess: () => queryClient.invalidateQueries(['actividades']),
  })
  const mutacionCancelar = useMutation({
    mutationFn: (id) => actividadesService.cancelar(id),
    onSuccess: () => queryClient.invalidateQueries(['actividades']),
  })

  const fmtFechaHora = f => new Date(f).toLocaleString('es-BO')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ animation: 'fadeUp 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-warm-100 flex items-center justify-center">
            <Activity size={22} className="text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-warm-800 tracking-tight">Actividades</h1>
            <p className="text-warm-600 text-sm">{data?.length ?? 0} actividad{(data?.length ?? 0) !== 1 ? 'es' : ''} registrada{(data?.length ?? 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {esAdmin && (
          <button onClick={() => setModalCrear(true)}
            className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <Plus size={16} /> Nueva actividad
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400 flex gap-3 flex-wrap" style={{ animation: 'fadeUp 0.45s ease both' }}>
        <select value={filtros.estado}
          onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
          className={`${inputCls} cursor-pointer min-w-44 flex-none`}>
          <option value="">Todos los estados</option>
          <option value="programada">Programada</option>
          <option value="realizada">Culminada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select value={filtros.tipo}
          onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
          className={`${inputCls} cursor-pointer min-w-44 flex-none`}>
          <option value="">Todos los tipos</option>
          <option value="taller">Taller</option>
          <option value="fisioterapia">Fisioterapia</option>
          <option value="cumpleanos">Cumpleaños</option>
          <option value="recreativa">Recreativa</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* TABLA escritorio */}
          <div className="act-tabla bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden" style={{ animation: 'fadeUp 0.5s ease both' }}>
            <table className="w-full">
              <thead>
                <tr className="bg-warm-50 border-b border-cream-400">
                  {['Actividad', 'Tipo', 'Responsable', 'Fecha y hora', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay actividades registradas</td></tr>
                ) : (
                  data?.map((a, i) => (
                    <tr key={a.id} className={`hover:bg-warm-50 transition ${i < data.length - 1 ? 'border-b border-warm-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                            {(() => { const Icon = TIPO_ICON[a.tipo] || Pin; return <Icon size={16} className="text-warm-600" /> })()}
                          </div>
                          <div>
                            <p className="font-semibold text-warm-800">{a.nombre}</p>
                            <p className="text-xs text-warm-400 flex items-center gap-1"><Users size={11} /> {a.total_participantes} participantes</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><BadgeTipo tipo={a.tipo} /></td>
                      <td className="px-6 py-4 text-sm text-warm-600">{a.responsable}</td>
                      <td className="px-6 py-4 text-sm text-warm-600">{fmtFechaHora(a.fecha_hora)}</td>
                      <td className="px-6 py-4"><BadgeEstado estado={a.estado} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => navigate(`/actividades/${a.id}`)}
                            className="text-warm-600 hover:text-warm-800 text-sm font-semibold inline-flex items-center gap-1 transition">Ver <ArrowRight size={13} /></button>
                          {esAdmin && a.estado === 'programada' && (
                            <>
                              <button onClick={() => mutacionRealizada.mutate(a.id)}
                                className="text-health-600 hover:text-health-700 text-sm font-semibold inline-flex items-center gap-1 transition"><CheckCircle2 size={13} /> Culminar</button>
                              <button onClick={() => mutacionCancelar.mutate(a.id)}
                                className="text-danger-600 hover:text-danger-700 text-sm font-semibold transition">Cancelar</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS móvil */}
          <div className="act-cards hidden flex-col gap-3">
            {data?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-cream-400 p-8 text-center text-gray-400 text-sm">No hay actividades registradas</div>
            ) : (
              data?.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                      {(() => { const Icon = TIPO_ICON[a.tipo] || Pin; return <Icon size={20} className="text-warm-600" /> })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-warm-800">{a.nombre}</p>
                      <p className="text-xs text-warm-400 flex items-center gap-1"><Users size={11} /> {a.total_participantes} participantes</p>
                    </div>
                    <BadgeEstado estado={a.estado} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-sm text-warm-600 mb-3">
                    <BadgeTipo tipo={a.tipo} />
                    <span className="text-warm-400">·</span>
                    <span>{a.responsable}</span>
                  </div>
                  <p className="text-xs text-warm-500 flex items-center gap-1.5 mb-3"><CalendarClock size={13} /> {fmtFechaHora(a.fecha_hora)}</p>
                  <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-warm-50">
                    <button onClick={() => navigate(`/actividades/${a.id}`)} className="text-warm-600 text-sm font-semibold inline-flex items-center gap-1">Ver detalle <ArrowRight size={13} /></button>
                    {esAdmin && a.estado === 'programada' && (
                      <>
                        <button onClick={() => mutacionRealizada.mutate(a.id)} className="text-health-600 text-sm font-semibold inline-flex items-center gap-1 ml-auto"><CheckCircle2 size={13} /> Culminar</button>
                        <button onClick={() => mutacionCancelar.mutate(a.id)} className="text-danger-600 text-sm font-semibold">Cancelar</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {modalCrear && (
        <ModalCrear onClose={() => setModalCrear(false)} onGuardado={() => queryClient.invalidateQueries(['actividades'])} />
      )}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 767px) {
          .act-tabla { display: none !important; }
          .act-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
