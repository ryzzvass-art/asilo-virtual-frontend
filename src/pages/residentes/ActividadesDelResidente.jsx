import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Search, CalendarClock, CheckCircle2, XCircle, ArrowRight,
  Palette, Dumbbell, Cake, Gamepad2, Trophy, Pin
} from 'lucide-react'
import { actividadesService } from '../../services/actividadesService'

const POR_PAGINA = 5

const TIPO_ICON = {
  taller: Palette, fisioterapia: Dumbbell, cumpleanos: Cake,
  recreativa: Gamepad2, deportivo: Trophy, otro: Pin,
}
const TIPO_LABEL = {
  taller: 'Taller', fisioterapia: 'Fisioterapia', cumpleanos: 'Cumpleaños',
  recreativa: 'Recreativa', deportivo: 'Deportivo', otro: 'Otro',
}

function etiquetaTipo(a) {
  if (a.tipo === 'otro' && a.tipo_otro) return a.tipo_otro
  return TIPO_LABEL[a.tipo] || a.tipo
}

function aDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

function BadgeEstadoCompacto({ estado }) {
  const cfg = {
    programada: { cls: 'bg-info-100 text-info-600',     Icon: CalendarClock, label: 'Programada' },
    realizada:  { cls: 'bg-health-100 text-health-600', Icon: CheckCircle2,  label: 'Realizada'  },
    cancelada:  { cls: 'bg-danger-100 text-danger-600', Icon: XCircle,       label: 'Cancelada'  },
  }
  const { cls, Icon, label } = cfg[estado] || cfg.programada
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={11} /> {label}
    </span>
  )
}

const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"

export default function ActividadesDelResidente({ residenteId }) {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado]     = useState('')
  const [tipo, setTipo]         = useState('')
  const [fecha, setFecha]       = useState('')
  const [pagina, setPagina]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['actividades-residente', residenteId],
    queryFn: () => actividadesService.listarPorResidente(residenteId),
    enabled: !!residenteId,
  })

  const lista = data ?? []

  // Filtrado en cliente
  const filtradas = lista.filter(a => {
    if (estado && a.estado !== estado) return false
    if (tipo && a.tipo !== tipo) return false
    if (fecha) {
      const fechaLocal = aDatetimeLocal(a.fecha_hora).slice(0, 10)
      if (fechaLocal !== fecha) return false
    }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const coincide =
        a.nombre?.toLowerCase().includes(q) ||
        a.responsable?.toLowerCase().includes(q) ||
        etiquetaTipo(a).toLowerCase().includes(q)
      if (!coincide) return false
    }
    return true
  })

  // Ordenar: más recientes primero
  const ordenadas = [...filtradas].sort((a, b) =>
    new Date(b.fecha_hora) - new Date(a.fecha_hora)
  )

  const totalPaginas = Math.ceil(ordenadas.length / POR_PAGINA)
  const paginadas = ordenadas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  // Estadísticas rápidas
  const stats = {
    total:      lista.length,
    realizadas: lista.filter(a => a.estado === 'realizada').length,
    programadas:lista.filter(a => a.estado === 'programada').length,
    canceladas: lista.filter(a => a.estado === 'cancelada').length,
  }

  const limpiarFiltros = () => {
    setBusqueda(''); setEstado(''); setTipo(''); setFecha(''); setPagina(1)
  }
  const hayFiltros = busqueda || estado || tipo || fecha

  return (
    <div>
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-warm-50 border border-cream-400/60 rounded-xl p-2.5 text-center">
          <p className="text-xs text-warm-500 font-semibold uppercase">Total</p>
          <p className="text-xl font-extrabold text-warm-800">{stats.total}</p>
        </div>
        <div className="bg-health-100 border border-health-600/15 rounded-xl p-2.5 text-center">
          <p className="text-xs text-health-700 font-semibold uppercase">Realizadas</p>
          <p className="text-xl font-extrabold text-health-700">{stats.realizadas}</p>
        </div>
        <div className="bg-info-100 border border-info-600/15 rounded-xl p-2.5 text-center">
          <p className="text-xs text-info-600 font-semibold uppercase">Próximas</p>
          <p className="text-xl font-extrabold text-info-600">{stats.programadas}</p>
        </div>
        <div className="bg-danger-100 border border-danger-600/15 rounded-xl p-2.5 text-center">
          <p className="text-xs text-danger-600 font-semibold uppercase">Canceladas</p>
          <p className="text-xl font-extrabold text-danger-600">{stats.canceladas}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input type="text" value={busqueda} placeholder="Buscar por nombre, tipo o responsable…"
            onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
            className={`${inputCls} pl-9`} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select value={estado} onChange={e => { setEstado(e.target.value); setPagina(1) }}
            className={`${inputCls} cursor-pointer`}>
            <option value="">Estado</option>
            <option value="programada">Programadas</option>
            <option value="realizada">Realizadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
          <select value={tipo} onChange={e => { setTipo(e.target.value); setPagina(1) }}
            className={`${inputCls} cursor-pointer`}>
            <option value="">Tipo</option>
            <option value="taller">Taller</option>
            <option value="fisioterapia">Fisioterapia</option>
            <option value="cumpleanos">Cumpleaños</option>
            <option value="recreativa">Recreativa</option>
            <option value="deportivo">Deportivo</option>
            <option value="otro">Otro</option>
          </select>
          <input type="date" value={fecha}
            onChange={e => { setFecha(e.target.value); setPagina(1) }}
            className={`${inputCls} cursor-pointer`} />
        </div>
        {hayFiltros && (
          <button onClick={limpiarFiltros}
            className="text-xs text-warm-500 hover:text-warm-700 underline">Limpiar filtros</button>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
        </div>
      ) : paginadas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {hayFiltros ? 'No hay actividades que coincidan con los filtros' : 'Este residente aún no participa en ninguna actividad'}
        </p>
      ) : (
        <ul className="space-y-2">
          {paginadas.map(a => {
            const Icon = TIPO_ICON[a.tipo] || Pin
            return (
              <li key={a.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-warm-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-warm-800 text-sm truncate">{a.nombre}</p>
                    <BadgeEstadoCompacto estado={a.estado} />
                  </div>
                  <p className="text-xs text-warm-500 mt-0.5">
                    {etiquetaTipo(a)} · {a.responsable}
                  </p>
                  <p className="text-xs text-warm-400 flex items-center gap-1 mt-0.5">
                    <CalendarClock size={11} /> {new Date(a.fecha_hora).toLocaleString('es-BO')}
                  </p>
                </div>
                <button onClick={() => navigate(`/actividades/${a.id}`)}
                  className="text-warm-600 hover:text-warm-800 text-xs font-semibold inline-flex items-center gap-1 transition shrink-0">
                  Ver <ArrowRight size={12} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Paginador compacto */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-50">
          <p className="text-xs text-warm-400">
            Página {pagina} de {totalPaginas} · {ordenadas.length} actividad{ordenadas.length !== 1 ? 'es' : ''}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}
              className="px-3 py-1 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 transition">
              ←
            </button>
            <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}
              className="px-3 py-1 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 transition">
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
