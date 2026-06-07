import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { medicamentosService } from '../../services/medicamentosService'
import useAuthStore from '../../store/authStore'

export default function ModalHistorialTomas({ residenteId, onClose }) {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()

  // Id del usuario actual
  const miId = usuario?.id ?? usuario?.user_id ?? usuario?.pk ?? usuario?.usuario_id
  const [filtro, setFiltro] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [corrigiendo, setCorrigiendo] = useState(null)
  const [motivoOmitir, setMotivoOmitir] = useState('')
  const [errorCorreccion, setErrorCorreccion] = useState('')

  // ... (el resto del código se mantiene exactamente igual)

  // Params de fecha para el backend
  const params = {
    ...(fechaDesde ? { fecha_desde: fechaDesde } : {}),
    ...(fechaHasta ? { fecha_hasta: fechaHasta } : {}),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['historial-tomas-completo', residenteId, fechaDesde, fechaHasta],
    queryFn: () => medicamentosService.historialTomas(residenteId, params),
    keepPreviousData: true,
  })

  const mutCorregir = useMutation({
    mutationFn: ({ admId, payload }) =>
      medicamentosService.corregirToma(admId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['historial-tomas-completo', residenteId])
      queryClient.invalidateQueries(['tomas', residenteId])
      queryClient.invalidateQueries(['movimientos'])
      cerrarCorreccion()
    },
    onError: (err) => {
      const d = err.response?.data
      setErrorCorreccion(
        d?.error || d?.observacion?.[0] || d?.detail ||
        (typeof d === 'string' ? d : 'No se pudo corregir la toma')
      )
    },
  })

  const tomas = data?.results || []
  const resumen = data?.resumen

  const tomasFiltradas = tomas.filter(t => {
    if (filtro === 'administradas') return t.administrado
    if (filtro === 'omitidas') return !t.administrado
    return true
  })

  const dentroDe2h = (t) => {
    const limite = new Date(t.fecha_hora_programada).getTime() + 2 * 60 * 60 * 1000
    return Date.now() <= limite
  }

  // Comparación robusta: tolera número vs string
  const esMia = (t) => String(t.realizado_por) === String(miId)

  const limpiarFechas = () => { setFechaDesde(''); setFechaHasta('') }

  const abrirCorreccion = (id) => {
    setCorrigiendo(id)
    setMotivoOmitir('')
    setErrorCorreccion('')
  }
  const cerrarCorreccion = () => {
    setCorrigiendo(null)
    setMotivoOmitir('')
    setErrorCorreccion('')
  }

  // Corregir a ADMINISTRADA: no requiere observación
  const marcarAdministrada = (admId) => {
    mutCorregir.mutate({ admId, payload: { administrado: true } })
  }

  // Corregir a OMITIDA: la observación es obligatoria
  const marcarOmitida = (admId) => {
    if (!motivoOmitir.trim()) {
      setErrorCorreccion('Debes indicar el motivo de la omisión.')
      return
    }
    mutCorregir.mutate({ admId, payload: { administrado: false, observacion: motivoOmitir.trim() } })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📋 Historial de tomas</h2>
            <p className="text-sm text-gray-400">Todas las administraciones del residente</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Resumen */}
          {resumen && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{resumen.total_programadas}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{resumen.total_administradas}</p>
                <p className="text-xs text-gray-500">Administradas</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-500">{resumen.total_omitidas}</p>
                <p className="text-xs text-gray-500">Omitidas</p>
              </div>
            </div>
          )}

          {/* Filtro por fecha */}
          <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
              <input type="date" value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
              <input type="date" value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button onClick={limpiarFechas}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 pb-2">
                Limpiar fechas
              </button>
            )}
          </div>

          {/* Filtros por estado */}
          <div className="flex gap-2">
            {[
              { key: 'todos', label: 'Todas' },
              { key: 'administradas', label: '✅ Administradas' },
              { key: 'omitidas', label: '❌ Omitidas' },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition
                  ${filtro === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista */}
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Cargando historial...</p>
          ) : tomasFiltradas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin tomas en el rango seleccionado</p>
          ) : (
            <div className="space-y-2">
              {tomasFiltradas.map(t => {
                const mia = esMia(t)
                const corregible = dentroDe2h(t) && !t.corregida && mia
                const enCorreccion = corrigiendo === t.id

                return (
                  <div key={t.id} className={`rounded-xl p-3 border
                    ${t.administrado ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 text-sm">{t.medicamento_nombre || `Prescripción #${t.residente_medicamento}`}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                        ${t.administrado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {t.administrado ? '✅ Administrado' : '❌ Omitido'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Programada: {new Date(t.fecha_hora_programada).toLocaleString('es-BO')}
                    </p>
                    {t.fecha_hora_real && (
                      <p className="text-xs text-gray-500">
                        Real: {new Date(t.fecha_hora_real).toLocaleString('es-BO')}
                      </p>
                    )}
                    {t.observacion && <p className="text-xs text-gray-600 mt-1 italic">"{t.observacion}"</p>}
                    <p className="text-xs text-gray-400 mt-1">Registrado por: {t.realizado_por_nombre}</p>

                    {/* Corregir (dentro de 2h, solo una vez, solo mis propias tomas) */}
                    {corregible ? (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        {enCorreccion ? (
                          <div className="space-y-2">
                            {t.administrado ? (
                              // Corregir a OMITIDA
                              <>
                                <label className="block text-xs font-semibold text-gray-600">
                                  Motivo de la omisión (obligatorio)
                                </label>
                                <textarea
                                  rows={2}
                                  value={motivoOmitir}
                                  onChange={e => setMotivoOmitir(e.target.value)}
                                  placeholder="Ej: el residente rechazó la toma"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {errorCorreccion && <p className="text-xs text-red-600">{errorCorreccion}</p>}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => marcarOmitida(t.id)}
                                    disabled={mutCorregir.isPending}
                                    className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg">
                                    {mutCorregir.isPending ? 'Guardando…' : 'Confirmar omisión'}
                                  </button>
                                  <button onClick={cerrarCorreccion}
                                    className="text-xs font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>
                                </div>
                              </>
                            ) : (
                              // Corregir a ADMINISTRADA
                              <>
                                {errorCorreccion && <p className="text-xs text-red-600">{errorCorreccion}</p>}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">¿Marcar como administrada?</span>
                                  <button
                                    onClick={() => marcarAdministrada(t.id)}
                                    disabled={mutCorregir.isPending}
                                    className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg">
                                    {mutCorregir.isPending ? 'Guardando…' : 'Confirmar'}
                                  </button>
                                  <button onClick={cerrarCorreccion}
                                    className="text-xs font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => abrirCorreccion(t.id)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                            ✏️ Corregir (dentro de 2h)
                          </button>
                        )}
                      </div>
                    ) : t.corregida ? (
                      <p className="text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-200 italic">
                        Esta toma ya fue corregida una vez.
                      </p>
                    ) : null}
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