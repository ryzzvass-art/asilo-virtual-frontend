// src/pages/dashboard/DashboardActividades.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity, CalendarDays, CheckCircle2, XCircle, TrendingUp,
  CalendarClock, ArrowRight, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import api from '../services/api'

const P = {
  warm800: '#7C3D28', warm700: '#8B4513', warm600: '#A0522D',
  warm500: '#C87941', warm400: '#E8A96A', warm200: '#F7DFC0',
  warm100: '#FAEEE3', warm50:  '#FDF6EE',
  cream400: '#E8D5BF',
  health600: '#4A7C59', health100: '#E8F5ED',
  alert600: '#D4742A',  alert100:  '#FFF0E0',
  danger600: '#B94040', danger100: '#FFF0F0',
  info600:   '#5A7FA8', info100:   '#EBF2FA',
}

const TIPO_COLORS = {
  taller: '#A0522D', fisioterapia: '#5A7FA8', cumpleanos: '#D4742A',
  recreativa: '#7B5EA7', deportivo: '#4A7C59', otro: '#9CA3AF',
}

const fmt = iso => new Date(iso).toLocaleString('es-BO', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
})

function MiniTarjeta({ titulo, valor, Icon, color, bg, subtitulo, onClick }) {
  const clicable = typeof onClick === 'function'
  return (
    <div onClick={onClick}
      style={{
        background: 'white', borderRadius: '16px', padding: '16px',
        border: `1px solid ${P.cream400}`, boxShadow: '0 2px 12px rgba(124,61,40,0.06)',
        cursor: clicable ? 'pointer' : 'default', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!clicable) return
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,61,40,0.12)'
      }}
      onMouseLeave={e => {
        if (!clicable) return
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,61,40,0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: P.warm600, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {titulo}
        </p>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: 900, color: P.warm800, margin: 0, lineHeight: 1 }}>
        {valor ?? '—'}
      </p>
      {subtitulo && (
        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '6px 0 0' }}>{subtitulo}</p>
      )}
      {clicable && (
        <p style={{ fontSize: '10px', color, margin: '4px 0 0', fontWeight: 700 }}>Ver lista →</p>
      )}
    </div>
  )
}

function WarmTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'white', border: `1px solid ${P.cream400}`, borderRadius: '10px',
      padding: '8px 12px', boxShadow: '0 6px 18px rgba(124,61,40,0.12)', fontSize: '12px',
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: P.warm800 }}>{label}</p>
      <p style={{ margin: '2px 0 0', color: P.warm600 }}>
        {payload[0].value} actividad{payload[0].value !== 1 ? 'es' : ''}
      </p>
    </div>
  )
}

