// src/pages/medicamentos/Medicamentos.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { medicamentosService } from '../../services/medicamentosService'
import useAuthStore from '../../store/authStore'

// ── Helpers ────────────────────────────────────────────────
function diasParaVencer(fecha) {
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24))
}

function BadgeEstado({ estado }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full
      ${estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {estado === 'activo' ? '✅ Activo' : '📁 Archivado'}
    </span>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL CREAR / EDITAR MEDICAMENTO
// ════════════════════════════════════════════════════════════
function ModalMedicamento({ medicamento, onClose, onGuardado }) {
  const esEdicion = !!medicamento
  const [form, setForm] = useState({
    nombre_comercial:   medicamento?.nombre_comercial   || '',
    principio_activo:   medicamento?.principio_activo    || '',
    tipo:               medicamento?.tipo                || '',
    forma_farmaceutica: medicamento?.forma_farmaceutica  || '',
    contraindicaciones: medicamento?.contraindicaciones  || '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => esEdicion
      ? medicamentosService.editar(medicamento.id, data)
      : medicamentosService.crear(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al guardar')),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">
            {esEdicion ? 'Editar medicamento' : 'Nuevo medicamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Nombre comercial', key: 'nombre_comercial', placeholder: 'Ej: Inderal' },
            { label: 'Principio activo', key: 'principio_activo', placeholder: 'Ej: Propranolol' },
            { label: 'Tipo / Categoría',  key: 'tipo', placeholder: 'Ej: Betabloqueante' },
            { label: 'Forma farmacéutica', key: 'forma_farmaceutica', placeholder: 'Ej: Tableta' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="text" value={form[key]} placeholder={placeholder}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraindicaciones</label>
            <textarea rows={3} value={form.contraindicaciones}
              placeholder="Ej: Asma bronquial, broncoespasmo..."
              onChange={e => setForm({ ...form, contraindicaciones: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
// MODAL GESTIÓN DE STOCK (lotes)
// ════════════════════════════════════════════════════════════
function ModalStock({ medicamento, onClose }) {
  const queryClient = useQueryClient()
  const esAdmin = useAuthStore(s => s.usuario)?.rol === 'administrador'
  const [agregando, setAgregando] = useState(false)
  const [form, setForm] = useState({
    cantidad: '', unidad: 'comprimidos', fecha_vencimiento: '', umbral_minimo: '', lote: ''
  })
  const [error, setError] = useState('')

  const { data: lotes, isLoading } = useQuery({
    queryKey: ['stock', medicamento.id],
    queryFn: () => medicamentosService.listarStock(medicamento.id),
  })

  const mutAgregar = useMutation({
    mutationFn: (data) => medicamentosService.agregarLote(medicamento.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock', medicamento.id])
      queryClient.invalidateQueries(['alertas-stock'])
      setAgregando(false)
      setForm({ cantidad: '', unidad: 'comprimidos', fecha_vencimiento: '', umbral_minimo: '', lote: '' })
      setError('')
    },
    onError: (err) => setError(
      err.response?.data?.detalle?.error || JSON.stringify(err.response?.data?.detalle || 'Error al agregar lote')
    ),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📦 Stock por lotes</h2>
            <p className="text-sm text-gray-400">{medicamento.nombre_comercial}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {esAdmin && !agregando && (
            <button onClick={() => setAgregando(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              + Agregar lote
            </button>
          )}

          {/* Formulario nuevo lote */}
          {agregando && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Cantidad</label>
                  <input type="number" value={form.cantidad}
                    onChange={e => setForm({ ...form, cantidad: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Unidad</label>
                  <input type="text" value={form.unidad}
                    onChange={e => setForm({ ...form, unidad: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Vencimiento</label>
                  <input type="date" value={form.fecha_vencimiento}
                    onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Umbral mínimo</label>
                  <input type="number" value={form.umbral_minimo}
                    onChange={e => setForm({ ...form, umbral_minimo: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Número de lote</label>
                <input type="text" value={form.lote} placeholder="Ej: LOTE-2026-001"
                  onChange={e => setForm({ ...form, lote: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setAgregando(false); setError('') }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
                <button onClick={() => mutAgregar.mutate(form)} disabled={mutAgregar.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
                  {mutAgregar.isPending ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de lotes */}
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-6">Cargando lotes...</p>
          ) : lotes?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin lotes registrados</p>
          ) : (
            <div className="space-y-2">
              {lotes?.map(lote => {
                const dias = diasParaVencer(lote.fecha_vencimiento)
                const stockBajo = lote.cantidad <= lote.umbral_minimo
                const porVencer = dias <= 30
                return (
                  <div key={lote.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 text-sm">{lote.lote}</span>
                      <div className="flex gap-1">
                        {stockBajo && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ Stock bajo</span>}
                        {porVencer && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">⏳ Por vencer</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <div><span className="text-gray-400">Cantidad:</span> {lote.cantidad} {lote.unidad}</div>
                      <div><span className="text-gray-400">Umbral:</span> {lote.umbral_minimo}</div>
                      <div><span className="text-gray-400">Vence:</span> {lote.fecha_vencimiento}</div>
                    </div>
                  </div>
                )
              })}
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
export default function Medicamentos() {
  const queryClient = useQueryClient()
  const esAdmin = useAuthStore(s => s.usuario)?.rol === 'administrador'

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('activo')  
  const [modalMed, setModalMed] = useState(null)        
  const [modalStock, setModalStock] = useState(null)

  const { data: medicamentos, isLoading } = useQuery({
    queryKey: ['medicamentos'],
    queryFn: () => medicamentosService.listar({ incluir_archivados: true }),
  })

  const { data: alertas } = useQuery({
    queryKey: ['alertas-stock'],
    queryFn: () => medicamentosService.alertasStock(),
  })

  const mutArchivar = useMutation({
    mutationFn: (id) => medicamentosService.archivar(id),
    onSuccess: () => queryClient.invalidateQueries(['medicamentos']),
  })

  // Filtrado + Ordenamiento (activos primero)
  const filtrados = medicamentos
    ?.filter(m => {
      if (filtroEstado === 'activo' && m.estado !== 'activo') return false
      if (!busqueda) return true
      return (
        m.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.principio_activo.toLowerCase().includes(busqueda.toLowerCase())
      )
    })
    ?.sort((a, b) => {
      if (a.estado === b.estado) return 0
      return a.estado === 'activo' ? -1 : 1
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Medicamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Catálogo y control de stock</p>
        </div>
        {esAdmin && (
          <button onClick={() => setModalMed({})}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <span>+</span> Nuevo medicamento
          </button>
        )}
      </div>

      {/* Alertas de stock */}
      {alertas?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <h3 className="font-semibold text-orange-700 mb-2">⚠️ {alertas.length} alertas de stock</h3>
          <div className="space-y-1">
            {alertas.map((a, i) => (
              <p key={i} className="text-sm text-orange-600">
                {a.medicamento_nombre || a.lote} — {a.tipo === 'stock_bajo' ? 'Stock bajo' : 'Vencimiento próximo'}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Buscador y filtro */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap">
        <input type="text" placeholder="Buscar por nombre o principio activo..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="activo">Solo activos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin text-3xl">⚙️</div></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{['Medicamento', 'Principio activo', 'Forma', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No hay medicamentos</td></tr>
              ) : (
                filtrados?.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{m.nombre_comercial}</p>
                      <p className="text-xs text-gray-400">{m.tipo}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.principio_activo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{m.forma_farmaceutica}</td>
                    <td className="px-6 py-4"><BadgeEstado estado={m.estado} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalStock(m)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium">📦 Stock</button>
                        {esAdmin && (
                          <>
                            <button onClick={() => setModalMed(m)}
                              className="text-gray-500 hover:text-gray-700 text-sm font-medium">✏️ Editar</button>
                            {m.estado === 'activo' && (
                              <button onClick={() => mutArchivar.mutate(m.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium">Archivar</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales */}
      {modalMed !== null && (
        <ModalMedicamento
          medicamento={modalMed.id ? modalMed : null}
          onClose={() => setModalMed(null)}
          onGuardado={() => queryClient.invalidateQueries(['medicamentos'])}
        />
      )}
      {modalStock && (
        <ModalStock medicamento={modalStock} onClose={() => setModalStock(null)} />
      )}
    </div>
  )
}