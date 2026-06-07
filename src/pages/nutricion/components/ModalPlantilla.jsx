// src/pages/nutricion/components/ModalPlantilla.jsx
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChefHat, X, Loader2, CheckCircle2, Clock, Pencil } from 'lucide-react'
import { nutricionService } from '../../../services/nutricionService'
import { inputCls, btnPrimario, btnSecundario, TIPOS_DIETA, TIPOS_COMIDA, TIPO_COMIDA_ICON, extraerError } from './nutricionShared'

// ── Modal Crear ────────────────────────────────────────────
export default function ModalPlantilla({ onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre:        '',
    tipo_dieta:    '',
    observaciones: '',
    fecha_menu:    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  })
  const [comidas, setComidas] = useState({
    desayuno: { alimento: '', descripcion_menu: '' },
    almuerzo: { alimento: '', descripcion_menu: '' },
    merienda: { alimento: '', descripcion_menu: '' },
    cena:     { alimento: '', descripcion_menu: '' },
  })
  const [error, setError] = useState('')

  const { data: alimentos } = useQuery({
    queryKey: ['alimentos-activos'],
    queryFn: () => nutricionService.listarAlimentos(),
  })

  const mutation = useMutation({
    mutationFn: (data) => nutricionService.crearPlantilla(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo crear el plan nutricional.')),
  })

  const handleSubmit = () => {
    setError('')
    const comidasArray = TIPOS_COMIDA.map(tipo => ({
      tipo_comida:      tipo,
      alimento:         parseInt(comidas[tipo].alimento),
      descripcion_menu: comidas[tipo].descripcion_menu,
    }))
    mutation.mutate({ ...form, comidas: comidasArray })
  }

  const todosCompletos = TIPOS_COMIDA.every(t => comidas[t].alimento)

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <ChefHat size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Nuevo plan nutricional</h2>
            <p className="text-xs text-warm-500">Completa las 4 comidas para poder crearlo</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre del plan</label>
              <input type="text" value={form.nombre} placeholder="Ej: Dieta diabética estándar"
                onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Tipo de dieta</label>
              <select value={form.tipo_dieta} onChange={e => setForm({ ...form, tipo_dieta: e.target.value })} className={`${inputCls} cursor-pointer`}>
                <option value="">Seleccionar tipo...</option>
                {TIPOS_DIETA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Fecha del menú</label>
              <input type="date" value={form.fecha_menu}
                onChange={e => setForm({ ...form, fecha_menu: e.target.value })} className={inputCls} />
              <p className="text-xs text-warm-400 mt-1">Generalmente el día siguiente.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Observaciones</label>
              <textarea rows={2} value={form.observaciones} placeholder="Indicaciones adicionales..."
                onChange={e => setForm({ ...form, observaciones: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="border-t border-cream-400 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-warm-700">Comidas del día</h3>
              <div className="flex gap-1">
                {TIPOS_COMIDA.map(t => (
                  <div key={t} className={`w-2 h-2 rounded-full transition-colors ${comidas[t].alimento ? 'bg-health-500' : 'bg-cream-400'}`} title={t} />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {TIPOS_COMIDA.map(tipo => (
                <div key={tipo} className={`border rounded-xl p-3 transition-colors ${comidas[tipo].alimento ? 'border-health-300 bg-health-50/40' : 'border-cream-400 bg-warm-50'}`}>
                  <p className="text-sm font-semibold text-warm-700 mb-2 capitalize flex items-center gap-2">
                    <span>{TIPO_COMIDA_ICON[tipo]}</span> {tipo}
                    {comidas[tipo].alimento && <CheckCircle2 size={13} className="text-health-600 ml-auto" />}
                  </p>
                  <div className="space-y-2">
                    <select value={comidas[tipo].alimento}
                      onChange={e => setComidas(c => ({ ...c, [tipo]: { ...c[tipo], alimento: e.target.value } }))}
                      className={`${inputCls} cursor-pointer`}>
                      <option value="">Seleccionar alimento...</option>
                      {alimentos?.map(a => <option key={a.id} value={a.id}>{a.nombre} — {a.grupo_alimentario}</option>)}
                    </select>
                    <input type="text" value={comidas[tipo].descripcion_menu}
                      placeholder="Descripción del menú (opcional)"
                      onChange={e => setComidas(c => ({ ...c, [tipo]: { ...c[tipo], descripcion_menu: e.target.value } }))}
                      className={inputCls} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
          {!todosCompletos && (
            <p className="text-xs text-warm-400 text-center flex items-center justify-center gap-1.5">
              <Clock size={12} /> Selecciona un alimento para cada comida del día
            </p>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400 sticky bottom-0 bg-white">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          <button onClick={handleSubmit}
            disabled={mutation.isPending || !form.nombre || !form.tipo_dieta || !todosCompletos}
            className={`flex-1 ${btnPrimario}`}>
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creando…</> : <><ChefHat size={15} /> Crear plan nutricional</>}
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

// ── Modal Editar ───────────────────────────────────────────
export function ModalEditarPlantilla({ plantilla, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre:        plantilla.nombre,
    tipo_dieta:    plantilla.tipo_dieta,
    observaciones: plantilla.observaciones,
    fecha_menu:    plantilla.fecha_menu,
  })
  const [comidas, setComidas] = useState(() => {
    const base = {
      desayuno: { alimento: '', descripcion_menu: '' },
      almuerzo: { alimento: '', descripcion_menu: '' },
      merienda: { alimento: '', descripcion_menu: '' },
      cena:     { alimento: '', descripcion_menu: '' },
    }
    plantilla.comidas?.forEach(c => {
      base[c.tipo_comida] = { alimento: String(c.alimento), descripcion_menu: c.descripcion_menu || '' }
    })
    return base
  })
  const [error, setError] = useState('')

  const { data: alimentos } = useQuery({
    queryKey: ['alimentos-activos'],
    queryFn: () => nutricionService.listarAlimentos(),
  })

  const mutation = useMutation({
    mutationFn: (data) => nutricionService.editarPlantilla(plantilla.id, data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(extraerError(err, 'No se pudo guardar los cambios del plan.')),
  })

  const handleSubmit = () => {
    setError('')
    const comidasArray = TIPOS_COMIDA.map(tipo => ({
      tipo_comida:      tipo,
      alimento:         parseInt(comidas[tipo].alimento),
      descripcion_menu: comidas[tipo].descripcion_menu,
    }))
    mutation.mutate({ ...form, comidas: comidasArray })
  }

  const todosCompletos = TIPOS_COMIDA.every(t => comidas[t].alimento)

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Pencil size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Editar plan nutricional</h2>
            <p className="text-xs text-warm-500">Solo disponible mientras está pendiente</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre</label>
              <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Tipo de dieta</label>
              <select value={form.tipo_dieta} onChange={e => setForm({ ...form, tipo_dieta: e.target.value })} className={`${inputCls} cursor-pointer`}>
                {TIPOS_DIETA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Fecha del menú</label>
              <input type="date" value={form.fecha_menu} onChange={e => setForm({ ...form, fecha_menu: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Observaciones</label>
              <textarea rows={2} value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="border-t border-cream-400 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-warm-700">Comidas del día</h3>
              <div className="flex gap-1">
                {TIPOS_COMIDA.map(t => (
                  <div key={t} className={`w-2 h-2 rounded-full transition-colors ${comidas[t].alimento ? 'bg-health-500' : 'bg-cream-400'}`} title={t} />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {TIPOS_COMIDA.map(tipo => (
                <div key={tipo} className={`border rounded-xl p-3 transition-colors ${comidas[tipo].alimento ? 'border-health-300 bg-health-50/40' : 'border-cream-400 bg-warm-50'}`}>
                  <p className="text-sm font-semibold text-warm-700 mb-2 capitalize flex items-center gap-2">
                    <span>{TIPO_COMIDA_ICON[tipo]}</span> {tipo}
                    {comidas[tipo].alimento && <CheckCircle2 size={13} className="text-health-600 ml-auto" />}
                  </p>
                  <div className="space-y-2">
                    <select value={comidas[tipo].alimento}
                      onChange={e => setComidas(c => ({ ...c, [tipo]: { ...c[tipo], alimento: e.target.value } }))}
                      className={`${inputCls} cursor-pointer`}>
                      <option value="">Seleccionar alimento...</option>
                      {alimentos?.map(a => <option key={a.id} value={a.id}>{a.nombre} — {a.grupo_alimentario}</option>)}
                    </select>
                    <input type="text" value={comidas[tipo].descripcion_menu}
                      placeholder="Descripción (opcional)"
                      onChange={e => setComidas(c => ({ ...c, [tipo]: { ...c[tipo], descripcion_menu: e.target.value } }))}
                      className={inputCls} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400 sticky bottom-0 bg-white">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          <button onClick={handleSubmit}
            disabled={mutation.isPending || !form.nombre || !form.tipo_dieta || !todosCompletos}
            className={`flex-1 ${btnPrimario}`}>
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : <><Pencil size={15} /> Guardar cambios</>}
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
