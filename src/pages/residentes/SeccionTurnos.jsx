import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Stethoscope, Plus, Pencil, Search, Loader2 } from 'lucide-react'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

const POR_PAGINA = 10

const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-3 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
const btnSecundario = "px-3 py-2 border border-cream-400 rounded-xl text-sm text-warm-600 hover:bg-warm-50 transition"
const btnLink = "text-sm text-warm-600 hover:text-warm-800 font-semibold inline-flex items-center gap-1 transition"

const TIPOS = [
  { value: 'control_rutinario', label: 'Control rutinario' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'seguimiento', label: 'Seguimiento' },
]
const TIPO_LABEL = Object.fromEntries(TIPOS.map(t => [t.value, t.label]))

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

// Convierte un ISO a formato datetime-local (YYYY-MM-DDTHH:mm) para el input
function aDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SeccionTurnos({ residenteId }) {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [pagina, setPagina] = useState(1)
  const [buscar, setBuscar] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ tipo_consulta: 'control_rutinario', observaciones: '', fecha_hora: '' })
  const [error, setError] = useState('')

  const hayBusqueda = !!(buscar || filtroTipo || fechaDesde || fechaHasta)

  const { data, isLoading } = useQuery({
    queryKey: ['turnos', residenteId, pagina, buscar, filtroTipo, fechaDesde, fechaHasta, hayBusqueda],
    queryFn: () => residentesService.listarTurnos(residenteId, {
      page: hayBusqueda ? pagina : 1,
      page_size: hayBusqueda ? POR_PAGINA : 3,
      buscar: buscar || undefined,
      tipo_consulta: filtroTipo || undefined,
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
    }),
  })

  const turnos = data?.results || []
  const total = data?.total || 0

  const mutCrear = useMutation({
    mutationFn: (payload) => residentesService.crearTurno(residenteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['turnos', residenteId])
      setCreando(false); setForm({ tipo_consulta: 'control_rutinario', observaciones: '', fecha_hora: '' }); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'No se pudo guardar el turno.'),
  })

  const mutEditar = useMutation({
    mutationFn: ({ turnoId, payload }) => residentesService.editarTurno(residenteId, turnoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['turnos', residenteId])
      setEditando(null); setError('')
    },
    onError: (err) => setError(err.response?.data?.error || 'No se pudo editar el turno.'),
  })

  const abrirCrear = () => {
    setCreando(true); setEditando(null)
    setForm({ tipo_consulta: 'control_rutinario', observaciones: '', fecha_hora: '' })
    setError('')
  }
  const abrirEdicion = (t) => {
    setEditando(t.id); setCreando(false)
    setForm({
      tipo_consulta: t.tipo_consulta,
      observaciones: t.observaciones,
      fecha_hora: aDatetimeLocal(t.fecha_hora),
    })
    setError('')
  }

  const guardar = () => {
    if (!form.fecha_hora) { setError('La fecha y hora del turno son obligatorias.'); return }
    const payload = { ...form, fecha_hora: new Date(form.fecha_hora).toISOString() }
    editando ? mutEditar.mutate({ turnoId: editando, payload }) : mutCrear.mutate(payload)
  }

  return (
    <div>
      {esAdmin && !creando && !editando && (
        <button onClick={abrirCrear} className={`mb-3 ${btnLink}`}><Plus size={14} /> Nuevo turno médico</button>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input type="text" value={buscar} placeholder="Buscar en observaciones…"
            onChange={e => { setBuscar(e.target.value); setPagina(1) }}
            className={`${inputCls} pl-9`} />
        </div>
        <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1) }}
          className={`${inputCls} max-w-[180px] cursor-pointer`}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <label className="text-xs text-warm-500">Desde</label>
        <input type="date" value={fechaDesde}
          onChange={e => { setFechaDesde(e.target.value); setPagina(1) }}
          className={`${inputCls} max-w-[160px]`} />
        <label className="text-xs text-warm-500">Hasta</label>
        <input type="date" value={fechaHasta}
          onChange={e => { setFechaHasta(e.target.value); setPagina(1) }}
          className={`${inputCls} max-w-[160px]`} />
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); setPagina(1) }} className={btnSecundario}>Limpiar</button>
        )}
      </div>

      {/* Formulario crear/editar (solo admin) */}
      {esAdmin && (creando || editando) && (
        <div className="bg-warm-50 border border-cream-400 rounded-xl p-3 mb-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase">Tipo de consulta</label>
            <select value={form.tipo_consulta}
              onChange={e => setForm(f => ({ ...f, tipo_consulta: e.target.value }))}
              className={`${inputCls} cursor-pointer`}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase">Fecha y hora</label>
            <input type="datetime-local" value={form.fecha_hora}
              onChange={e => setForm(f => ({ ...f, fecha_hora: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-warm-500 uppercase">Observaciones</label>
            <textarea rows={2} value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              className={inputCls} />
          </div>
          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setCreando(false); setEditando(null); setError('') }} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
            <button onClick={guardar} disabled={mutCrear.isPending || mutEditar.isPending}
              className={`flex-1 ${btnPrimario}`}>
              {(mutCrear.isPending || mutEditar.isPending) ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : (editando ? 'Guardar cambios' : 'Registrar turno')}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <p className="text-sm text-warm-400 text-center py-6">Cargando…</p>
      ) : turnos.length === 0 ? (
        <p className="text-sm text-gray-400">Sin turnos para mostrar</p>
      ) : (
        <div className="space-y-2">
          {turnos.map((t, i) => (
            <div key={t.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs font-bold text-warm-400 bg-warm-100 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  {(pagina - 1) * (hayBusqueda ? POR_PAGINA : 3) + i + 1}
                </span>
                <span className="text-xs bg-info-100 text-info-600 px-2 py-0.5 rounded-full">{TIPO_LABEL[t.tipo_consulta] || t.tipo_consulta}</span>
                <span className="text-xs text-warm-500 flex-1 text-right">{new Date(t.fecha_hora).toLocaleString('es-BO')}</span>
                
                {/* Regla de edición: admin + autor */}
                {esAdmin && t.registrado_por === usuario?.id && editando !== t.id && (
                  <button onClick={() => abrirEdicion(t)} className="text-xs text-warm-500 hover:text-warm-700 font-semibold inline-flex items-center gap-1 transition">
                    <Pencil size={12} /> Editar
                  </button>
                )}
              </div>
              <p className="text-sm text-warm-800 mt-1">{t.observaciones || '—'}</p>
              <p className="text-xs text-warm-400 mt-1">Registrado por: {t.registrado_por_nombre}</p>
            </div>
          ))}
        </div>
      )}

      {/* Paginador condicional */}
      {hayBusqueda && <Paginador pagina={pagina} total={total} porPagina={POR_PAGINA} onChange={setPagina} />}
      {!hayBusqueda && total > 3 && (
        <p className="text-xs text-warm-400 mt-2">Mostrando los últimos 3. Usa los filtros para ver el resto.</p>
      )}
    </div>
  )
}