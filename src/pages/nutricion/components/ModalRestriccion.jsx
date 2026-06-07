// src/pages/nutricion/components/ModalRestriccion.jsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ShieldX, X, Loader2, FolderArchive } from 'lucide-react'
import { nutricionService } from '../../../services/nutricionService'
import { inputCls, btnPrimario, btnSecundario, extraerError } from './nutricionShared'

export default function ModalRestriccion({ restriccion, onClose, onGuardado }) {
  const esEdicion     = !!restriccion
  const estaArchivada = restriccion?.estado === 'archivado'

  const [form, setForm] = useState({
    nombre:               restriccion?.nombre || '',
    descripcion:          restriccion?.descripcion || '',
    condiciones_asociadas: restriccion?.condiciones_asociadas || '',
    severidad:            restriccion?.severidad || 'obligatorio',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => esEdicion
      ? nutricionService.editarRestriccion(restriccion.id, data)
      : nutricionService.crearRestriccion(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo guardar la restricción.')),
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <ShieldX size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">{esEdicion ? 'Editar' : 'Nueva'} restricción</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {estaArchivada && (
            <div className="bg-warm-100 border border-cream-400 rounded-xl px-4 py-3 text-sm text-warm-500 text-center flex items-center justify-center gap-2">
              <FolderArchive size={14} /> Esta restricción está archivada y no puede editarse.
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre</label>
            <input type="text" value={form.nombre} placeholder="Ej: Sin azúcar"
              disabled={estaArchivada}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Descripción</label>
            <textarea rows={2} value={form.descripcion} placeholder="Explicación clínica"
              disabled={estaArchivada}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Condiciones asociadas</label>
            <input type="text" value={form.condiciones_asociadas} placeholder="Ej: Diabetes tipo 2, Diabetes"
              disabled={estaArchivada}
              onChange={e => setForm({ ...form, condiciones_asociadas: e.target.value })}
              className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`} />
            <p className="text-xs text-warm-400 mt-1">Separa varias con comas.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Severidad</label>
            <select value={form.severidad} disabled={estaArchivada}
              onChange={e => setForm({ ...form, severidad: e.target.value })}
              className={`${inputCls} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}>
              <option value="obligatorio">Obligatorio (bloquea alimentos)</option>
              <option value="recomendado">Recomendado (solo advierte)</option>
            </select>
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400 sticky bottom-0 bg-white">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          {!estaArchivada && (
            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className={`flex-1 ${btnPrimario}`}>
              {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar'}
            </button>
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
