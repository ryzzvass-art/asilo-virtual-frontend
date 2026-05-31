import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nutricionService } from '../../services/nutricionService'

export default function ModalRestricciones({ residenteId, onClose }) {
  const queryClient = useQueryClient()
  const [restriccionSel, setRestriccionSel] = useState('')
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(null) // restricción obligatoria a confirmar

  // Restricciones activas del residente
  const { data: activas, isLoading } = useQuery({
    queryKey: ['restricciones-residente', residenteId],
    queryFn: () => nutricionService.listarRestriccionesResidente(residenteId),
  })

  // Catálogo de restricciones para elegir
  const { data: catalogo } = useQuery({
    queryKey: ['restricciones-catalogo'],
    queryFn: () => nutricionService.listarRestricciones(),
  })

  const mutActivar = useMutation({
    mutationFn: ({ restriccion_id, confirmado }) =>
      nutricionService.activarRestriccionResidente(residenteId, { restriccion_id, confirmado }),
    onSuccess: () => {
      queryClient.invalidateQueries(['restricciones-residente', residenteId])
      queryClient.invalidateQueries(['residente', residenteId])
      setRestriccionSel('')
      setConfirmando(null)
      setError('')
    },
    onError: (err) => {
      const detalle = err.response?.data?.detalle || err.response?.data
      // Si el error pide confirmación (restricción obligatoria)
      const msgConfirm = detalle?.confirmado?.[0] || detalle?.confirmado
      if (msgConfirm) {
        // Buscar la restricción para mostrar confirmación
        const r = catalogo?.find(x => x.id === parseInt(restriccionSel))
        setConfirmando(r)
        setError('')
      } else {
        setError(detalle?.error || detalle?.restriccion_id?.[0] || JSON.stringify(detalle) || 'Error al activar')
      }
    },
  })

  const mutRevocar = useMutation({
    mutationFn: (rrId) => nutricionService.revocarRestriccionResidente(residenteId, rrId),
    onSuccess: () => {
      queryClient.invalidateQueries(['restricciones-residente', residenteId])
      queryClient.invalidateQueries(['residente', residenteId])
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">🥗 Restricciones del residente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Activas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Restricciones activas</h3>
            {isLoading ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : activas?.length === 0 ? (
              <p className="text-sm text-gray-400">Sin restricciones activas</p>
            ) : (
              <div className="space-y-2">
                {activas?.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={r.restriccion_severidad === 'obligatorio' ? 'text-red-500' : 'text-yellow-500'}>
                        {r.restriccion_severidad === 'obligatorio' ? '🚫' : '⚠️'}
                      </span>
                      <span className="text-sm text-gray-700">{r.restriccion_nombre}</span>
                      <span className="text-xs text-gray-400">({r.restriccion_severidad})</span>
                    </div>
                    <button onClick={() => mutRevocar.mutate(r.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium">Revocar</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmación de restricción obligatoria (RF-22-C) */}
          {confirmando && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium mb-2">
                🚫 "{confirmando.nombre}" es una restricción obligatoria
              </p>
              <p className="text-xs text-red-600 mb-3">
                Bloqueará la asignación de alimentos que la violen. ¿Confirmas la activación?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmando(null)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white">
                  Cancelar
                </button>
                <button
                  onClick={() => mutActivar.mutate({ restriccion_id: confirmando.id, confirmado: true })}
                  disabled={mutActivar.isPending}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-xl text-sm disabled:opacity-50">
                  {mutActivar.isPending ? 'Activando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {/* Activar nueva */}
          {!confirmando && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Activar restricción</h3>
              <div className="flex gap-2">
                <select value={restriccionSel} onChange={e => setRestriccionSel(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar...</option>
                  {catalogo?.filter(r =>
                    !activas?.some(a => a.restriccion === r.id)
                  ).map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} ({r.severidad})</option>
                  ))}
                </select>
                <button
                  onClick={() => restriccionSel && mutActivar.mutate({ restriccion_id: parseInt(restriccionSel), confirmado: false })}
                  disabled={!restriccionSel || mutActivar.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
                  Activar
                </button>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl mt-3">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
