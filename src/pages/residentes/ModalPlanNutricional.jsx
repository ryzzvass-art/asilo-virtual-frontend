import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nutricionService } from '../../services/nutricionService'

const TIPOS_COMIDA = ['desayuno', 'almuerzo', 'merienda', 'cena']

export default function ModalPlanNutricional({ residenteId, onClose }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('vigente')
  const [creandoPlan, setCreandoPlan] = useState(false)
  const [planExpandido, setPlanExpandido] = useState(null)

  const { data: planes, isLoading } = useQuery({
    queryKey: ['planes', residenteId],
    queryFn: () => nutricionService.listarPlanes(residenteId),
  })

  const vigente = planes?.find(p => p.estado === 'vigente')
  const archivados = planes?.filter(p => p.estado === 'archivado') || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">🍽️ Plan nutricional</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 border-b">
          {[
            { key: 'vigente', label: 'Plan vigente' },
            { key: 'historial', label: `Historial (${archivados.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition
                ${tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-6">Cargando...</p>
          ) : tab === 'vigente' ? (
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
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">🍽️</p>
                  <p className="text-sm">Sin plan nutricional vigente</p>
                </div>
              )}

              {!creandoPlan && (
                <button onClick={() => setCreandoPlan(true)}
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-blue-600 hover:bg-blue-50 font-medium">
                  + {vigente ? 'Crear nuevo plan (archiva el actual)' : 'Crear plan nutricional'}
                </button>
              )}
            </div>
          ) : (
            // Historial
            <div className="space-y-3">
              {archivados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin planes archivados</p>
              ) : (
                archivados.map(p => (
                  <div key={p.id} className="border border-gray-100 rounded-xl">
                    <button onClick={() => setPlanExpandido(planExpandido === p.id ? null : p.id)}
                      className="w-full flex items-center justify-between p-3 text-left">
                      <div>
                        <p className="font-medium text-gray-700 text-sm capitalize">{p.tipo_dieta}</p>
                        <p className="text-xs text-gray-400">{p.fecha_inicio} → {p.fecha_fin || '—'}</p>
                      </div>
                      <span className="text-gray-400">{planExpandido === p.id ? '▲' : '▼'}</span>
                    </button>
                    {planExpandido === p.id && (
                      <div className="px-3 pb-3 border-t border-gray-50">
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
    </div>
  )
}

// ── Formulario nuevo plan ──
function FormNuevoPlan({ residenteId, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    tipo_dieta: '', observaciones: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => nutricionService.crearPlan(residenteId, data),
    onSuccess: onGuardado,
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al crear plan')),
  })

  return (
    <div className="bg-blue-50 rounded-xl p-4 space-y-3">
      <div>
  <label className="text-xs font-medium text-gray-500 uppercase">Tipo de dieta</label>
  <select value={form.tipo_dieta}
    onChange={e => setForm({ ...form, tipo_dieta: e.target.value })}
    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">Seleccionar tipo de dieta...</option>
    <option value="blanda">Blanda</option>
    <option value="hipocalorica">Hipocalórica</option>
    <option value="normal">Normal</option>
    <option value="diabetica">Diabética</option>
    <option value="hiposodica">Hiposódica</option>
    <option value="otro">Otro</option>
  </select>
</div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Observaciones</label>
        <textarea rows={2} value={form.observaciones}
          onChange={e => setForm({ ...form, observaciones: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Fecha de inicio</label>
        <input type="date" value={form.fecha_inicio}
          onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">Cancelar</button>
        <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.tipo_dieta}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
          {mutation.isPending ? 'Guardando...' : 'Crear plan'}
        </button>
      </div>
    </div>
  )
}
// ── Plan con sus menús ──
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
    <div className="space-y-3 pt-3">
      {/* Datos del plan */}
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-800 text-sm capitalize">{plan.tipo_dieta}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${esVigente ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
            {esVigente ? 'Vigente' : 'Archivado'}
          </span>
        </div>
        {plan.observaciones && <p className="text-xs text-gray-500 mt-1">{plan.observaciones}</p>}
        <p className="text-xs text-gray-400 mt-1">Desde {plan.fecha_inicio}</p>
      </div>

      {/* Menús */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Menús ({comidas?.length || 0})</p>
        {comidas?.length === 0 ? (
          <p className="text-sm text-gray-400">Sin comidas registradas</p>
        ) : (
          <div className="space-y-1.5">
            {comidas?.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-sm bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{c.tipo_comida}</span>
                <span className="text-gray-700">{c.alimento_nombre}</span>
                {c.descripcion_menu && <span className="text-xs text-gray-400">— {c.descripcion_menu}</span>}
                <span className="text-xs text-gray-300 ml-auto">{c.fecha}</span>
                
                {/* Botón de quitar - Solo en planes vigentes */}
                {esVigente && (
                  <button 
                    onClick={() => mutEliminarComida.mutate(c.id)}
                    className="text-red-400 hover:text-red-600 text-sm ml-2 transition-colors"
                    title="Quitar comida"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agregar comida (solo en vigente) */}
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
            className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            + Agregar comida al menú
          </button>
        )
      )}
    </div>
  )
}

// ── Formulario nueva comida con verificación RF-25 ──
function FormNuevaComida({ planId, residenteId, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_comida: 'desayuno',
    alimento: '',
    descripcion_menu: '',
  })
  const [error, setError] = useState('')
  const [advertencias, setAdvertencias] = useState([])
  const [conflictoObligatorio, setConflictoObligatorio] = useState(null)

  const { data: alimentos } = useQuery({
    queryKey: ['alimentos-activos-menu'],
    queryFn: () => nutricionService.listarAlimentos(),
  })

  const mutation = useMutation({
    mutationFn: (data) => nutricionService.crearComida(planId, data),
    onSuccess: (data) => {
      // Si el backend devolvió advertencias (restricción recomendada), mostrarlas pero guardó igual
      if (data?.advertencias?.length) {
        setAdvertencias(data.advertencias)
      } else {
        onGuardado()
      }
    },
    onError: (err) => {
      const detalle = err.response?.data?.detalle || err.response?.data
      // RF-25: conflicto obligatorio bloquea
      if (detalle?.conflictos || detalle?.error?.includes?.('restricción')) {
        setConflictoObligatorio(detalle.conflictos || detalle.error)
      } else {
        setError(detalle?.error || JSON.stringify(detalle) || 'Error al agregar comida')
      }
    },
  })

  return (
    <div className="bg-blue-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Fecha</label>
          <input type="date" value={form.fecha}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Tipo de comida</label>
          <select value={form.tipo_comida}
            onChange={e => setForm({ ...form, tipo_comida: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
            {TIPOS_COMIDA.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Alimento</label>
        <select value={form.alimento}
          onChange={e => setForm({ ...form, alimento: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Seleccionar alimento...</option>
          {alimentos?.map(a => (
            <option key={a.id} value={a.id}>{a.nombre} ({a.grupo_alimentario})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Descripción del menú</label>
        <input type="text" value={form.descripcion_menu} placeholder="Ej: Arroz con pollo"
          onChange={e => setForm({ ...form, descripcion_menu: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Conflicto obligatorio (RF-25) */}
      {conflictoObligatorio && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700 font-medium">🚫 Alimento bloqueado</p>
          <p className="text-xs text-red-600 mt-1">
            Este alimento viola una restricción obligatoria del residente y no puede asignarse.
          </p>
        </div>
      )}

      {/* Advertencias (recomendado) */}
      {advertencias.length > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
    <p className="text-sm text-yellow-700 font-medium">⚠️ Comida guardada con advertencia</p>
    {advertencias.map((a, i) => (
      <p key={i} className="text-xs text-yellow-600 mt-1">{typeof a === 'string' ? a : a.restriccion}</p>
    ))}
    <button onClick={onGuardado}
      className="mt-3 w-full px-3 py-2 bg-yellow-600 text-white rounded-xl text-sm font-medium">
      OK, entendido
    </button>
  </div>
)}
      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancelar} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">Cancelar</button>
        <button
          onClick={() => { setError(''); setConflictoObligatorio(null); mutation.mutate(form) }}
          disabled={mutation.isPending || !form.alimento}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
          {mutation.isPending ? 'Verificando...' : 'Agregar'}
        </button>
      </div>
    </div>
  )
}
