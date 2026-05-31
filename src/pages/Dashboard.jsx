import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

// ── Tarjeta de métrica ─────────────────────────────────────
function TarjetaMetrica({ titulo, valor, icono, color, subtitulo }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{titulo}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{valor ?? '—'}</p>
          {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
        </div>
        <span className="text-4xl">{icono}</span>
      </div>
    </div>
  )
}

// ── Tarjeta de alertas ─────────────────────────────────────
function TarjetaAlertas({ titulo, icono, items, colorBadge, vacio }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icono}</span>
        <h3 className="font-semibold text-gray-700">{titulo}</h3>
        {items?.length > 0 && (
          <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${colorBadge}`}>
            {items.length}
          </span>
        )}
      </div>
      {items?.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">{vacio}</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {items?.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Dashboard principal ────────────────────────────────────
export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then(r => r.data),
    refetchInterval: 60000, // Actualiza cada 60 segundos
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">⚙️</div>
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    </div>
  )

  if (isError) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
      Error al cargar el dashboard. Verifica la conexión con el servidor.
    </div>
  )

  const { resumen_residentes, actividades_hoy_count, alertas } = data

  // Preparar listas de alertas
  const tomasOmitidas = alertas?.tomas_omitidas_hoy?.map(t =>
    `${t.residente} — ${t.medicamento} (${t.hora_programada})`
  ) || []

  const visitasEnCurso = alertas?.visitas_en_curso?.map(v =>
    `${v.visitante} visita a ${v.residente} desde las ${v.entrada}`
  ) || []

  const alertasStock = alertas?.stock?.map(s =>
    `${s.medicamento} — Lote ${s.lote} (${s.tipos_alerta.join(', ')})`
  ) || []

  const actividadesCanceladas = alertas?.actividades_canceladas?.map(a =>
    `${a.nombre} — ${a.hora}`
  ) || []

  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Estado general del asilo en tiempo real</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica
          titulo="Residentes activos"
          valor={resumen_residentes?.activos}
          icono="👴"
          color="border-blue-500"
          subtitulo="En el asilo actualmente"
        />
        <TarjetaMetrica
          titulo="Hospitalizados"
          valor={resumen_residentes?.hospitalizados}
          icono="🏥"
          color="border-yellow-500"
          subtitulo="Fuera temporalmente"
        />
        <TarjetaMetrica
          titulo="Dados de alta"
          valor={resumen_residentes?.dados_de_alta}
          icono="✅"
          color="border-green-500"
          subtitulo="Egresados del sistema"
        />
        <TarjetaMetrica
          titulo="Actividades hoy"
          valor={actividades_hoy_count}
          icono="🎯"
          color="border-purple-500"
          subtitulo="Programadas para hoy"
        />
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TarjetaAlertas
          titulo="Tomas omitidas hoy"
          icono="💊"
          items={tomasOmitidas}
          colorBadge="bg-red-100 text-red-700"
          vacio="✅ Sin tomas omitidas hoy"
        />
        <TarjetaAlertas
          titulo="Visitas en curso"
          icono="👥"
          items={visitasEnCurso}
          colorBadge="bg-blue-100 text-blue-700"
          vacio="Sin visitas activas ahora"
        />
        <TarjetaAlertas
          titulo="Alertas de stock"
          icono="⚠️"
          items={alertasStock}
          colorBadge="bg-orange-100 text-orange-700"
          vacio="✅ Stock en niveles normales"
        />
        <TarjetaAlertas
          titulo="Actividades canceladas hoy"
          icono="❌"
          items={actividadesCanceladas}
          colorBadge="bg-gray-100 text-gray-700"
          vacio="✅ Sin cancelaciones hoy"
        />
      </div>
    </div>
  )
}