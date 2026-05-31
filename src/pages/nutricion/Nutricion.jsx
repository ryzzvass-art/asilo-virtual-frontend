// src/pages/nutricion/Nutricion.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nutricionService } from '../../services/nutricionService'
import useAuthStore from '../../store/authStore'

// ── Badges ─────────────────────────────────────────────────
function BadgeSeveridad({ severidad }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full
      ${severidad === 'obligatorio' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
      {severidad === 'obligatorio' ? '🚫 Obligatorio' : '⚠️ Recomendado'}
    </span>
  )
}

function BadgeEstadoAlimento({ estado }) {
  const m = {
    activo:     'bg-green-100 text-green-700',
    pendiente:  'bg-yellow-100 text-yellow-700',
    archivado:  'bg-gray-100 text-gray-500',
  }
  const e = { activo: '✅ Activo', pendiente: '⏳ Pendiente', archivado: '📁 Archivado' }
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${m[estado]}`}>{e[estado]}</span>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">{esEdicion ? 'Editar' : 'Nueva'} restricción</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={form.nombre} placeholder="Ej: Sin azúcar"
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea rows={2} value={form.descripcion} placeholder="Explicación clínica"
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones asociadas</label>
            <input type="text" value={form.condiciones_asociadas} placeholder="Ej: Diabetes tipo 2, Diabetes"
              onChange={e => setForm({ ...form, condiciones_asociadas: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">Separa varias con comas. Se usan para sugerir restricciones automáticamente.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
            <select value={form.severidad}
              onChange={e => setForm({ ...form, severidad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="obligatorio">🚫 Obligatorio (bloquea alimentos)</option>
              <option value="recomendado">⚠️ Recomendado (solo advierte)</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm">Cancelar</button>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">{esEdicion ? 'Editar' : 'Nuevo'} alimento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={form.nombre} placeholder="Ej: Arroz blanco"
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo alimentario</label>
            <input type="text" value={form.grupo_alimentario} placeholder="Ej: cereal, lácteo, postre..."
              onChange={e => setForm({ ...form, grupo_alimentario: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

          <button onClick={() => mutGuardar.mutate(form)} disabled={mutGuardar.isPending}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
            {mutGuardar.isPending ? 'Guardando...' : (esEdicion ? 'Guardar cambios' : 'Crear alimento')}
          </button>

          {!esEdicion && (
            <p className="text-xs text-gray-400 text-center">
              Tras crearlo podrás vincular las restricciones que viola, editándolo.
            </p>
          )}

          {esEdicion && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Restricciones que viola</h3>
              {vinculadas?.length === 0 ? (
                <p className="text-xs text-gray-400 mb-3">Ninguna restricción vinculada</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {vinculadas?.map(r => (
                    <div key={r.restriccion} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{r.restriccion_nombre}</span>
                        <BadgeSeveridad severidad={r.restriccion_severidad} />
                      </div>
                      <button onClick={() => mutDesvincular.mutate(r.restriccion)}
                        className="text-xs text-red-500 hover:text-red-700">Quitar</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select value={restriccionSel} onChange={e => setRestriccionSel(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Agregar restricción...</option>
                  {restricciones?.filter(r =>
                    !vinculadas?.some(v => v.restriccion === r.id)
                  ).map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} ({r.severidad})</option>
                  ))}
                </select>
                <button onClick={() => restriccionSel && mutVincular.mutate(restriccionSel)}
                  disabled={!restriccionSel || mutVincular.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
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

  // === QUERY CORREGIDA (única) ===
  const { data: restricciones, isLoading: cargandoR } = useQuery({
    queryKey: ['restricciones'],
    queryFn: () => nutricionService.listarRestricciones({ incluir_archivadas: true }),
  })

  const { data: alimentos, isLoading: cargandoA } = useQuery({
    queryKey: ['alimentos'],
    queryFn: () => nutricionService.listarAlimentos({ incluir_no_activos: true }),
  })

  // === FILTRO ===
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
    { key: 'restricciones', label: '🚫 Restricciones' },
    { key: 'alimentos',     label: '🍽️ Alimentos' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nutrición</h1>
          <p className="text-gray-500 text-sm mt-1">Catálogos de restricciones y alimentos</p>
        </div>
        {esAdmin && (
          <button
            onClick={() => tab === 'restricciones' ? setModalRestriccion({}) : setModalAlimento({})}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
            + {tab === 'restricciones' ? 'Nueva restricción' : 'Nuevo alimento'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${tab === t.key ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Restricciones con filtros ── */}
      {tab === 'restricciones' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap">
            <select value={filtroEstadoR} onChange={e => setFiltroEstadoR(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="activo">Solo activos</option>
              <option value="todos">Todos</option>
            </select>
            <select value={filtroSeveridad} onChange={e => setFiltroSeveridad(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toda severidad</option>
              <option value="obligatorio">Obligatorio</option>
              <option value="recomendado">Recomendado</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {cargandoR ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin text-3xl">⚙️</div></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Restricción', 'Condiciones asociadas', 'Severidad', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {restriccionesFiltradas?.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-gray-400">Sin restricciones</td></tr>
                  ) : (
                    restriccionesFiltradas?.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{r.nombre}</p>
                          <p className="text-xs text-gray-400">{r.descripcion}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{r.condiciones_asociadas || '—'}</td>
                        <td className="px-6 py-4"><BadgeSeveridad severidad={r.severidad} /></td>
                        <td className="px-6 py-4">
                          {esAdmin && (
                            <div className="flex gap-2">
                              <button onClick={() => setModalRestriccion(r)}
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium">✏️ Editar</button>
                              <button onClick={() => mutArchivarR.mutate(r.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium">Archivar</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Alimentos ── */}
      {tab === 'alimentos' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {cargandoA ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin text-3xl">⚙️</div></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Alimento', 'Grupo', 'Restricciones que viola', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alimentos?.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Sin alimentos</td></tr>
                ) : (
                  alimentos?.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{a.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.grupo_alimentario}</td>
                      <td className="px-6 py-4">
                        {a.restricciones_que_viola?.length === 0 ? (
                          <span className="text-xs text-gray-400">Ninguna</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {a.restricciones_que_viola?.map(r => (
                              <span key={r.id} className={`text-xs px-2 py-0.5 rounded-full
                                ${r.severidad === 'obligatorio' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                {r.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><BadgeEstadoAlimento estado={a.estado} /></td>
                      <td className="px-6 py-4">
                        {esAdmin && (
                          <div className="flex gap-2">
                            <button onClick={() => setModalAlimento(a)}
                              className="text-gray-500 hover:text-gray-700 text-sm font-medium">✏️ Editar</button>
                            {a.estado === 'pendiente' && (
                              <button onClick={() => mutActivarA.mutate(a.id)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium">✓ Activar</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
    </div>
  )
}