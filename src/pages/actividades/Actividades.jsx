import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { actividadesService } from '../../services/actividadesService'
import useAuthStore from '../../store/authStore'

function BadgeEstado({ estado }) {
  const estilos = {
    programada: 'bg-blue-100 text-blue-700',
    realizada:  'bg-green-100 text-green-700',
    cancelada:  'bg-red-100 text-red-500',
  }
  const etiquetas = {
    programada: '📅 Programada',
    realizada:  '✅ Culminada con éxito',
    cancelada:  '❌ Cancelada',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${estilos[estado]}`}>
      {etiquetas[estado]}
    </span>
  )
}

function BadgeTipo({ tipo }) {
  const iconos = {
    taller:       '🎨',
    fisioterapia: '🏃',
    cumpleanos:   '🎂',
    recreativa:   '🎮',
    otro:         '📌',
  }
  return (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
      {iconos[tipo]} {tipo}
    </span>
  )
}

function ModalCrear({ onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: '', 
    tipo: 'taller',
    responsable: '', 
    fecha_hora: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => actividadesService.crear(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(
      JSON.stringify(err.response?.data?.detalle || 'Error al crear actividad')
    ),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">Nueva Actividad</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="taller">🎨 Taller</option>
              <option value="fisioterapia">🏃 Fisioterapia</option>
              <option value="cumpleanos">🎂 Cumpleaños</option>
              <option value="recreativa">🎮 Recreativa</option>
              <option value="otro">📌 Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
            <input type="text" value={form.responsable}
              onChange={e => setForm({ ...form, responsable: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
            <input type="datetime-local" value={form.fecha_hora}
              onChange={e => setForm({ ...form, fecha_hora: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm">
            Cancelar
          </button>
          <button onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
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

  // Mutaciones
  const mutacionRealizada = useMutation({
    mutationFn: (id) => actividadesService.marcarRealizada(id),
    onSuccess: () => queryClient.invalidateQueries(['actividades']),
  })

  const mutacionCancelar = useMutation({
    mutationFn: (id) => actividadesService.cancelar(id),
    onSuccess: () => queryClient.invalidateQueries(['actividades']),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Actividades</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.length ?? 0} actividades registradas
          </p>
        </div>
        {esAdmin && (
          <button onClick={() => setModalCrear(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <span>+</span> Nueva actividad
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap">
        <select value={filtros.estado}
          onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          <option value="programada">Programada</option>
          <option value="realizada">Culminada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select value={filtros.tipo}
          onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los tipos</option>
          <option value="taller">Taller</option>
          <option value="fisioterapia">Fisioterapia</option>
          <option value="cumpleanos">Cumpleaños</option>
          <option value="recreativa">Recreativa</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin text-3xl">⚙️</div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Actividad', 'Tipo', 'Responsable', 'Fecha y hora', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No hay actividades registradas
                  </td>
                </tr>
              ) : (
                data?.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{a.nombre}</p>
                      <p className="text-xs text-gray-400">{a.total_participantes} participantes</p>
                    </td>
                    <td className="px-6 py-4"><BadgeTipo tipo={a.tipo} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{a.responsable}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(a.fecha_hora).toLocaleString('es-BO')}
                    </td>
                    <td className="px-6 py-4"><BadgeEstado estado={a.estado} /></td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/actividades/${a.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Ver →
                      </button>
                      {esAdmin && a.estado === 'programada' && (
                        <>
                          <button
                            onClick={() => mutacionRealizada.mutate(a.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium">
                            ✓ Culminar
                          </button>
                          <button
                            onClick={() => mutacionCancelar.mutate(a.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium">
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalCrear && (
        <ModalCrear
          onClose={() => setModalCrear(false)}
          onGuardado={() => queryClient.invalidateQueries(['actividades'])}
        />
      )}
    </div>
  )
}