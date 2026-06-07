// src/pages/nutricion/components/ModalRechazarAsignar.jsx
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ThumbsDown, X, Loader2, Users, AlertTriangle,
  CheckCircle2, Search, ClipboardList
} from 'lucide-react'
import { nutricionService } from '../../../services/nutricionService'
import { residentesService } from '../../../services/residentesService'
import { inputCls, btnPrimario, btnSecundario, TIPO_COMIDA_ICON, extraerError } from './nutricionShared'

// ── Modal Rechazar ─────────────────────────────────────────
export function ModalRechazar({ plantilla, onClose, onGuardado }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError]   = useState('')

  const mutation = useMutation({
    mutationFn: () => nutricionService.rechazarPlantilla(plantilla.id, { motivo_rechazo: motivo }),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo rechazar el plan.')),
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400">
          <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center shrink-0">
            <ThumbsDown size={20} className="text-danger-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Rechazar plan nutricional</h2>
            <p className="text-xs text-warm-500 truncate">"{plantilla.nombre}"</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">
              Motivo del rechazo <span className="text-danger-500">*</span>
            </label>
            <textarea rows={4} value={motivo}
              placeholder="Explica al cuidador qué debe corregir..."
              onChange={e => setMotivo(e.target.value)}
              className={inputCls} />
            <p className="text-xs text-warm-400 mt-1">Mínimo 10 caracteres.</p>
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          <button onClick={() => mutation.mutate()}
            disabled={mutation.isPending || motivo.length < 10}
            className="flex-1 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50 transition flex items-center justify-center gap-2">
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Rechazando…</> : <><ThumbsDown size={15} /> Rechazar</>}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}

