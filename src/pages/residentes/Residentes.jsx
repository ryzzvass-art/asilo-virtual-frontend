
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

// ── Badge de estado ────────────────────────────────────────
function BadgeEstado({ estado }) {
  const estilos = {
    activo:        'bg-green-100 text-green-700',
    hospitalizado: 'bg-yellow-100 text-yellow-700',
    dado_de_alta:  'bg-gray-100 text-gray-500',
  }
  const etiquetas = {
    activo:        '✅ Activo',
    hospitalizado: '🏥 Hospitalizado',
    dado_de_alta:  '📁 Dado de alta',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${estilos[estado]}`}>
      {etiquetas[estado]}
    </span>
  )
}

// ── Modal crear residente ──────────────────────────────────
function ModalCrear({ onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', dni: '',
    fecha_nacimiento: '', fecha_ingreso: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => residentesService.crear(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(
      JSON.stringify(err.response?.data?.detalle || 'Error al crear residente')
    ),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">Nuevo Residente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Nombre',           key: 'nombre',           type: 'text' },
            { label: 'Apellido completo', key: 'apellido',         type: 'text' },
            { label: 'C.I.',              key: 'dni',              type: 'text' },
            { label: 'Fecha nacimiento', key: 'fecha_nacimiento', type: 'date' },
            { label: 'Fecha ingreso',    key: 'fecha_ingreso',    type: 'date' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          ))}
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────
export default function Residentes() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [filtros, setFiltros] = useState({ nombre: '', estado: '' })
  const [modalCrear, setModalCrear] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['residentes', filtros],
    queryFn: () => residentesService.listar(filtros),
  })

  return (
    <div className="space-y-6">

      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Residentes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.total ?? 0} residentes registrados
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={() => setModalCrear(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <span>+</span> Nuevo residente
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre o apellido ..."
          value={filtros.nombre}
          onChange={e => setFiltros({ ...filtros, nombre: e.target.value })}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filtros.estado}
          onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="hospitalizado">Hospitalizado</option>
          <option value="dado_de_alta">Dado de alta</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin text-3xl">⚙️</div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nombre', 'C.I.', 'Fecha ingreso', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No se encontraron residentes
                  </td>
                </tr>
              ) : (
                data?.results?.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                          {r.nombre[0]}{r.apellido[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{r.nombre} {r.apellido}</p>
                          <p className="text-xs text-gray-400">ID: {r.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.dni}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(r.fecha_ingreso).toLocaleDateString('es-BO')}
                    </td>
                    <td className="px-6 py-4">
                      <BadgeEstado estado={r.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/residentes/${r.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver ficha →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalCrear && (
        <ModalCrear
          onClose={() => setModalCrear(false)}
          onGuardado={() => queryClient.invalidateQueries(['residentes'])}
        />
      )}
    </div>
  )
}