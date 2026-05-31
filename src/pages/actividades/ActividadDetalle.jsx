import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actividadesService } from '../../services/actividadesService'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

export default function ActividadDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'
  const [residenteId, setResidenteId] = useState('')

  const { data: actividad, isLoading } = useQuery({
    queryKey: ['actividad', id],
    queryFn: () => actividadesService.obtener(id),
  })

  const { data: residentes } = useQuery({
    queryKey: ['residentes-activos'],
    queryFn: () => residentesService.listar({ estado: 'activo' }),
  })

  const mutacionAsignar = useMutation({
    mutationFn: (rid) => actividadesService.asignarResidente(id, rid),
    onSuccess: () => {
      queryClient.invalidateQueries(['actividad', id])
      setResidenteId('')
    },
  })

  const mutacionDesasignar = useMutation({
    mutationFn: (rid) => actividadesService.desasignarResidente(id, rid),
    onSuccess: () => queryClient.invalidateQueries(['actividad', id]),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin text-4xl">⚙️</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/actividades')}
          className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{actividad?.nombre}</h1>
          <p className="text-gray-400 text-sm">{actividad?.tipo} — {actividad?.responsable}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full
          ${actividad?.estado === 'programada' ? 'bg-blue-100 text-blue-700' :
            actividad?.estado === 'realizada'  ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-500'}`}>
          {actividad?.estado}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">📋 Información</h3>
          <div className="space-y-3">
            {[
              { label: 'Nombre',      valor: actividad?.nombre },
              { label: 'Tipo',        valor: actividad?.tipo },
              { label: 'Responsable', valor: actividad?.responsable },
              { label: 'Fecha y hora',valor: actividad?.fecha_hora ?
                new Date(actividad.fecha_hora).toLocaleString('es-BO') : '—' },
              { label: 'Estado',      valor: actividad?.estado },
            ].map(({ label, valor }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
                <p className="text-sm text-gray-700 mt-1">{valor || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">
            👥 Participantes ({actividad?.participantes?.length ?? 0})
          </h3>

          {/* Asignar residente */}
          {esAdmin && actividad?.estado === 'programada' && (
            <div className="flex gap-2 mb-4">
              <select
                value={residenteId}
                onChange={e => setResidenteId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar residente...</option>
                {residentes?.results?.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} {r.apellido}
                  </option>
                ))}
              </select>
              <button
                onClick={() => residenteId && mutacionAsignar.mutate(residenteId)}
                disabled={!residenteId || mutacionAsignar.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50"
              >
                Asignar
              </button>
            </div>
          )}

          {/* Lista de participantes */}
          {actividad?.participantes?.length === 0 ? (
            <p className="text-sm text-gray-400">Sin participantes asignados</p>
          ) : (
            <ul className="space-y-2">
              {actividad?.participantes?.map(p => (
                <li key={p.residente} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-700">{p.residente_nombre}</span>
                  {esAdmin && actividad?.estado === 'programada' && (
                    <button
                      onClick={() => mutacionDesasignar.mutate(p.residente)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Quitar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}