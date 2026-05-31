import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { visitantesService } from '../../services/visitantesService'

export default function ModalAutorizarVisitante({ residenteId, onClose, onGuardado }) {
  const [busqueda, setBusqueda] = useState('')
  const [visitanteSel, setVisitanteSel] = useState(null)
  const [relacion, setRelacion] = useState('familiar')
  const [error, setError] = useState('')

  const { data: visitantes, isFetching } = useQuery({
    queryKey: ['buscar-visitante-auth', busqueda],
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

  const mutation = useMutation({
    mutationFn: () => visitantesService.autorizar(visitanteSel.id, residenteId, { relacion }),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(err.response?.data?.detalle?.error || 'Error al autorizar'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">🔐 Autorizar visitante</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {!visitanteSel ? (
            <>
              <p className="text-sm text-gray-500">Busca al visitante por nombre o C.I.</p>
              <input type="text" placeholder="Nombre o C.I...." value={busqueda}
                onChange={e => setBusqueda(e.target.value)} autoFocus
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {isFetching && <p className="text-sm text-gray-400 text-center">Buscando...</p>}
              {visitantes?.length > 0 && (
                <ul className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {visitantes.map(v => (
                    <li key={v.id}>
                      <button onClick={() => setVisitanteSel(v)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">{v.nombre[0]}</div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{v.nombre}</p>
                          <p className="text-xs text-gray-400">C.I.: {v.dni}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {busqueda.length >= 2 && !isFetching && visitantes?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No se encontró. Regístralo primero desde el módulo Visitas.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">{visitanteSel.nombre[0]}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{visitanteSel.nombre}</p>
                  <p className="text-xs text-gray-400">C.I.: {visitanteSel.dni}</p>
                </div>
                <button onClick={() => setVisitanteSel(null)} className="text-xs text-blue-600">Cambiar</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relación</label>
                <select value={relacion} onChange={e => setRelacion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="familiar">👨‍👩‍👧 Familiar</option>
                  <option value="amigo">👫 Amigo</option>
                  <option value="representante_legal">⚖️ Representante legal</option>
                  <option value="otro">📌 Otro</option>
                </select>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {mutation.isPending ? 'Autorizando...' : '🔐 Autorizar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
