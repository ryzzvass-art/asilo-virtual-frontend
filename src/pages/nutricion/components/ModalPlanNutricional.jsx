import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, Plus, ChevronDown, ChevronUp, Loader2, CheckCircle2,
  AlertTriangle, Utensils, ClipboardList, CalendarDays, Trash2
} from 'lucide-react'
import { nutricionService } from '../../services/nutricionService'

// ── Clases reutilizables (mismo sistema que Nutricion.jsx) ─
const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

const TIPOS_COMIDA = ['desayuno', 'almuerzo', 'merienda', 'cena']
const TIPO_COMIDA_ICON = { desayuno: '☕', almuerzo: '🍽️', merienda: '🥪', cena: '🍷' }

// Extrae un mensaje de error legible de una respuesta DRF
function extraerError(err, fallback = 'Ocurrió un error inesperado.') {
  const data = err?.response?.data
  if (!data) return err?.message ? `No se pudo conectar con el servidor (${err.message}).` : fallback
  if (typeof data === 'string') return data
  if (typeof data.error === 'string')   return data.error
  if (typeof data.detalle === 'string') return data.detalle
  if (typeof data.detail === 'string')  return data.detail
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) return data.non_field_errors.join(' ')
  const partes = []
  for (const valor of Object.values(data)) {
    partes.push(Array.isArray(valor) ? valor.join(' ') : String(valor))
  }
  return partes.length ? partes.join(' ') : fallback
}

