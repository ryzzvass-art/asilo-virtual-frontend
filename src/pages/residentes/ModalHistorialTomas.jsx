import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { medicamentosService } from '../../services/medicamentosService'

export default function ModalHistorialTomas({ residenteId, onClose }) {
  const [filtro, setFiltro] = useState('todos') // todos | administradas | omitidas

  const { data, isLoading } = useQuery({
    queryKey: ['historial-tomas-completo', residenteId],
    queryFn: () => medicamentosService.historialTomas(residenteId),
  })

  // El endpoint devuelve { results: [...], resumen: {...} }
  const tomas = data?.results || []
  const resumen = data?.resumen

  const tomasFiltradas = tomas.filter(t => {
    if (filtro === 'administradas') return t.administrado
    if (filtro === 'omitidas') return !t.administrado
    return true
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
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
                <p className="text-xs text-gray-500">Programadas</p>
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

          {/* Filtros */}
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
            <p className="text-sm text-gray-400 text-center py-8">Sin tomas registradas</p>
          ) : (
            <div className="space-y-2">
              {tomasFiltradas.map(t => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