// ── Modal de lista (similar al ModalLista del Dashboard principal) ──
function ModalListaActividades({ titulo, Icon, accent, bg, items, modo, onClose, onIrActividad }) {
  // modo: 'normal' (nombre + tipo + fecha) o 'canceladas' (nombre + motivo + fecha)
  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(60,26,10,0.45)',
        backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, padding: '16px',
        animation: 'fadeIn 0.18s ease',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '22px', width: '100%', maxWidth: '600px',
          maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '20px',
          borderBottom: `1px solid ${P.cream400}`, position: 'sticky', top: 0,
          background: P.warm50, zIndex: 1, borderRadius: '22px 22px 0 0',
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: P.warm800, margin: 0 }}>{titulo}</h2>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>
              {items.length} actividad{items.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '16px 20px' }}>
          {!items.length ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '14px', padding: '32px 0' }}>Sin registros</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map(item => (
                <div key={item.id}
                  onClick={() => onIrActividad(item.id)}
                  style={{
                    border: `1px solid ${P.cream400}`, borderRadius: '12px', padding: '11px 14px',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = P.warm50}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: P.warm800, margin: 0 }}>{item.nombre}</p>
                    <p style={{ fontSize: '11px', color: accent, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                      {fmt(item.fecha_hora)}
                    </p>
                  </div>
                  {modo === 'canceladas' ? (
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
                      <span style={{ fontWeight: 600 }}>Motivo:</span> {item.observaciones}
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0', textTransform: 'capitalize' }}>
                      {item.tipo} · {item.responsable}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardActividades() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('proximas')
  const [modal, setModal] = useState(null)  // ← NUEVO

  const { data, isLoading } = useQuery({
    queryKey: ['actividades-resumen-dashboard'],
    queryFn: () => api.get('/actividades/resumen-dashboard/').then(r => r.data),
    refetchInterval: 60000,
  })

  if (isLoading || !data) return null

  const ultimos7Data = (data.ultimos_7_dias || []).map(d => ({
    name: new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', ''),
    v: d.total, color: P.warm500,
  }))

  const porTipoData = (data.por_tipo || []).map(t => ({
    name: t.label, v: t.total, color: TIPO_COLORS[t.tipo] || P.warm500,
  }))

  // Tab "Próximas" muestra solo las primeras 5 de la lista completa de programadas
  const proximasDelTab = (data.programadas_lista || []).slice(0, 5)
  // Tab "Canceladas" muestra las primeras 5 (las más recientes ya vienen primero)
  const canceladasDelTab = (data.canceladas_lista || []).slice(0, 5)

  // Handlers para abrir el modal
  const abrirProgramadas = () => setModal({
    titulo: 'Actividades programadas',
    Icon: CalendarClock, accent: P.info600, bg: P.info100,
    items: data.programadas_lista || [], modo: 'normal',
  })
  const abrirRealizadas = () => setModal({
    titulo: 'Realizadas en los últimos 30 días',
    Icon: CheckCircle2, accent: P.health600, bg: P.health100,
    items: data.realizadas_lista || [], modo: 'normal',
  })
  const abrirCanceladas = () => setModal({
    titulo: 'Canceladas en los últimos 30 días',
    Icon: XCircle, accent: P.danger600, bg: P.danger100,
    items: data.canceladas_lista || [], modo: 'canceladas',
  })
  const abrirTotalMes = () => setModal({
    titulo: 'Todas las actividades del mes',
    Icon: TrendingUp, accent: P.warm600, bg: P.warm100,
    items: data.total_mes_lista || [], modo: 'normal',
  })

  const irActividad = (id) => {
    setModal(null)
    navigate(`/actividades/${id}`)
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease 0.36s both' }}>
      {/* Header de sección */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: P.info100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={20} color={P.info600} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '16px', fontWeight: 800, color: P.warm800, margin: 0 }}>Actividades</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Eventos, talleres y participación · últimos 30 días</p>
        </div>
      </div>

      {/* Métricas (todas clicables) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '12px', marginBottom: '16px' }}>
        <MiniTarjeta titulo="Programadas" valor={data.programadas_count}
          Icon={CalendarClock} color={P.info600} bg={P.info100}
          subtitulo="Futuras" onClick={abrirProgramadas} />
        <MiniTarjeta titulo="Realizadas (30d)" valor={data.realizadas_mes}
          Icon={CheckCircle2} color={P.health600} bg={P.health100}
          subtitulo="Culminadas con éxito" onClick={abrirRealizadas} />
        <MiniTarjeta titulo="Canceladas (30d)" valor={data.canceladas_mes}
          Icon={XCircle} color={P.danger600} bg={P.danger100}
          subtitulo="Con motivo registrado" onClick={abrirCanceladas} />
        <MiniTarjeta titulo="Total mes" valor={data.total_mes}
          Icon={TrendingUp} color={P.warm600} bg={P.warm100}
          subtitulo="Cualquier estado" onClick={abrirTotalMes} />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: '12px', marginBottom: '16px' }}>
        {/* Últimos 7 días */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '18px 20px', border: `1px solid ${P.cream400}`, boxShadow: '0 2px 12px rgba(124,61,40,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CalendarDays size={14} color={P.warm500} />
            <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: 0 }}>Últimos 7 días</p>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={ultimos7Data} barSize={24} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.cream400} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: P.warm600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<WarmTooltip />} cursor={{ fill: P.warm50, radius: 6 }} />
              <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                {ultimos7Data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por tipo */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '18px 20px', border: `1px solid ${P.cream400}`, boxShadow: '0 2px 12px rgba(124,61,40,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp size={14} color={P.warm500} />
            <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: 0 }}>Por tipo (30 días)</p>
          </div>
          {porTipoData.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '32px 0' }}>Sin actividades en el período</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={porTipoData} barSize={20} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.cream400} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: P.warm600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<WarmTooltip />} cursor={{ fill: P.warm50, radius: 6 }} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {porTipoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabs próximas / canceladas */}
      <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${P.cream400}`, boxShadow: '0 2px 12px rgba(124,61,40,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${P.cream400}` }}>
          {[
            { key: 'proximas',   label: 'Próximas',   Icon: CalendarClock, count: proximasDelTab.length },
            { key: 'canceladas', label: 'Canceladas', Icon: XCircle,        count: canceladasDelTab.length },
          ].map(({ key, label, Icon, count }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '12px 16px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                color: tab === key ? P.warm800 : '#9CA3AF',
                borderBottom: tab === key ? `2px solid ${P.warm500}` : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.15s ease',
              }}>
              <Icon size={13} /> {label}
              <span style={{
                background: tab === key ? P.warm100 : '#F3F4F6',
                color: tab === key ? P.warm700 : '#9CA3AF',
                borderRadius: '8px', padding: '1px 7px', fontSize: '11px',
              }}>{count}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '14px 18px' }}>
          {tab === 'proximas' && (
            proximasDelTab.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '24px 0' }}>No hay actividades próximas programadas</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {proximasDelTab.map(a => (
                  <li key={a.id} onClick={() => irActividad(a.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: P.warm50, border: `1px solid ${P.cream400}60`,
                      borderRadius: '12px', padding: '10px 12px', cursor: 'pointer',
                    }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: P.info100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CalendarClock size={16} color={P.info600} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: 0 }}>{a.nombre}</p>
                      <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0', textTransform: 'capitalize' }}>
                        {a.tipo} · {a.responsable}
                      </p>
                    </div>
                    <p style={{ fontSize: '11px', color: P.warm600, fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                      {fmt(a.fecha_hora)}
                    </p>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === 'canceladas' && (
            canceladasDelTab.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '24px 0' }}>Sin actividades canceladas en los últimos 30 días</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {canceladasDelTab.map(a => (
                  <li key={a.id} onClick={() => irActividad(a.id)}
                    style={{
                      background: P.danger100, border: `1px solid ${P.danger600}20`,
                      borderRadius: '12px', padding: '10px 12px', cursor: 'pointer',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <XCircle size={14} color={P.danger600} />
                      <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: 0, flex: 1 }}>{a.nombre}</p>
                      <p style={{ fontSize: '11px', color: P.danger600, margin: 0, whiteSpace: 'nowrap' }}>{fmt(a.fecha_hora)}</p>
                    </div>
                    <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, paddingLeft: '24px' }}>
                      <span style={{ fontWeight: 600 }}>Motivo:</span> {a.observaciones}
                    </p>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>

      {/* Modal de lista */}
      {modal && (
        <ModalListaActividades
          titulo={modal.titulo}
          Icon={modal.Icon}
          accent={modal.accent}
          bg={modal.bg}
          items={modal.items}
          modo={modal.modo}
          onClose={() => setModal(null)}
          onIrActividad={irActividad}
        />
      )}
    </div>
  )
}
