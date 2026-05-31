import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { medicamentosService } from '../../services/medicamentosService'

export default function ModalPrescribir({ residenteId, onClose, onGuardado }) {
  const [form, setForm] = useState({
    medicamento: '',
    dosis: '',
    via_administracion: 'oral',
    horarios: [''],
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
  })
  const [error, setError] = useState('')

  const { data: medicamentos } = useQuery({
    queryKey: ['medicamentos-activos'],
    queryFn: () => medicamentosService.listar({ estado: 'activo' }),
  })

  const mutation = useMutation({
    mutationFn: (data) => medicamentosService.crearPrescripcion(residenteId, data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(
      err.response?.data?.detalle?.error ||
      JSON.stringify(err.response?.data?.detalle || 'Error al prescribir')
    ),
  })

  const actualizarHorario = (i, valor) => {
    const nuevos = [...form.horarios]
    nuevos[i] = valor
    setForm({ ...form, horarios: nuevos })
  }
  const agregarHorario = () => setForm({ ...form, horarios: [...form.horarios, ''] })
  const quitarHorario = (i) => setForm({ ...form, horarios: form.horarios.filter((_, idx) => idx !== i) })

  const guardar = () => {
    const horariosLimpios = form.horarios.filter(h => h.trim() !== '')
    mutation.mutate({ ...form, horarios: horariosLimpios, fecha_fin: form.fecha_fin || null })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-800">💊 Prescribir medicamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
            <select value={form.medicamento}
              onChange={e => setForm({ ...form, medicamento: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar del catálogo...</option>
              {medicamentos?.map(m => (
                <option key={m.id} value={m.id}>{m.nombre_comercial} ({m.principio_activo})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
              <input type="text" value={form.dosis} placeholder="Ej: 500mg"
                onChange={e => setForm({ ...form, dosis: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vía</label>
              <select value={form.via_administracion}
                onChange={e => setForm({ ...form, via_administracion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="oral">Oral</option>
                <option value="inyectable">Inyectable</option>
                <option value="topica">Tópica</option>
                <option value="otra">Otra</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horarios de toma</label>
            <div className="space-y-2">
              {form.horarios.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input type="time" value={h}
                    onChange={e => actualizarHorario(i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.horarios.length > 1 && (
                    <button onClick={() => quitarHorario(i)}
                      className="px-3 text-red-500 hover:text-red-700">×</button>
                  )}
                </div>
              ))}
              <button onClick={agregarHorario}
                className="text-sm text-blue-600 hover:text-blue-800">+ Agregar horario</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input type="date" value={form.fecha_inicio}
                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin (opcional)</label>
              <input type="date" value={form.fecha_fin}
                onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm">Cancelar</button>
          <button onClick={guardar} disabled={mutation.isPending || !form.medicamento}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Prescribir'}
          </button>
        </div>
      </div>
    </div>
  )
}
