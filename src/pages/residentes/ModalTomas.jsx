import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { medicamentosService } from '../../services/medicamentosService'

export default function ModalTomas({ prescripcion, residenteId, onClose }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('registrar')
  const [form, setForm] = useState({
    administrado: 'true',
    fecha_hora_programada: '',
    fecha_hora_real: '',
    observacion: '',
  })
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const { data: historial, isLoading } = useQuery({
    queryKey: ['tomas', residenteId],
    queryFn: () => medicamentosService.historialTomas(residenteId),
    enabled: tab === 'historial',
  })

  const mutation = useMutation({
    mutationFn: (data) => medicamentosService.registrarToma(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tomas', residenteId])
      setExito(true)
      setForm({ administrado: 'true', fecha_hora_programada: '', fecha_hora_real: '', observacion: '' })
      setTimeout(() => setExito(false), 2000)
    },
    onError: (err) => setError(
      err.response?.data?.detalle?.error ||
      JSON.stringify(err.response?.data?.detalle || 'Error al registrar la toma')
    ),
  })

  const guardar = () => {
    setError('')
    const administrado = form.administrado === 'true'
    if (!form.fecha_hora_programada) {
      setError('La fecha y hora programada es obligatoria')
      return
    }
    if (!administrado && !form.observacion.trim()) {
      setError('Si la toma fue omitida, la observación es obligatoria')
      return
    }
    mutation.mutate({
      residente_medicamento: prescripcion.id,
      administrado,
      fecha_hora_programada: form.fecha_hora_programada,
      fecha_hora_real: administrado ? (form.fecha_hora_real || form.fecha_hora_programada) : null,
      observacion: form.observacion,
    })
  }

  const tomasPrescripcion = historial?.results?.filter(t => t.residente_medicamento === prescripcion.id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">💊 Registro de tomas</h2>
            <p className="text-sm text-gray-400">{prescripcion.medicamento_nombre} · {prescripcion.dosis}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="flex gap-1 p-4 border-b">
          {[
            { key: 'registrar', label: '✏️ Registrar toma' },
            { key: 'historial', label: '📋 Historial' },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError('') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition
                ${tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'registrar' && (
            <div className="space-y-4">
              {prescripcion.horarios?.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Horarios prescritos:</p>
                  <p className="text-sm font-medium text-blue-700">{prescripcion.horarios.join(' · ')}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Se administró?</label>
                <select value={form.administrado}
                  onChange={e => setForm({ ...form, administrado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="true">✅ Sí, administrado</option>
                  <option value="false">❌ No, omitido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora programada</label>
                <input type="datetime-local" value={form.fecha_hora_programada}
                  onChange={e => setForm({ ...form, fecha_hora_programada: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {form.administrado === 'true' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y hora real <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input type="datetime-local" value={form.fecha_hora_real}
                    onChange={e => setForm({ ...form, fecha_hora_real: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-400 mt-1">Si lo dejas vacío, se usa la hora programada</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observación {form.administrado === 'false' && <span className="text-red-500">*</span>}
                </label>
                <textarea rows={2} value={form.observacion}
                  placeholder={form.administrado === 'false' ? 'Motivo por el que no se administró' : 'Notas (opcional)'}
                  onChange={e => setForm({ ...form, observacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
              {exito && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl">✓ Toma registrada correctamente</p>}
              <button onClick={guardar} disabled={mutation.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {mutation.isPending ? 'Guardando...' : 'Registrar toma'}
              </button>
            </div>
          )}

          {tab === 'historial' && (
            <div>
              {isLoading ? (
                <p className="text-sm text-gray-400 text-center py-6">Cargando...</p>
              ) : tomasPrescripcion?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin tomas registradas para esta prescripción</p>
              ) : (
                <div className="space-y-2">
                  {tomasPrescripcion?.map(t => (
                    <div key={t.id} className={`rounded-xl p-3 border
                      ${t.administrado ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                          ${t.administrado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {t.administrado ? '✅ Administrado' : '❌ Omitido'}
                        </span>
                        <span className="text-xs text-gray-400">{t.realizado_por_nombre}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Programada: {new Date(t.fecha_hora_programada).toLocaleString('es-BO')}
                      </p>
                      {t.fecha_hora_real && (
                        <p className="text-xs text-gray-500">
                          Real: {new Date(t.fecha_hora_real).toLocaleString('es-BO')}
                        </p>
                      )}
                      {t.observacion && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{t.observacion}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
