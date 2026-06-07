import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actividadesService } from '../../services/actividadesService'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

const TIPO_LABEL = {
  taller: 'Taller', fisioterapia: 'Fisioterapia', cumpleanos: 'Cumpleaños',
  recreativa: 'Recreativa', deportivo: 'Deportivo', otro: 'Otro',
}

function etiquetaTipo(a) {
  if (!a) return '—'
  if (a.tipo === 'otro' && a.tipo_otro) return a.tipo_otro
  return TIPO_LABEL[a.tipo] || a.tipo
}

export default function ActividadDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'
  const esCuidador = usuario?.rol === 'cuidador'
  // Admin y cuidador pueden asignar; solo admin puede quitar.
  const puedeAsignar = esAdmin || esCuidador
  const [residenteId, setResidenteId] = useState('')
  const [errorAsignar, setErrorAsignar] = useState('')

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
      setErrorAsignar('')
    },
    // Corrección 1: mostrar mensaje "ya asignado" (o el error que devuelva el backend)
    onError: (err) =>
      setErrorAsignar(err.response?.data?.error || 'No se pudo asignar el residente.'),
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

  const editable = actividad?.estado === 'programada'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/actividades')}
          className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{actividad?.nombre}</h1>
          <p className="text-gray-400 text-sm">{etiquetaTipo(actividad)} — {actividad?.responsable}</p>
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
              { label: 'Tipo',        valor: etiquetaTipo(actividad) },
              { label: 'Responsable', valor: actividad?.responsable },
              { label: 'Fecha y hora',valor: actividad?.fecha_hora ?
                new Date(actividad.fecha_hora).toLocaleString('es-BO') : '—' },
              { label: 'Estado',      valor: actividad?.estado },
              ...(actividad?.observaciones
                ? [{ label: actividad.estado === 'cancelada' ? 'Motivo de cancelación' : 'Observaciones', valor: actividad.observaciones }]
                : []),
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

          {/* Asignar residente — admin y cuidador, solo si está programada */}
          {puedeAsignar && editable && (
            <div className="mb-4">
              <div className="flex gap-2">
                <select
                  value={residenteId}
                  onChange={e => { setResidenteId(e.target.value); setErrorAsignar('') }}
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
              {/* Mensaje de error (ej: "ya está asignado") */}
              {errorAsignar && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl mt-2">{errorAsignar}</p>
              )}
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
                  {/* Quitar — SOLO admin */}
                  {esAdmin && editable && (
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
