import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus, Pencil, Search, X, Loader2 } from 'lucide-react'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

const POR_PAGINA = 10

const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-3 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
const btnSecundario = "px-3 py-2 border border-cream-400 rounded-xl text-sm text-warm-600 hover:bg-warm-50 transition"
const btnLink = "text-sm text-warm-600 hover:text-warm-800 font-semibold inline-flex items-center gap-1 transition"

function Paginador({ pagina, total, porPagina, onChange }) {
  const totalPaginas = Math.ceil(total / porPagina)
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center justify-between pt-3 mt-2 border-t border-cream-400 flex-wrap gap-2">
      <p className="text-xs text-warm-400">
        Mostrando {Math.min((pagina - 1) * porPagina + 1, total)}–{Math.min(pagina * porPagina, total)} de {total}
      </p>
      <div className="flex gap-1 flex-wrap">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1}
          className="px-2.5 py-1 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 transition">←</button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition
              ${n === pagina ? 'bg-warm-600 text-white border-warm-600' : 'border-cream-400 text-warm-600 hover:bg-warm-100'}`}>{n}</button>
        ))}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas}
          className="px-2.5 py-1 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 transition">→</button>
      </div>
    </div>
  )
}

export default function SeccionObservaciones({ residenteId }) {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [pagina, setPagina] = useState(1)
  const [buscar, setBuscar] = useState('')
  const [fecha, setFecha] = useState('')
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ estado_fisico: '', estado_emocional: '' })
  const [error, setError] = useState('')

  // Detectar si hay búsqueda/filtro activo
  const hayBusqueda = !!(buscar || fecha)

  const { data, isLoading } = useQuery({
    queryKey: ['observaciones', residenteId, pagina, buscar, fecha, hayBusqueda],
    queryFn: () => residentesService.listarObservaciones(residenteId, {
      page: hayBusqueda ? pagina : 1,
      page_size: hayBusqueda ? POR_PAGINA : 3,   // sin búsqueda: solo 3
      buscar: buscar || undefined,
      fecha: fecha || undefined,
    }),
  })

  const observaciones = data?.results || []
  const total = data?.total || 0

  const mutCrear = useMutation({
    mutationFn: (payload) => residentesService.crearObservacion(residenteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['observaciones', residenteId])
      setCreando(false); setForm({ estado_fisico: '', estado_emocional: '' }); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'No se pudo guardar la observación.'),
  })

  const mutEditar = useMutation({
    mutationFn: ({ obsId, payload }) => residentesService.editarObservacion(residenteId, obsId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['observaciones', residenteId])
      setEditando(null); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'No se pudo editar la observación.'),
  })

  const puedeEditar = (o) => o.registrado_por === usuario?.id

  const abrirEdicion = (o) => {
    setEditando(o.id)
    setForm({ estado_fisico: o.estado_fisico, estado_emocional: o.estado_emocional })
    setError('')
  }

  return (
    <div>
      {/* Crear */}
      {!creando && !editando && (
        <button onClick={() => { setCreando(true); setForm({ estado_fisico: '', estado_emocional: '' }); setError('') }}
          className={`mb-3 ${btnLink}`}><Plus size={14} /> Nueva observación</button>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input type="text" value={buscar} placeholder="Buscar en el contenido…"
            onChange={e => { setBuscar(e.target.value); setPagina(1) }}
            className={`${inputCls} pl-9`} />
        </div>
        <input type="date" value={fecha}
          onChange={e => { setFecha(e.target.value); setPagina(1) }}
          className={`${inputCls} max-w-[170px]`} />
        {fecha && (
          <button onClick={() => { setFecha(''); setPagina(1) }} className={btnSecundario}>Limpiar fecha</button>
        )}
      </div>

      {/* Formulario crear/editar */}
      {(creando || editando) && (
        <div className="bg-warm-50 border border-cream-400 rounded-xl p-3 mb-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase">Estado físico</label>
            <textarea rows={2} value={form.estado_fisico}
              onChange={e => setForm(f => ({ ...f, estado_fisico: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase">Estado emocional</label>
            <textarea rows={2} value={form.estado_emocional}
              onChange={e => setForm(f => ({ ...f, estado_emocional: e.target.value }))}
              className={inputCls} />
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setCreando(false); setEditando(null); setError('') }} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
            {editando ? (
              <button onClick={() => mutEditar.mutate({ obsId: editando, payload: form })} disabled={mutEditar.isPending}
                className={`flex-1 ${btnPrimario}`}>
                {mutEditar.isPending ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : 'Guardar cambios'}
              </button>
            ) : (
              <button onClick={() => mutCrear.mutate(form)} disabled={mutCrear.isPending}
                className={`flex-1 ${btnPrimario}`}>
                {mutCrear.isPending ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : 'Registrar'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <p className="text-sm text-warm-400 text-center py-6">Cargando…</p>
      ) : observaciones.length === 0 ? (
        <p className="text-sm text-gray-400">Sin observaciones para mostrar</p>
      ) : (
        <div className="space-y-2">
          {observaciones.map((o, i) => (
            <div key={o.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs font-bold text-warm-400 bg-warm-100 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  {(pagina - 1) * (hayBusqueda ? POR_PAGINA : 3) + i + 1}
                </span>
                <span className="text-xs text-warm-500 flex-1">
                  {new Date(o.fecha_hora).toLocaleString('es-BO')}
                </span>
                {puedeEditar(o) && editando !== o.id && (
                  <button onClick={() => abrirEdicion(o)} className="text-xs text-warm-500 hover:text-warm-700 font-semibold inline-flex items-center gap-1 transition">
                    <Pencil size={12} /> Editar
                  </button>
                )}
              </div>
              <p className="text-sm text-warm-800"><span className="font-semibold">Físico:</span> {o.estado_fisico || '—'}</p>
              <p className="text-sm text-warm-800"><span className="font-semibold">Emocional:</span> {o.estado_emocional || '—'}</p>
              <p className="text-xs text-warm-400 mt-1">Registrado por: {o.registrado_por_nombre}</p>
            </div>
          ))}
        </div>
      )}

      {/* Paginación y mensaje */}
      {hayBusqueda && <Paginador pagina={pagina} total={total} porPagina={POR_PAGINA} onChange={setPagina} />}
      {!hayBusqueda && total > 3 && (
        <p className="text-xs text-warm-400 mt-2">Mostrando los últimos 3. Usa el buscador o la fecha para ver el resto.</p>
      )}
    </div>
  )
}