// ── Spinner ────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function ModalPlanNutricional({ residenteId, onClose }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('vigente')
  const [creandoPlan, setCreandoPlan] = useState(false)
  const [planExpandido, setPlanExpandido] = useState(null)

  const { data: planes, isLoading } = useQuery({
    queryKey: ['planes', residenteId],
    queryFn: () => nutricionService.listarPlanes(residenteId),
  })

  const vigente   = planes?.find(p => p.estado === 'vigente')
  const archivados = planes?.filter(p => p.estado === 'archivado') || []

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-[22px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Utensils size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Plan nutricional</h2>
            <p className="text-xs text-warm-500">Gestión del menú del residente</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-4 border-b border-cream-400 bg-warm-50/50">
          {[
            { key: 'vigente',   label: 'Plan vigente',              icon: CheckCircle2 },
            { key: 'historial', label: `Historial (${archivados.length})`, icon: ClipboardList },
          ].map(t => {
            const Icon = t.icon
            const activo = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2
                  ${activo
                    ? 'bg-gradient-to-br from-warm-600 to-warm-500 text-white shadow'
                    : 'text-warm-600 hover:bg-warm-100'}`}>
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {isLoading ? <Spinner /> : tab === 'vigente' ? (
            <div className="space-y-4">
              {creandoPlan ? (
                <FormNuevoPlan
                  residenteId={residenteId}
                  onCancelar={() => setCreandoPlan(false)}
                  onGuardado={() => {
                    queryClient.invalidateQueries(['planes', residenteId])
                    setCreandoPlan(false)
                  }}
                />
              ) : vigente ? (
                <PlanConMenus plan={vigente} residenteId={residenteId} esVigente />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center">
                    <Utensils size={26} className="text-warm-400" />
                  </div>
                  <p className="text-warm-500 text-sm font-medium">Sin plan nutricional vigente</p>
                  <p className="text-warm-400 text-xs">Asigna un plan aprobado para comenzar</p>
                </div>
              )}

              {!creandoPlan && (
                <button onClick={() => setCreandoPlan(true)}
                  className="w-full py-2.5 border-2 border-dashed border-cream-400 rounded-xl text-sm text-warm-600 hover:border-warm-400 hover:bg-warm-50 font-semibold transition flex items-center justify-center gap-2">
                  <Plus size={15} />
                  {vigente ? 'Asignar nuevo plan (archiva el actual)' : 'Asignar plan nutricional'}
                </button>
              )}
            </div>
          ) : (
            // Historial
            <div className="space-y-3">
              {archivados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ClipboardList size={28} className="text-warm-300" />
                  <p className="text-warm-400 text-sm">Sin planes archivados</p>
                </div>
              ) : (
                archivados.map(p => (
                  <div key={p.id} className="border border-cream-400 rounded-2xl overflow-hidden">
                    <button onClick={() => setPlanExpandido(planExpandido === p.id ? null : p.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-warm-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                          <Utensils size={14} className="text-warm-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-warm-800 text-sm capitalize">{p.tipo_dieta}</p>
                          <p className="text-xs text-warm-400 flex items-center gap-1 mt-0.5">
                            <CalendarDays size={11} /> {p.fecha_inicio} → {p.fecha_fin || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-warm-100 text-warm-500 px-2 py-0.5 rounded-full font-medium">
                          Archivado
                        </span>
                        {planExpandido === p.id
                          ? <ChevronUp size={15} className="text-warm-400" />
                          : <ChevronDown size={15} className="text-warm-400" />}
                      </div>
                    </button>
                    {planExpandido === p.id && (
                      <div className="border-t border-cream-400 bg-warm-50/40">
                        <PlanConMenus plan={p} residenteId={residenteId} esVigente={false} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// FORMULARIO NUEVO PLAN (asignar plantilla aprobada)
// ════════════════════════════════════════════════════════════
function FormNuevoPlan({ residenteId, onCancelar, onGuardado }) {
  const [paso, setPaso]               = useState(1)
  const [plantillaId, setPlantillaId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [conflictos, setConflictos]   = useState([])
  const [reemplazos, setReemplazos]   = useState({})
  const [error, setError]             = useState('')

  const { data: plantillasAprobadas } = useQuery({
    queryKey: ['plantillas-aprobadas'],
    queryFn: () => nutricionService.listarPlantillas({ estado: 'aprobado' }),
  })

  const plantillaSelObj = plantillasAprobadas?.find(p => p.id === parseInt(plantillaId))

  const mutation = useMutation({
    mutationFn: (body) => nutricionService.asignarPlantilla(residenteId, body),
    onSuccess: (data) => {
      if (data?.conflictos?.length) {
        setConflictos(data.conflictos)
        setPaso(2)
        setError('')
      } else {
        onGuardado()
      }
    },
    onError: (err) => setError(extraerError(err, 'No se pudo asignar el plan.')),
  })

  const handlePaso1 = () => {
    setError('')
    mutation.mutate({ plantilla_id: parseInt(plantillaId), fecha_inicio: fechaInicio })
  }

  const handlePaso2 = () => {
    setError('')
    const sinResolver = conflictos.filter(c => !reemplazos[c.comida_plantilla_id])
    if (sinResolver.length > 0) {
      setError(`Elige reemplazo para: ${sinResolver.map(c => c.tipo_comida).join(', ')}`)
      return
    }
    const reemplazosArray = Object.entries(reemplazos).map(([cid, aid]) => ({
      comida_plantilla_id: parseInt(cid),
      alimento_id: parseInt(aid),
    }))
    mutation.mutate({
      plantilla_id: parseInt(plantillaId),
      fecha_inicio: fechaInicio,
      reemplazos: reemplazosArray,
    })
  }

  return (
    <div className="bg-warm-50 border border-cream-400 rounded-2xl p-4 space-y-4">

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2">
        {[{ n: 1, label: 'Elegir plan' }, { n: 2, label: 'Resolver conflictos' }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-1.5 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
              ${paso >= s.n ? 'bg-warm-600 text-white' : 'bg-cream-300 text-warm-400'}`}>
              {s.n}
            </div>
            <span className={`text-xs font-medium ${paso >= s.n ? 'text-warm-700' : 'text-warm-400'}`}>{s.label}</span>
            {i === 0 && <div className={`flex-1 h-px mx-1 ${paso >= 2 ? 'bg-warm-400' : 'bg-cream-300'}`} />}
          </div>
        ))}
      </div>

      {/* PASO 1 */}
      {paso === 1 && (
        <>
          <div>
            <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1.5">
              Plan nutricional aprobado
            </label>
            <select value={plantillaId} onChange={e => setPlantillaId(e.target.value)}
              className={`${inputCls} cursor-pointer`}>
              <option value="">Seleccionar plan nutricional...</option>
              {plantillasAprobadas?.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.tipo_dieta} ({p.fecha_menu})
                </option>
              ))}
            </select>
            {plantillasAprobadas?.length === 0 && (
              <p className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} /> No hay planes aprobados disponibles para hoy o días futuros.
              </p>
            )}
          </div>

          {/* Preview comidas */}
          {plantillaSelObj && (
            <div className="bg-white rounded-xl border border-cream-400 p-3">
              <p className="text-xs font-semibold text-warm-700 mb-2 flex items-center gap-1.5">
                <ClipboardList size={12} /> Comidas de este plan:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {plantillaSelObj.comidas?.map(c => (
                  <div key={c.id} className="text-xs bg-warm-50 border border-cream-400/60 rounded-lg px-2 py-1.5">
                    <span className="font-semibold text-warm-700 capitalize">
                      {TIPO_COMIDA_ICON[c.tipo_comida]} {c.tipo_comida}:
                    </span>
                    <span className="text-warm-600 ml-1">{c.alimento_nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1.5">
              Fecha de inicio
            </label>
            <input type="date" value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className={inputCls} />
          </div>
        </>
      )}

      {/* PASO 2 — conflictos */}
      {paso === 2 && (
        <div className="space-y-3">
          <div className="bg-alert-50 border border-alert-200 rounded-xl p-3 flex gap-2">
            <AlertTriangle size={15} className="text-alert-600 shrink-0 mt-0.5" />
            <p className="text-sm text-alert-700">
              Algunos alimentos violan restricciones del residente. Elige un reemplazo para cada uno.
            </p>
          </div>
          {conflictos.map(c => (
            <div key={c.comida_plantilla_id} className="border border-danger-200 rounded-xl p-3 bg-danger-50/40">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{TIPO_COMIDA_ICON[c.tipo_comida]}</span>
                <span className="text-sm font-semibold text-warm-800 capitalize">{c.tipo_comida}</span>
                <span className="text-xs text-danger-600 bg-danger-100 px-2 py-0.5 rounded-full ml-auto">
                  🚫 {c.alimento_nombre}
                </span>
              </div>
              <p className="text-xs text-danger-600 mb-2">
                Viola: {c.conflictos.map(x => x.restriccion).join(', ')}
              </p>
              {c.sugerencias?.length > 0 ? (
                <div className="space-y-1.5">
                  {c.sugerencias.map(s => (
                    <label key={s.alimento_id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition text-xs
                        ${reemplazos[c.comida_plantilla_id] === s.alimento_id
                          ? 'border-health-400 bg-health-50'
                          : 'border-cream-400 bg-white hover:bg-warm-50'}`}>
                      <input type="radio"
                        name={`r-${c.comida_plantilla_id}`}
                        checked={reemplazos[c.comida_plantilla_id] === s.alimento_id}
                        onChange={() => setReemplazos(r => ({ ...r, [c.comida_plantilla_id]: s.alimento_id }))}
                        className="accent-health-600" />
                      <span className="text-warm-800">{s.nombre}</span>
                      <span className="text-warm-400 ml-auto">{s.grupo_alimentario}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-warm-400 italic">Sin sugerencias disponibles.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-danger-600 text-xs bg-danger-100 p-3 rounded-xl">{error}</p>}

      <div className="flex gap-2">
        {paso === 2 && (
          <button onClick={() => { setPaso(1); setConflictos([]); setReemplazos({}) }}
            className={btnSecundario}>
            Atrás
          </button>
        )}
        <button onClick={onCancelar} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
        <button
          onClick={paso === 1 ? handlePaso1 : handlePaso2}
          disabled={mutation.isPending || (paso === 1 && !plantillaId)}
          className={`flex-1 ${btnPrimario}`}>
          {mutation.isPending
            ? <><Loader2 size={14} className="animate-spin" /> Verificando…</>
            : paso === 1 ? 'Verificar →' : <><CheckCircle2 size={14} /> Confirmar</>}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PLAN CON MENÚS (vigente o archivado)
// ════════════════════════════════════════════════════════════
function PlanConMenus({ plan, residenteId, esVigente }) {
  const queryClient = useQueryClient()
  const [agregando, setAgregando] = useState(false)

  const { data: comidas } = useQuery({
    queryKey: ['comidas', plan.id],
    queryFn: () => nutricionService.listarComidas(plan.id),
  })

  const mutEliminarComida = useMutation({
    mutationFn: (comidaId) => nutricionService.eliminarComida(comidaId),
    onSuccess: () => queryClient.invalidateQueries(['comidas', plan.id]),
  })

  return (
    <div className="space-y-3 p-1">
      {/* Datos del plan */}
      <div className="bg-warm-50 border border-cream-400 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-warm-800 text-sm capitalize">{plan.tipo_dieta}</p>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
            ${esVigente
              ? 'bg-health-100 text-health-600'
              : 'bg-warm-100 text-warm-500'}`}>
            {esVigente ? 'Vigente' : 'Archivado'}
          </span>
        </div>
        {plan.observaciones && (
          <p className="text-xs text-warm-500 mt-1">{plan.observaciones}</p>
        )}
        <p className="text-xs text-warm-400 mt-1 flex items-center gap-1">
          <CalendarDays size={11} /> Desde {plan.fecha_inicio}
        </p>
      </div>

      {/* Menús */}
      <div>
        <p className="text-xs font-bold text-warm-600 uppercase tracking-wide mb-2">
          Menús ({comidas?.length || 0})
        </p>
        {comidas?.length === 0 ? (
          <p className="text-sm text-warm-400 text-center py-4">Sin comidas registradas</p>
        ) : (
          <div className="space-y-1.5">
            {comidas?.map(c => (
              <div key={c.id}
                className="flex items-center gap-2 text-sm bg-white border border-cream-400 rounded-xl px-3 py-2">
                <span className="text-xs bg-warm-100 text-warm-600 px-2 py-0.5 rounded-full font-semibold capitalize shrink-0">
                  {TIPO_COMIDA_ICON[c.tipo_comida]} {c.tipo_comida}
                </span>
                <span className="text-warm-800 font-medium">{c.alimento_nombre}</span>
                {c.descripcion_menu && (
                  <span className="text-xs text-warm-400">— {c.descripcion_menu}</span>
                )}
                <span className="text-xs text-warm-300 ml-auto shrink-0">{c.fecha}</span>
                {esVigente && (
                  <button
                    onClick={() => mutEliminarComida.mutate(c.id)}
                    className="text-danger-400 hover:text-danger-600 transition ml-1 shrink-0"
                    title="Quitar comida">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agregar comida puntual (solo vigente) */}
      {esVigente && (
        agregando ? (
          <FormNuevaComida
            planId={plan.id}
            residenteId={residenteId}
            onCancelar={() => setAgregando(false)}
            onGuardado={() => {
              queryClient.invalidateQueries(['comidas', plan.id])
              setAgregando(false)
            }}
          />
        ) : (
          <button onClick={() => setAgregando(true)}
            className="w-full py-2 border-2 border-dashed border-cream-400 rounded-xl text-sm text-warm-600 hover:border-warm-400 hover:bg-warm-50 font-semibold transition flex items-center justify-center gap-2">
            <Plus size={14} /> Agregar comida puntual al menú
          </button>
        )
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// FORMULARIO NUEVA COMIDA PUNTUAL
// ════════════════════════════════════════════════════════════
function FormNuevaComida({ planId, residenteId, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_comida: 'desayuno',
    alimento: '',
    descripcion_menu: '',
  })
  const [error, setError]                       = useState('')
  const [advertencias, setAdvertencias]         = useState([])
  const [conflictoObligatorio, setConflictoObligatorio] = useState(null)

  const { data: alimentos } = useQuery({
    queryKey: ['alimentos-activos-menu'],
    queryFn: () => nutricionService.listarAlimentos(),
  })

  const mutation = useMutation({
    mutationFn: (data) => nutricionService.crearComida(planId, data),
    onSuccess: (data) => {
      if (data?.advertencias?.length) {
        setAdvertencias(data.advertencias)
      } else {
        onGuardado()
      }
    },
    onError: (err) => {
      const detalle = err.response?.data?.detalle || err.response?.data
      if (detalle?.conflictos || detalle?.error?.includes?.('restricción')) {
        setConflictoObligatorio(detalle.conflictos || detalle.error)
      } else {
        setError(extraerError(err, 'No se pudo agregar la comida al menú.'))
      }
    },
  })

  return (
    <div className="bg-warm-50 border border-cream-400 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-bold text-warm-700 uppercase tracking-wide">Nueva comida puntual</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-warm-600 mb-1.5">Fecha</label>
          <input type="date" value={form.fecha}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
            className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-warm-600 mb-1.5">Tipo de comida</label>
          <select value={form.tipo_comida}
            onChange={e => setForm({ ...form, tipo_comida: e.target.value })}
            className={`${inputCls} cursor-pointer capitalize`}>
            {TIPOS_COMIDA.map(t => (
              <option key={t} value={t}>{TIPO_COMIDA_ICON[t]} {t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-warm-600 mb-1.5">Alimento</label>
        <select value={form.alimento}
          onChange={e => setForm({ ...form, alimento: e.target.value })}
          className={`${inputCls} cursor-pointer`}>
          <option value="">Seleccionar alimento...</option>
          {alimentos?.map(a => (
            <option key={a.id} value={a.id}>{a.nombre} ({a.grupo_alimentario})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-warm-600 mb-1.5">Descripción</label>
        <input type="text" value={form.descripcion_menu}
          placeholder="Ej: Postre especial del día"
          onChange={e => setForm({ ...form, descripcion_menu: e.target.value })}
          className={inputCls} />
      </div>

      {/* Conflicto obligatorio (RF-25) */}
      {conflictoObligatorio && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle size={14} className="text-danger-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-danger-700 font-semibold">Alimento bloqueado</p>
            <p className="text-xs text-danger-600 mt-0.5">
              Este alimento viola una restricción obligatoria del residente y no puede asignarse.
            </p>
          </div>
        </div>
      )}

      {/* Advertencias recomendadas */}
      {advertencias.length > 0 && (
        <div className="bg-alert-50 border border-alert-200 rounded-xl p-3">
          <p className="text-sm text-alert-700 font-semibold flex items-center gap-1.5">
            <AlertTriangle size={13} /> Comida guardada con advertencia
          </p>
          {advertencias.map((a, i) => (
            <p key={i} className="text-xs text-alert-600 mt-1">
              {typeof a === 'string' ? a : a.restriccion}
            </p>
          ))}
          <button onClick={onGuardado}
            className={`mt-3 w-full ${btnPrimario}`}>
            OK, entendido
          </button>
        </div>
      )}

      {error && <p className="text-danger-600 text-xs bg-danger-100 p-3 rounded-xl">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancelar} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
        <button
          onClick={() => { setError(''); setConflictoObligatorio(null); mutation.mutate(form) }}
          disabled={mutation.isPending || !form.alimento}
          className={`flex-1 ${btnPrimario}`}>
          {mutation.isPending
            ? <><Loader2 size={14} className="animate-spin" /> Verificando…</>
            : <><Plus size={14} /> Agregar</>}
        </button>
      </div>
    </div>
  )
}