import { useQuery } from '@tanstack/react-query'
import {
  UserRound, BedDouble, CheckCircle2, CalendarDays,
  Pill, Users, AlertTriangle, XCircle,
  TrendingUp, Clock, Activity, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import api from '../services/api'

const P = {
  warm800: '#7C3D28', warm700: '#8B4513', warm600: '#A0522D',
  warm500: '#C87941', warm400: '#E8A96A', warm200: '#F7DFC0',
  warm100: '#FAEEE3', warm50:  '#FDF6EE',
  cream200: '#F5EBD8', cream400: '#E8D5BF',
  health700: '#2D5C3E', health600: '#4A7C59', health100: '#E8F5ED',
  alert600: '#D4742A',  alert100:  '#FFF0E0',
  danger600: '#B94040', danger100: '#FFF0F0',
  info600:   '#5A7FA8', info100:   '#EBF2FA',
}

/* ── Tarjeta métrica grande ─────────────────────────────────── */
function TarjetaMetrica({ titulo, valor, icono: Icon, accent, bg, iconColor, subtitulo, delay = 0 }) {
  return (
    <div
      style={{
        background: 'white', borderRadius: '20px',
        padding: '24px', border: `1px solid ${P.cream400}`,
        boxShadow: '0 2px 16px rgba(124,61,40,0.07)',
        animation: `fadeUp 0.5s ease ${delay}ms both`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(124,61,40,0.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(124,61,40,0.07)' }}
    >
      {/* Barra de acento superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: accent, borderRadius: '20px 20px 0 0' }} />

      {/* Fondo decorativo */}
      <div style={{
        position: 'absolute', right: '-10px', bottom: '-10px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: bg, opacity: 0.5,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: P.warm600, margin: '0 0 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {titulo}
          </p>
          <p style={{ fontSize: '42px', fontWeight: 900, color: P.warm800, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>
            {valor ?? '—'}
          </p>
          {subtitulo && (
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {subtitulo}
            </p>
          )}
        </div>
        <div style={{
          width: '52px', height: '52px', borderRadius: '16px',
          background: bg, border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={24} color={iconColor} />
        </div>
      </div>
    </div>
  )
}

/* ── Ítem de alerta ─────────────────────────────────────────── */
function AlertaItem({ texto, urgente }) {
  return (
    <div style={{
      fontSize: '13px', color: P.warm800,
      background: urgente ? P.danger100 : P.warm50,
      borderRadius: '10px', padding: '9px 12px',
      borderLeft: `3px solid ${urgente ? P.danger600 : P.warm400}`,
      lineHeight: 1.45,
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      {urgente && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: P.danger600, flexShrink: 0 }} />}
      {texto}
    </div>
  )
}

/* ── Tarjeta alerta ─────────────────────────────────────────── */
function TarjetaAlertas({ titulo, icono: Icon, items, accent, bg, iconColor, vacio, delay = 0 }) {
  return (
    <div style={{
      background: 'white', borderRadius: '20px', padding: '20px 22px',
      boxShadow: '0 2px 16px rgba(124,61,40,0.07)', border: `1px solid ${P.cream400}`,
      animation: `fadeUp 0.5s ease ${delay}ms both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${accent}20` }}>
          <Icon size={18} color={iconColor} />
        </div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: P.warm800, margin: 0, flex: 1 }}>{titulo}</h3>
        {items?.length > 0 && (
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
            background: bg, color: iconColor, border: `1px solid ${accent}25`,
          }}>
            {items.length}
          </span>
        )}
      </div>

      {!items?.length ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 0', justifyContent: 'center' }}>
          <CheckCircle2 size={15} color={P.health600} />
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{vacio}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
          {items.map((item, i) => <AlertaItem key={i} texto={item} />)}
        </div>
      )}
    </div>
  )
}

/* ── Tooltip recharts ───────────────────────────────────────── */
function WarmTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white', border: `1px solid ${P.cream400}`, borderRadius: '12px',
      padding: '10px 14px', boxShadow: '0 4px 20px rgba(124,61,40,0.14)',
    }}>
      <p style={{ fontSize: '12px', color: P.warm600, margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: 800, color: P.warm800, margin: 0 }}>
        {payload[0].value}
      </p>
    </div>
  )
}

/* ── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then(r => r.data),
    refetchInterval: 60000,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: `3px solid ${P.cream400}`, borderTopColor: P.warm500,
          animation: 'spin 0.9s linear infinite', margin: '0 auto 12px',
        }} />
        <p style={{ color: P.warm600, fontSize: '14px', margin: 0 }}>Cargando dashboard…</p>
      </div>
    </div>
  )

  if (isError) return (
    <div style={{ background: P.danger100, border: `1px solid ${P.danger600}40`, borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <AlertTriangle size={20} color={P.danger600} />
      <p style={{ color: P.danger600, margin: 0, fontSize: '14px' }}>Error al cargar el dashboard. Verifica la conexión con el servidor.</p>
    </div>
  )

  const { resumen_residentes: rr, actividades_hoy_count, alertas } = data

  const tomasOmitidas       = alertas?.tomas_omitidas_hoy?.map(t => `${t.residente} — ${t.medicamento} (${t.hora_programada})`) || []
  const visitasEnCurso      = alertas?.visitas_en_curso?.map(v => `${v.visitante} visita a ${v.residente} desde las ${v.entrada}`) || []
  const alertasStock        = alertas?.stock?.map(s => `${s.medicamento} — Lote ${s.lote} (${s.tipos_alerta.join(', ')})`) || []
  const actividadesCanceladas = alertas?.actividades_canceladas?.map(a => `${a.nombre} — ${a.hora}`) || []

  const totalAlertas = tomasOmitidas.length + alertasStock.length + actividadesCanceladas.length

  /* Datos gráfico barras — paleta fría/vibrante para contraste */
  const barData = [
    { name: 'Activos',   v: rr?.activos ?? 0,          color: '#5A7FA8' }, // azul pizarra
    { name: 'Hosp.',     v: rr?.hospitalizados ?? 0,    color: '#7B5EA7' }, // violeta
    { name: 'Alta',      v: rr?.dados_de_alta ?? 0,     color: '#3A8C6E' }, // verde esmeralda
    { name: 'Activid.',  v: actividades_hoy_count ?? 0, color: '#C87941' }, // ámbar (acento app)
  ]

  /* Datos gráfico pie — paleta cálida/terrosa para contraste con las barras */
  const pieData = [
    { name: 'Activos',        value: rr?.activos ?? 0,        fill: '#E8A96A' }, // melocotón
    { name: 'Hospitalizados', value: rr?.hospitalizados ?? 0, fill: '#B94040' }, // rojo tierra
    { name: 'Dados de alta',  value: rr?.dados_de_alta ?? 0,  fill: '#7C3D28' }, // terracota oscuro
  ]
  const totalResidentes = (rr?.activos ?? 0) + (rr?.hospitalizados ?? 0) + (rr?.dados_de_alta ?? 0)

  const horaActualiz = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', animation: 'fadeUp 0.4s ease both' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: P.warm800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: P.warm600, margin: 0 }}>
            Estado general del asilo en tiempo real
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'white', border: `1px solid ${P.cream400}`,
            borderRadius: '20px', padding: '6px 14px',
            boxShadow: '0 1px 6px rgba(124,61,40,0.06)',
          }}>
            <Clock size={13} color={P.warm500} />
            <span style={{ fontSize: '12px', color: P.warm600, fontWeight: 500 }}>
              Actualizado {horaActualiz}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            title="Actualizar ahora"
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: `1px solid ${P.cream400}`, background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: P.warm600, transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = P.warm100; e.currentTarget.style.borderColor = P.warm400 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = P.cream400 }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── 4 Métricas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: '16px' }}>
        <TarjetaMetrica titulo="Residentes activos" valor={rr?.activos}
          icono={UserRound} accent={P.warm500} bg={P.warm100} iconColor={P.warm600}
          subtitulo="En el asilo actualmente" delay={0} />
        <TarjetaMetrica titulo="Hospitalizados" valor={rr?.hospitalizados}
          icono={BedDouble} accent={P.alert600} bg={P.alert100} iconColor={P.alert600}
          subtitulo="Fuera temporalmente" delay={80} />
        <TarjetaMetrica titulo="Dados de alta" valor={rr?.dados_de_alta}
          icono={CheckCircle2} accent={P.health600} bg={P.health100} iconColor={P.health600}
          subtitulo="Egresados del sistema" delay={160} />
        <TarjetaMetrica titulo="Actividades hoy" valor={actividades_hoy_count}
          icono={CalendarDays} accent={P.info600} bg={P.info100} iconColor={P.info600}
          subtitulo="Programadas para hoy" delay={240} />
      </div>

      {/* ── Fila central: Gráfico barras + Pie + Panel alertas ── */}
      <div className="dash-central" style={{ display: 'grid', gridTemplateColumns: '1fr 260px 200px', gap: '16px', animation: 'fadeUp 0.5s ease 0.3s both' }}>

        {/* Gráfico barras — resumen general mejorado */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '22px 24px',
          boxShadow: '0 2px 16px rgba(124,61,40,0.07)', border: `1px solid ${P.cream400}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: P.warm100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color={P.warm500} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: P.warm800, margin: 0 }}>Resumen general</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Vista comparativa de hoy</p>
              </div>
            </div>
            {/* Leyenda */}
            <div style={{ display: 'flex', gap: '14px' }}>
              {barData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.color }} />
                  <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={42} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.cream400} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: P.warm600, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<WarmTooltip />} cursor={{ fill: P.warm50, radius: 8 }} />
              <Bar dataKey="v" radius={[10, 10, 0, 0]}>
                {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico pie — distribución residentes */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '22px 20px',
          boxShadow: '0 2px 16px rgba(124,61,40,0.07)', border: `1px solid ${P.cream400}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: P.warm100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={16} color={P.warm500} />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: 0 }}>Distribución</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Residentes</p>
            </div>
          </div>

          {/* Pie chart */}
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Número central */}
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <p style={{ fontSize: '24px', fontWeight: 900, color: P.warm800, margin: 0, lineHeight: 1 }}>{totalResidentes}</p>
              <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '2px 0 0' }}>total</p>
            </div>
          </div>

          {/* Leyenda pie */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.fill }} />
                  <span style={{ fontSize: '12px', color: P.warm800 }}>{d.name}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: d.fill }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel resumen alertas */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '20px',
          boxShadow: '0 2px 16px rgba(124,61,40,0.07)', border: `1px solid ${P.cream400}`,
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: totalAlertas > 0 ? P.danger100 : P.health100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color={totalAlertas > 0 ? P.danger600 : P.health600} />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: 0 }}>Alertas activas</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Resumen de hoy</p>
            </div>
          </div>

          {[
            { label: 'Tomas omitidas',  count: tomasOmitidas.length,           color: P.danger600, bg: P.danger100  },
            { label: 'Stock bajo',      count: alertasStock.length,            color: P.alert600,  bg: P.alert100   },
            { label: 'Cancelaciones',   count: actividadesCanceladas.length,   color: '#6B7280',   bg: '#F9FAFB'    },
            { label: 'Visitas activas', count: visitasEnCurso.length,          color: P.info600,   bg: P.info100    },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: '12px', background: bg,
              border: count > 0 ? `1px solid ${color}20` : 'none',
            }}>
              <span style={{ fontSize: '12px', color: P.warm800, fontWeight: 500 }}>{label}</span>
              <span style={{
                fontSize: '15px', fontWeight: 800, color,
                minWidth: '28px', textAlign: 'right',
              }}>
                {count}
              </span>
            </div>
          ))}

          {/* Total */}
          <div style={{
            marginTop: '4px', padding: '12px', borderRadius: '14px',
            background: totalAlertas > 0
              ? `linear-gradient(135deg, ${P.danger100}, #fff5f5)`
              : `linear-gradient(135deg, ${P.health100}, #f0fff4)`,
            border: `1px solid ${totalAlertas > 0 ? P.danger600 : P.health600}25`,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 2px', fontWeight: 500 }}>Total alertas</p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: totalAlertas > 0 ? P.danger600 : P.health600, margin: 0, lineHeight: 1 }}>
              {totalAlertas}
            </p>
            <p style={{ fontSize: '11px', color: totalAlertas > 0 ? P.danger600 : P.health600, margin: '3px 0 0', fontWeight: 600 }}>
              {totalAlertas === 0 ? 'Todo en orden ✓' : 'requieren atención'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Alertas detalladas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '16px' }}>
        <TarjetaAlertas titulo="Tomas omitidas hoy" icono={Pill}
          items={tomasOmitidas} accent={P.danger600} bg={P.danger100} iconColor={P.danger600}
          vacio="Sin tomas omitidas hoy" delay={400} />
        <TarjetaAlertas titulo="Visitas en curso" icono={Users}
          items={visitasEnCurso} accent={P.info600} bg={P.info100} iconColor={P.info600}
          vacio="Sin visitas activas ahora" delay={460} />
        <TarjetaAlertas titulo="Alertas de stock" icono={AlertTriangle}
          items={alertasStock} accent={P.alert600} bg={P.alert100} iconColor={P.alert600}
          vacio="Stock en niveles normales" delay={520} />
        <TarjetaAlertas titulo="Actividades canceladas" icono={XCircle}
          items={actividadesCanceladas} accent="#9CA3AF" bg="#F9FAFB" iconColor="#6B7280"
          vacio="Sin cancelaciones hoy" delay={580} />
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }

        /* Tablet: pasa a 2 columnas (barras arriba ancho completo, pie + alertas debajo) */
        @media (max-width: 1024px) {
          .dash-central { grid-template-columns: 1fr 1fr !important; }
          .dash-central > :first-child { grid-column: 1 / -1; }
        }
        /* Móvil: todo en una columna apilada */
        @media (max-width: 640px) {
          .dash-central { grid-template-columns: 1fr !important; }
          .dash-central > :first-child { grid-column: auto; }
        }
      `}</style>
    </div>
  )
}