// ── Modal Asignar ──────────────────────────────────────────
export function ModalAsignar({ plantilla, onClose, onGuardado }) {
  const [paso, setPaso]               = useState(1)
  const [residenteId, setResidenteId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [conflictos, setConflictos]   = useState([])
  const [reemplazos, setReemplazos]   = useState({})
  const [error, setError]             = useState('')
  const [busqueda, setBusqueda]       = useState('')

  const { data: residentes } = useQuery({
    queryKey: ['residentes-lista'],
    queryFn: () => residentesService.listar().then(data =>
      Array.isArray(data) ? data : (data.results ?? [])
    ),
  })

  const residentesFiltrados = residentes?.filter(r =>
    r.estado === 'activo' &&
    (`${r.nombre} ${r.apellido}`).toLowerCase().includes(busqueda.toLowerCase())
  ) || []

  const residenteSelObj = residentes?.find(r => r.id === parseInt(residenteId))

  const mutation = useMutation({
    mutationFn: (body) => nutricionService.asignarPlantilla(residenteId, body),
    onSuccess: (data) => {
      if (data?.conflictos?.length) {
        setConflictos(data.conflictos)
        setPaso(2)
        setError('')
      } else {
        onGuardado()
        onClose()
      }
    },
    onError: (err) => setError(extraerError(err, 'No se pudo asignar el plan.')),
  })

  const handlePaso1 = () => {
    setError('')
    mutation.mutate({ plantilla_id: plantilla.id, fecha_inicio: fechaInicio })
  }

  const handlePaso2 = () => {
    setError('')
    const sinResolver = conflictos.filter(c => !reemplazos[c.comida_plantilla_id])
    if (sinResolver.length > 0) {
      setError(`Debes elegir un reemplazo para: ${sinResolver.map(c => c.tipo_comida).join(', ')}`)
      return
    }
    const reemplazosArray = Object.entries(reemplazos).map(([cid, aid]) => ({
      comida_plantilla_id: parseInt(cid),
      alimento_id:         parseInt(aid),
    }))
    mutation.mutate({ plantilla_id: plantilla.id, fecha_inicio: fechaInicio, reemplazos: reemplazosArray })
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-health-600 to-health-500 flex items-center justify-center shrink-0">
            <Users size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Asignar plan nutricional</h2>
            <p className="text-xs text-warm-500 truncate">"{plantilla.nombre}"</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 flex items-center justify-center transition"><X size={16} /></button>
        </div>

        {/* Indicador pasos */}
        <div className="flex items-center gap-2 px-5 pt-4">
          {[{ n: 1, label: 'Elegir residente' }, { n: 2, label: 'Resolver conflictos' }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                ${paso >= s.n ? 'bg-warm-600 text-white' : 'bg-cream-300 text-warm-500'}`}>
                {s.n}
              </div>
              <span className={`text-xs font-medium ${paso >= s.n ? 'text-warm-700' : 'text-warm-400'}`}>{s.label}</span>
              {i === 0 && <div className={`flex-1 h-px mx-1 ${paso >= 2 ? 'bg-warm-400' : 'bg-cream-300'}`} />}
            </div>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {paso === 1 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Buscar residente activo</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                  <input type="text" value={busqueda} placeholder="Nombre del residente..."
                    onChange={e => { setBusqueda(e.target.value); setResidenteId('') }}
                    className={`${inputCls} pl-9`} />
                </div>
                {busqueda && !residenteId && (
                  <div className="mt-1 border border-cream-400 rounded-xl bg-white shadow-md max-h-44 overflow-y-auto">
                    {residentesFiltrados.length === 0 ? (
                      <p className="text-sm text-warm-400 p-3 text-center">Sin resultados</p>
                    ) : (
                      residentesFiltrados.map(r => (
                        <button key={r.id} onClick={() => { setResidenteId(r.id); setBusqueda(`${r.nombre} ${r.apellido}`) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-warm-800 hover:bg-warm-50 transition flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-warm-100 flex items-center justify-center text-warm-600 font-bold text-xs shrink-0">
                            {r.nombre?.[0]}{r.apellido?.[0]}
                          </div>
                          {r.nombre} {r.apellido}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {residenteSelObj && (
                  <div className="mt-2 flex items-center gap-2 bg-health-50 border border-health-200 rounded-xl px-3 py-2">
                    <CheckCircle2 size={14} className="text-health-600" />
                    <span className="text-sm text-health-700 font-medium">{residenteSelObj.nombre} {residenteSelObj.apellido}</span>
                    <button onClick={() => { setResidenteId(''); setBusqueda('') }} className="ml-auto text-health-400 hover:text-health-600"><X size={13} /></button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Fecha de inicio</label>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inputCls} />
              </div>
            </>
          )}

          {paso === 2 && (
            <div className="space-y-3">
              <div className="bg-alert-50 border border-alert-200 rounded-xl p-3 flex gap-2">
                <AlertTriangle size={15} className="text-alert-600 shrink-0 mt-0.5" />
                <p className="text-sm text-alert-700">Algunos alimentos violan restricciones del residente. Elige un reemplazo para cada uno.</p>
              </div>
              {conflictos.map(c => (
                <div key={c.comida_plantilla_id} className="border border-danger-200 rounded-xl p-3 bg-danger-50/40">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{TIPO_COMIDA_ICON[c.tipo_comida]}</span>
                    <span className="text-sm font-semibold text-warm-800 capitalize">{c.tipo_comida}</span>
                    <span className="text-xs text-danger-600 bg-danger-100 px-2 py-0.5 rounded-full ml-auto">🚫 {c.alimento_nombre}</span>
                  </div>
                  <p className="text-xs text-danger-600 mb-2">Viola: {c.conflictos.map(x => x.restriccion).join(', ')}</p>
                  {c.sugerencias?.length > 0 ? (
                    <div className="space-y-1.5">
                      {c.sugerencias.map(s => (
                        <label key={s.alimento_id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition text-xs
                            ${reemplazos[c.comida_plantilla_id] === s.alimento_id ? 'border-health-400 bg-health-50' : 'border-cream-400 bg-white hover:bg-warm-50'}`}>
                          <input type="radio" name={`r-${c.comida_plantilla_id}`}
                            checked={reemplazos[c.comida_plantilla_id] === s.alimento_id}
                            onChange={() => setReemplazos(r => ({ ...r, [c.comida_plantilla_id]: s.alimento_id }))}
                            className="accent-health-600" />
                          <span className="text-warm-800">{s.nombre}</span>
                          <span className="text-warm-400 ml-auto">{s.grupo_alimentario}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-warm-400 italic">Sin sugerencias disponibles.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-danger-600 text-xs bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>

        <div className="flex gap-3 p-5 border-t border-cream-400 sticky bottom-0 bg-white">
          {paso === 2 && (
            <button onClick={() => { setPaso(1); setConflictos([]); setReemplazos({}) }} className={btnSecundario}>Atrás</button>
          )}
          {paso === 1 && <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>}
          <button onClick={paso === 1 ? handlePaso1 : handlePaso2}
            disabled={mutation.isPending || (paso === 1 && (!residenteId || !fechaInicio))}
            className={`flex-1 ${btnPrimario}`}>
            {mutation.isPending
              ? <><Loader2 size={15} className="animate-spin" /> Verificando…</>
              : paso === 1 ? 'Verificar y continuar →' : <><CheckCircle2 size={15} /> Confirmar asignación</>}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}
