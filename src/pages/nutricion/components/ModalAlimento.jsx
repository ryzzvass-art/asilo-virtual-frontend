// src/pages/nutricion/components/ModalAlimento.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Apple, X, Loader2, FolderArchive, Trash2 } from 'lucide-react'
import { nutricionService } from '../../../services/nutricionService'
import { inputCls, btnPrimario, GRUPOS_ALIMENTARIOS, extraerError } from './nutricionShared'
import { BadgeSeveridad } from './BadgesNutricion'

export default function ModalAlimento({ alimento, onClose, onGuardado }) {
  const queryClient   = useQueryClient()
  const esEdicion     = !!alimento
  const estaArchivado = alimento?.estado === 'archivado'

  const grupoInicial  = alimento?.grupo_alimentario || ''
  const esOtroInicial = grupoInicial && !GRUPOS_ALIMENTARIOS.includes(grupoInicial)

  const [form, setForm] = useState({
    nombre:            alimento?.nombre || '',
    grupo_alimentario: esOtroInicial ? 'Otro' : grupoInicial,
  })
  const [grupoOtro, setGrupoOtro]         = useState(esOtroInicial ? grupoInicial : '')
  const [error, setError]                 = useState('')
  const [restriccionSel, setRestriccionSel] = useState('')

  const grupoFinal = form.grupo_alimentario === 'Otro' ? grupoOtro : form.grupo_alimentario

  const { data: restricciones } = useQuery({
    queryKey: ['restricciones-activas'],
    queryFn: () => nutricionService.listarRestricciones(),
  })
  const { data: vinculadas } = useQuery({
    queryKey: ['restricciones-alimento', alimento?.id],
    queryFn: () => nutricionService.listarRestriccionesAlimento(alimento.id),
    enabled: esEdicion,
  })

  const mutGuardar = useMutation({
    mutationFn: (data) => esEdicion
      ? nutricionService.editarAlimento(alimento.id, data)
      : nutricionService.crearAlimento(data),
    onSuccess: () => { onGuardado(); if (!esEdicion) onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo guardar el alimento.')),
  })
  const mutVincular = useMutation({
    mutationFn: (rid) => nutricionService.vincularRestriccion(alimento.id, rid),
    onSuccess: () => {
      queryClient.invalidateQueries(['restricciones-alimento', alimento.id])
      queryClient.invalidateQueries(['alimentos'])
      setRestriccionSel('')
    },
  })
  const mutDesvincular = useMutation({
    mutationFn: (rid) => nutricionService.desvincularRestriccion(alimento.id, rid),
    onSuccess: () => {
      queryClient.invalidateQueries(['restricciones-alimento', alimento.id])
      queryClient.invalidateQueries(['alimentos'])
    },
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Apple size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">{esEdicion ? 'Editar' : 'Nuevo'} alimento</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {estaArchivado && (
            <div className="bg-warm-100 border border-cream-400 rounded-xl px-4 py-3 text-sm text-warm-500 text-center flex items-center justify-center gap-2">
              <FolderArchive size={14} /> Este alimento está archivado y no puede editarse.
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre</label>
            <input type="text" value={form.nombre} placeholder="Ej: Arroz blanco"
              disabled={estaArchivado}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Grupo alimentario</label>
            <select value={form.grupo_alimentario} disabled={estaArchivado}
              onChange={e => setForm({ ...form, grupo_alimentario: e.target.value })}
              className={`${inputCls} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}>
              <option value="">Seleccionar grupo...</option>
              {GRUPOS_ALIMENTARIOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {form.grupo_alimentario === 'Otro' && (
              <input type="text" value={grupoOtro} disabled={estaArchivado}
                placeholder="Describe el grupo alimentario..."
                onChange={e => setGrupoOtro(e.target.value)}
                className={`${inputCls} mt-2 disabled:opacity-50 disabled:cursor-not-allowed`} />
            )}
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
          {!estaArchivado && (
            <button onClick={() => mutGuardar.mutate({ ...form, grupo_alimentario: grupoFinal })}
              disabled={mutGuardar.isPending || !form.nombre || !grupoFinal}
              className={`w-full ${btnPrimario}`}>
              {mutGuardar.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : (esEdicion ? 'Guardar cambios' : 'Crear alimento')}
            </button>
          )}
          {!esEdicion && (
            <p className="text-xs text-warm-400 text-center">Tras crearlo podrás vincular restricciones editándolo.</p>
          )}
          {esEdicion && (
            <div className="border-t border-cream-400 pt-4">
              <h3 className="text-sm font-bold text-warm-700 mb-2">Restricciones que viola</h3>
              {vinculadas?.length === 0 ? (
                <p className="text-xs text-warm-400 mb-3">Ninguna restricción vinculada</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {vinculadas?.map(r => (
                    <div key={r.restriccion} className="flex items-center justify-between bg-warm-50 border border-cream-400/60 rounded-xl px-3 py-2 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-warm-800">{r.restriccion_nombre}</span>
                        <BadgeSeveridad severidad={r.restriccion_severidad} />
                      </div>
                      {!estaArchivado && (
                        <button onClick={() => mutDesvincular.mutate(r.restriccion)}
                          className="text-xs text-danger-600 hover:text-danger-700 font-semibold inline-flex items-center gap-1 shrink-0 transition">
                          <Trash2 size={12} /> Quitar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!estaArchivado && (
                <div className="flex gap-2">
                  <select value={restriccionSel} onChange={e => setRestriccionSel(e.target.value)}
                    className={`flex-1 ${inputCls} cursor-pointer`}>
                    <option value="">Agregar restricción...</option>
                    {restricciones?.filter(r => !vinculadas?.some(v => v.restriccion === r.id)).map(r => (
                      <option key={r.id} value={r.id}>{r.nombre} ({r.severidad})</option>
                    ))}
                  </select>
                  <button onClick={() => restriccionSel && mutVincular.mutate(restriccionSel)}
                    disabled={!restriccionSel || mutVincular.isPending} className={btnPrimario}>
                    Vincular
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}
