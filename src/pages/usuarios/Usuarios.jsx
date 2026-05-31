import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosService } from '../../services/usuariosService'
import useAuthStore from '../../store/authStore'

function BadgeRol({ rol }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full
      ${rol === 'administrador' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
      {rol === 'administrador' ? '👑 Administrador' : '🧑‍⚕️ Cuidador'}
    </span>
  )
}

function BadgeEstado({ estado }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full
      ${estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {estado === 'activo' ? '✅ Activo' : '🚫 Inactivo'}
    </span>
  )
}

function ModalCrearUsuario({ onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '',
    rol: 'cuidador', password: ''
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => usuariosService.crear(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(
      JSON.stringify(err.response?.data?.detalle || 'Error al crear usuario')
    ),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Nombre',   key: 'nombre',   type: 'text' },
            { label: 'Apellido', key: 'apellido', type: 'text' },
            { label: 'Email',    key: 'email',    type: 'email' },
            { label: 'Password', key: 'password', type: 'password' },
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={form.rol}
              onChange={e => setForm({ ...form, rol: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="cuidador">Cuidador</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
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

export default function Usuarios() {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'
  const [modalCrear, setModalCrear] = useState(false)

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosService.listar,
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }) => usuariosService.cambiarEstado(id, estado),
    onSuccess: () => queryClient.invalidateQueries(['usuarios']),
  })

  if (!esAdmin) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
      No tienes permisos para ver esta sección.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {usuarios?.length ?? 0} usuarios registrados
          </p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <span>+</span> Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin text-3xl">⚙️</div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Usuario', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios?.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                        {u.nombre[0]}{u.apellido[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{u.nombre} {u.apellido}</p>
                        <p className="text-xs text-gray-400">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4"><BadgeRol rol={u.rol} /></td>
                  <td className="px-6 py-4"><BadgeEstado estado={u.estado} /></td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('es-BO')}
                  </td>
                  <td className="px-6 py-4">
                    {u.id !== usuario?.id && (
                      <button
                        onClick={() => mutacionEstado.mutate({
                          id: u.id,
                          estado: u.estado === 'activo' ? 'inactivo' : 'activo'
                        })}
                        className={`text-xs font-medium px-3 py-1 rounded-lg transition
                          ${u.estado === 'activo'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                      >
                        {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalCrear && (
        <ModalCrearUsuario
          onClose={() => setModalCrear(false)}
          onGuardado={() => queryClient.invalidateQueries(['usuarios'])}
        />
      )}
    </div>
  )
}