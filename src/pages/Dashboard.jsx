import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UserRound, BedDouble, CheckCircle2, CalendarDays,
  Pill, Users, AlertTriangle, XCircle,
  TrendingUp, Clock, Activity, RefreshCw,
  Salad, UtensilsCrossed, ClipboardCheck, Boxes, X, ShieldX,
  DoorOpen, ShieldCheck, LogIn
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import api from '../services/api'
import DashboardActividades from './DashboardActividades'

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

/* ── Tarjeta métrica grande (opcionalmente clicable) ────────── */
function TarjetaMetrica({ titulo, valor, icono: Icon, accent, bg, iconColor, subtitulo, delay = 0, onClick }) {
  const clicable = typeof onClick === 'function'
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white', borderRadius: '20px',
        padding: '24px', border: `1px solid ${P.cream400}`,
        boxShadow: '0 2px 16px rgba(124,61,40,0.07)',
        animation: `fadeUp 0.5s ease ${delay}ms both`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative', overflow: 'hidden',
        cursor: clicable ? 'pointer' : 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(124,61,40,0.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(124,61,40,0.07)' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: accent, borderRadius: '20px 20px 0 0' }} />
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
          {clicable && (
            <p style={{ fontSize: '11px', color: accent, margin: '6px 0 0', fontWeight: 600 }}>Ver lista →</p>
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

/* ── Modal de lista (métricas de medicamentos y nutrición) ─── */
function ModalLista({ titulo, icono: Icon, accent, items, columnas, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(60,26,10,0.45)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, padding: '16px',
      animation: 'fadeIn 0.18s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '22px', width: '100%', maxWidth: '560px',
        maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '20px',
          borderBottom: `1px solid ${P.cream400}`, position: 'sticky', top: 0, background: P.warm50, zIndex: 1,
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={accent} />
          </div>
          <h2 style={{ flex: 1, fontSize: '16px', fontWeight: 800, color: P.warm800, margin: 0 }}>{titulo}</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {!items?.length ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '14px', padding: '32px 0' }}>Sin registros</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  border: `1px solid ${P.cream400}`, borderRadius: '12px', padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: P.warm800, margin: 0, textTransform: columnas[0].cap ? 'capitalize' : 'none' }}>{item[columnas[0].key]}</p>
                    {columnas[1] && <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0', textTransform: columnas[1].cap ? 'capitalize' : 'none' }}>{columnas[1].label}: {item[columnas[1].key]}</p>}
                  </div>
                  {columnas[2] && (
                    <span style={{ fontSize: '12px', color: accent, fontWeight: 700, whiteSpace: 'nowrap', textTransform: columnas[2].cap ? 'capitalize' : 'none' }}>
                      {item[columnas[2].key]}
                    </span>
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

/* ── Encabezado de sección ──────────────────────────────────── */
function SeccionHeader({ icono: Icon, titulo, subtitulo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: P.warm100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={P.warm600} />
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: P.warm800, margin: 0 }}>{titulo}</p>
        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{subtitulo}</p>
      </div>
    </div>
  )
}

/* ── Mini-tarjeta de gráfico ────────────────────────────────── */
function CardGrafico({ icono: Icon, titulo, subtitulo, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: '20px', padding: '22px 24px',
      boxShadow: '0 2px 16px rgba(124,61,40,0.07)', border: `1px solid ${P.cream400}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: P.warm100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={P.warm500} />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: 0 }}>{titulo}</p>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{subtitulo}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ── Dona con leyenda ───────────────────────────────────────── */
function DonaConLeyenda({ data, centro, centroLabel }) {
  return (
    <>
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '140px' }}>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={64}
              paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
          <p style={{ fontSize: '24px', fontWeight: 900, color: P.warm800, margin: 0, lineHeight: 1 }}>{centro}</p>
          <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '2px 0 0' }}>{centroLabel}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.fill }} />
              <span style={{ fontSize: '12px', color: P.warm800 }}>{d.name}</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: d.fill }}>{d.value}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ── Barras simples ─────────────────────────────────────────── */
function BarrasSimples({ data, barSize = 56 }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} barSize={barSize} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={P.cream400} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: P.warm600, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<WarmTooltip />} cursor={{ fill: P.warm50, radius: 8 }} />
        <Bar dataKey="v" radius={[10, 10, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const [modal, setModal] = useState(null)

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: nutricion } = useQuery({
    queryKey: ['nutricion-resumen-dashboard'],
    queryFn: () => api.get('/nutricion/resumen-dashboard/').then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: medicamentos } = useQuery({
    queryKey: ['medicamentos-resumen-dashboard'],
    queryFn: () => api.get('/medicamentos/resumen-dashboard/').then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: visitas } = useQuery({
    queryKey: ['visitas-resumen-dashboard'],
    queryFn: () => api.get('/visitas/resumen-dashboard/').then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: residentes } = useQuery({
    queryKey: ['residentes-resumen-dashboard'],
    queryFn: () => api.get('/residentes/resumen-dashboard/').then(r => r.data),
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

  const { resumen_residentes: rr } = data

  // ── Datos Nutrición ──
  const nutBarData = nutricion ? [
    { name: 'Pendientes', v: nutricion.planes_pendientes ?? 0,         color: '#D4742A' },
    { name: 'Aprobados',  v: nutricion.planes_aprobados_vigentes ?? 0, color: '#4A7C59' },
  ] : []
  const nutDonaData = nutricion ? [
    { name: 'Con plan', value: nutricion.residentes_con_plan_count ?? 0, fill: '#4A7C59' },
    { name: 'Sin plan', value: nutricion.residentes_sin_plan_count ?? 0, fill: '#B94040' },
  ] : []

  // ── Datos Medicamentos ──
  const medBarData = medicamentos ? [
    { name: 'Administradas', v: medicamentos.administradas_hoy ?? 0, color: '#4A7C59' },
    { name: 'Omitidas',      v: medicamentos.omitidas_hoy ?? 0,      color: '#B94040' },
  ] : []
  const medStockData = medicamentos ? [
    { name: 'OK',         value: medicamentos.lotes_ok ?? 0,    fill: '#4A7C59' },
    { name: 'Stock bajo', value: medicamentos.stock_bajo ?? 0,  fill: '#B94040' },
    { name: 'Por vencer', value: medicamentos.por_vencer ?? 0,  fill: '#D4742A' },
  ] : []

  // ── Datos Visitas ──
  const visBarData = (visitas?.visitas_ultimos_7_dias || []).map(d => {
    const nombre = new Date(d.fecha + 'T00:00:00')
      .toLocaleDateString('es-BO', { weekday: 'short' })
      .replace('.', '')
    return { name: nombre, v: d.total, color: '#5A7FA8' }
  })
  const visDonaData = visitas ? [
    { name: 'Activas',     value: visitas.autorizaciones_activas ?? 0,     fill: '#4A7C59' },
    { name: 'Suspendidas', value: visitas.autorizaciones_suspendidas ?? 0, fill: '#B94040' },
  ] : []

  // ── Datos Residentes ──
  const resDonaData = residentes ? [
    { name: 'Activos',        value: residentes.activos_count ?? 0,        fill: '#E8A96A' },
    { name: 'Hospitalizados', value: residentes.hospitalizados_count ?? 0, fill: '#B94040' },
    { name: 'Dados de alta',  value: residentes.dados_de_alta_count ?? 0,  fill: '#7C3D28' },
  ] : []
  const resBarData = residentes ? [
    { name: 'Activos', v: residentes.activos_count ?? 0,        color: '#5A7FA8' },
    { name: 'Hosp.',   v: residentes.hospitalizados_count ?? 0, color: '#7B5EA7' },
    { name: 'Alta',    v: residentes.dados_de_alta_count ?? 0,  color: '#3A8C6E' },
  ] : []

  const horaActualiz = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '—'

  // ── Modales Nutrición ──
  const abrirSinPlan = () => setModal({
    titulo: 'Residentes sin plan vigente', icono: Salad, accent: P.danger600,
    items: nutricion?.residentes_sin_plan || [],
    columnas: [{ key: 'nombre' }],
  })
  const abrirPendientes = () => setModal({
    titulo: 'Planes pendientes de aprobación', icono: ClipboardCheck, accent: P.alert600,
    items: nutricion?.planes_pendientes_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'tipo', label: 'Dieta', cap: true }, { key: 'creado_por' }],
  })
  const abrirAprobados = () => setModal({
    titulo: 'Planes aprobados vigentes', icono: CheckCircle2, accent: P.health600,
    items: nutricion?.planes_aprobados_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'tipo', label: 'Dieta', cap: true }, { key: 'fecha' }],
  })
  const abrirAlimentos = () => setModal({
    titulo: 'Alimentos activos', icono: UtensilsCrossed, accent: P.info600,
    items: nutricion?.alimentos_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'grupo', label: 'Grupo' }],
  })
  const abrirRestricciones = () => setModal({
    titulo: 'Restricciones activas', icono: ShieldX, accent: P.warm600,
    items: nutricion?.restricciones_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'severidad', label: 'Severidad', cap: true }],
  })

  // ── Modales Medicamentos ──
  const abrirAdministradas = () => setModal({
    titulo: 'Tomas administradas hoy', icono: ClipboardCheck, accent: P.health600,
    items: medicamentos?.administradas_lista || [],
    columnas: [{ key: 'medicamento' }, { key: 'residente', label: 'Residente' }, { key: 'hora' }],
  })
  const abrirOmitidas = () => setModal({
    titulo: 'Tomas omitidas hoy', icono: Pill, accent: P.danger600,
    items: medicamentos?.omitidas_lista || [],
    columnas: [{ key: 'medicamento' }, { key: 'residente', label: 'Residente' }, { key: 'hora' }],
  })
  const abrirStockBajo = () => setModal({
    titulo: 'Lotes con stock bajo', icono: AlertTriangle, accent: P.danger600,
    items: medicamentos?.stock_bajo_lista || [],
    columnas: [{ key: 'medicamento' }, { key: 'lote', label: 'Lote' }, { key: 'cantidad' }],
  })
  const abrirPorVencer = () => setModal({
    titulo: 'Lotes por vencer', icono: Clock, accent: P.alert600,
    items: medicamentos?.por_vencer_lista || [],
    columnas: [{ key: 'medicamento' }, { key: 'lote', label: 'Lote' }, { key: 'vence' }],
  })
  const abrirCatalogo = () => setModal({
    titulo: 'Medicamentos en catálogo', icono: Boxes, accent: P.info600,
    items: medicamentos?.medicamentos_activos_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'forma', label: 'Forma' }],
  })

  // ── Modales Visitas ──
  const abrirVisitasHoy = () => setModal({
    titulo: 'Visitas registradas hoy', icono: CalendarDays, accent: P.info600,
    items: visitas?.visitas_hoy_lista || [],
    columnas: [{ key: 'visitante' }, { key: 'residente', label: 'Residente' }, { key: 'hora' }],
  })
  const abrirVisitantes = () => setModal({
    titulo: 'Visitantes registrados', icono: Users, accent: P.warm600,
    items: visitas?.visitantes_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'dni', label: 'C.I.' }, { key: 'telefono' }],
  })
  const abrirConAutorizacion = () => setModal({
    titulo: 'Visitantes con autorización activa', icono: ShieldCheck, accent: P.health600,
    items: visitas?.visitantes_con_autorizacion_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'dni', label: 'C.I.' }],
  })
  const abrirSuspendidas = () => setModal({
    titulo: 'Autorizaciones suspendidas', icono: XCircle, accent: P.alert600,
    items: visitas?.autorizaciones_suspendidas_lista || [],
    columnas: [{ key: 'visitante' }, { key: 'residente', label: 'Residente' }, { key: 'relacion', cap: true }],
  })

  // ── Modales Residentes ──
  const abrirActivos = () => setModal({
    titulo: 'Residentes activos', icono: UserRound, accent: P.warm600,
    items: residentes?.activos_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'dni', label: 'C.I.' }, { key: 'ingreso' }],
  })
  const abrirHospitalizados = () => setModal({
    titulo: 'Residentes hospitalizados', icono: BedDouble, accent: P.danger600,
    items: residentes?.hospitalizados_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'dni', label: 'C.I.' }],
  })
  const abrirDadosAlta = () => setModal({
    titulo: 'Residentes dados de alta', icono: CheckCircle2, accent: P.health600,
    items: residentes?.dados_de_alta_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'dni', label: 'C.I.' }],
  })
  const abrirIngresosMes = () => setModal({
    titulo: 'Ingresos del mes', icono: CalendarDays, accent: P.info600,
    items: residentes?.ingresos_mes_lista || [],
    columnas: [{ key: 'nombre' }, { key: 'dni', label: 'C.I.' }, { key: 'ingreso' }],
  })

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
        
      </div>

      {/* ── Sección Residentes ── */}
      {residentes && (
        <div style={{ animation: 'fadeUp 0.5s ease 0.1s both' }}>
          <SeccionHeader icono={UserRound} titulo="Residentes" subtitulo="Estado general y movimiento" />

          {/* Métricas clicables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: '16px', marginBottom: '16px' }}>
            <TarjetaMetrica titulo="Residentes activos" valor={residentes.activos_count}
              icono={UserRound} accent={P.warm500} bg={P.warm100} iconColor={P.warm600}
              subtitulo="En el asilo actualmente" delay={0} onClick={abrirActivos} />
            <TarjetaMetrica titulo="Hospitalizados" valor={residentes.hospitalizados_count}
              icono={BedDouble} accent={P.alert600} bg={P.alert100} iconColor={P.alert600}
              subtitulo="Fuera temporalmente" delay={80} onClick={abrirHospitalizados} />
            <TarjetaMetrica titulo="Dados de alta" valor={residentes.dados_de_alta_count}
              icono={CheckCircle2} accent={P.health600} bg={P.health100} iconColor={P.health600}
              subtitulo="Egresados del sistema" delay={160} onClick={abrirDadosAlta} />
            <TarjetaMetrica titulo="Ingresos del mes" valor={residentes.ingresos_mes_count}
              icono={CalendarDays} accent={P.info600} bg={P.info100} iconColor={P.info600}
              subtitulo="Nuevos este mes" delay={240} onClick={abrirIngresosMes} />
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="sec-charts">
            <CardGrafico icono={TrendingUp} titulo="Residentes por estado" subtitulo="Comparativa actual">
              <BarrasSimples data={resBarData} />
            </CardGrafico>
            <CardGrafico icono={Activity} titulo="Distribución" subtitulo="Residentes por estado">
              <DonaConLeyenda data={resDonaData} centro={residentes.total ?? 0} centroLabel="total" />
            </CardGrafico>
          </div>
        </div>
      )}

      {/* ── Sección Actividades ── */}
      <DashboardActividades />

      {/* ── Sección Nutrición ── */}
      {nutricion && (
        <div style={{ animation: 'fadeUp 0.5s ease 0.28s both' }}>
          <SeccionHeader icono={Salad} titulo="Nutrición" subtitulo="Planes, alimentos y restricciones" />

          {/* Tarjeta destacada: residentes sin plan */}
          <div style={{
            background: nutricion.residentes_sin_plan_count > 0
              ? `linear-gradient(135deg, ${P.danger100}, #fff5f5)`
              : `linear-gradient(135deg, ${P.health100}, #f0fff4)`,
            borderRadius: '18px', padding: '20px 22px', marginBottom: '16px',
            border: `1px solid ${nutricion.residentes_sin_plan_count > 0 ? P.danger600 : P.health600}25`,
            cursor: nutricion.residentes_sin_plan_count > 0 ? 'pointer' : 'default',
          }}
            onClick={nutricion.residentes_sin_plan_count > 0 ? abrirSinPlan : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '13px',
                background: nutricion.residentes_sin_plan_count > 0 ? P.danger600 : P.health600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {nutricion.residentes_sin_plan_count > 0
                  ? <AlertTriangle size={22} color="white" />
                  : <CheckCircle2 size={22} color="white" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: P.warm800, margin: 0 }}>
                  {nutricion.residentes_sin_plan_count > 0
                    ? `${nutricion.residentes_sin_plan_count} residente(s) sin plan vigente`
                    : 'Todos los residentes activos tienen plan vigente'}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0' }}>
                  {nutricion.residentes_con_plan_count} con plan · {nutricion.residentes_activos_count} activos en total
                  {nutricion.residentes_sin_plan_count > 0 && ' · toca para ver la lista'}
                </p>
              </div>
            </div>
          </div>

          {/* Métricas clicables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px', marginBottom: '16px' }}>
            <TarjetaMetrica titulo="Planes pendientes" valor={nutricion.planes_pendientes}
              icono={ClipboardCheck} accent={P.alert600} bg={P.alert100} iconColor={P.alert600}
              subtitulo="Esperan aprobación" delay={300} onClick={abrirPendientes} />
            <TarjetaMetrica titulo="Planes aprobados" valor={nutricion.planes_aprobados_vigentes}
              icono={CheckCircle2} accent={P.health600} bg={P.health100} iconColor={P.health600}
              subtitulo="Disponibles hoy/futuro" delay={360} onClick={abrirAprobados} />
            <TarjetaMetrica titulo="Alimentos activos" valor={nutricion.alimentos_activos}
              icono={UtensilsCrossed} accent={P.info600} bg={P.info100} iconColor={P.info600}
              subtitulo="En catálogo" delay={420} onClick={abrirAlimentos} />
            <TarjetaMetrica titulo="Restricciones" valor={nutricion.restricciones_activas}
              icono={ShieldX} accent={P.warm500} bg={P.warm100} iconColor={P.warm600}
              subtitulo="Activas en catálogo" delay={480} onClick={abrirRestricciones} />
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="sec-charts">
            <CardGrafico icono={ClipboardCheck} titulo="Planes nutricionales" subtitulo="Pendientes vs aprobados">
              <BarrasSimples data={nutBarData} />
            </CardGrafico>
            <CardGrafico icono={Users} titulo="Cobertura de planes" subtitulo="Residentes activos">
              <DonaConLeyenda data={nutDonaData} centro={nutricion.residentes_activos_count ?? 0} centroLabel="activos" />
            </CardGrafico>
          </div>
        </div>
      )}

      {/* ── Sección Medicamentos ── */}
      {medicamentos && (
        <div style={{ animation: 'fadeUp 0.5s ease 0.34s both' }}>
          <SeccionHeader icono={Pill} titulo="Medicamentos" subtitulo="Tomas de hoy y estado del stock" />

          {/* Métricas clicables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px', marginBottom: '16px' }}>
            <TarjetaMetrica titulo="Administradas hoy" valor={medicamentos.administradas_hoy}
              icono={ClipboardCheck} accent={P.health600} bg={P.health100} iconColor={P.health600}
              subtitulo={`${medicamentos.prescripciones_activas} prescripciones activas`} delay={360}
              onClick={abrirAdministradas} />
            <TarjetaMetrica titulo="Omitidas hoy" valor={medicamentos.omitidas_hoy}
              icono={Pill} accent={P.danger600} bg={P.danger100} iconColor={P.danger600}
              subtitulo="Tomas no administradas" delay={400} onClick={abrirOmitidas} />
            <TarjetaMetrica titulo="Stock bajo" valor={medicamentos.stock_bajo}
              icono={AlertTriangle} accent={P.alert600} bg={P.alert100} iconColor={P.alert600}
              subtitulo="Lotes bajo el umbral" delay={440} onClick={abrirStockBajo} />
            <TarjetaMetrica titulo="Por vencer" valor={medicamentos.por_vencer}
              icono={Clock} accent={P.alert600} bg={P.alert100} iconColor={P.alert600}
              subtitulo="Vencen en ≤30 días" delay={480} onClick={abrirPorVencer} />
            <TarjetaMetrica titulo="En catálogo" valor={medicamentos.medicamentos_activos}
              icono={Boxes} accent={P.info600} bg={P.info100} iconColor={P.info600}
              subtitulo="Medicamentos activos" delay={520} onClick={abrirCatalogo} />
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="sec-charts">
            <CardGrafico icono={ClipboardCheck} titulo="Tomas de hoy" subtitulo="Administradas vs omitidas">
              <BarrasSimples data={medBarData} />
            </CardGrafico>
            <CardGrafico icono={Boxes} titulo="Estado del stock" subtitulo="Lotes por condición">
              <DonaConLeyenda data={medStockData} centro={medicamentos.total_lotes ?? 0} centroLabel="lotes" />
            </CardGrafico>
          </div>
        </div>
      )}

      {/* ── Sección Visitas ── */}
      {visitas && (
        <div style={{ animation: 'fadeUp 0.5s ease 0.40s both' }}>
          <SeccionHeader icono={DoorOpen} titulo="Visitas" subtitulo="Movimiento del día y catálogo de visitantes" />

          {/* Tarjeta destacada: visitas en curso ahora mismo */}
          <div style={{
            background: visitas.visitas_en_curso_count > 0
              ? `linear-gradient(135deg, ${P.info100}, #f0f6fc)`
              : `linear-gradient(135deg, ${P.health100}, #f0fff4)`,
            borderRadius: '18px', padding: '20px 22px', marginBottom: '16px',
            border: `1px solid ${visitas.visitas_en_curso_count > 0 ? P.info600 : P.health600}25`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: visitas.visitas_en_curso_count > 0 ? '14px' : 0 }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '13px',
                background: visitas.visitas_en_curso_count > 0 ? P.info600 : P.health600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {visitas.visitas_en_curso_count > 0
                  ? <LogIn size={22} color="white" />
                  : <CheckCircle2 size={22} color="white" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: P.warm800, margin: 0 }}>
                  {visitas.visitas_en_curso_count > 0
                    ? `${visitas.visitas_en_curso_count} visita${visitas.visitas_en_curso_count === 1 ? '' : 's'} en curso ahora mismo`
                    : 'Sin visitas activas en este momento'}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0' }}>
                  {visitas.visitas_hoy} registrada{visitas.visitas_hoy === 1 ? '' : 's'} hoy en total
                </p>
              </div>
            </div>

            {/* Chips de visitas en curso */}
            {visitas.visitas_en_curso_count > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {visitas.visitas_en_curso.map(v => {
                  const hora = new Date(v.fecha_hora_entrada).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <span key={v.id} style={{
                      fontSize: '12px', color: P.info600, background: 'white',
                      borderRadius: '20px', padding: '4px 12px',
                      border: `1px solid ${P.info600}25`, fontWeight: 500,
                    }}>
                      {v.visitante} → {v.residente} <span style={{ color: '#9CA3AF' }}>({hora})</span>
                    </span>
                  )
                })}
                {visitas.visitas_en_curso_count > visitas.visitas_en_curso.length && (
                  <span style={{ fontSize: '12px', color: '#9CA3AF', padding: '4px 8px' }}>
                    +{visitas.visitas_en_curso_count - visitas.visitas_en_curso.length} más
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Métricas clicables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px', marginBottom: '16px' }}>
            <TarjetaMetrica titulo="Visitas hoy" valor={visitas.visitas_hoy}
              icono={CalendarDays} accent={P.info600} bg={P.info100} iconColor={P.info600}
              subtitulo="Registradas desde las 00:00" delay={360} onClick={abrirVisitasHoy} />
            <TarjetaMetrica titulo="Visitantes registrados" valor={visitas.visitantes_total}
              icono={Users} accent={P.warm500} bg={P.warm100} iconColor={P.warm600}
              subtitulo="En el catálogo" delay={400} onClick={abrirVisitantes} />
            <TarjetaMetrica titulo="Con autorización activa" valor={visitas.visitantes_con_autorizacion}
              icono={ShieldCheck} accent={P.health600} bg={P.health100} iconColor={P.health600}
              subtitulo="Pueden ingresar al asilo" delay={440} onClick={abrirConAutorizacion} />
            <TarjetaMetrica titulo="Autorizaciones suspendidas" valor={visitas.autorizaciones_suspendidas}
              icono={XCircle} accent={P.alert600} bg={P.alert100} iconColor={P.alert600}
              subtitulo="Bloqueadas temporalmente" delay={480} onClick={abrirSuspendidas} />
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="sec-charts">
            <CardGrafico icono={TrendingUp} titulo="Visitas últimos 7 días" subtitulo="Movimiento por día">
              <BarrasSimples data={visBarData} barSize={28} />
            </CardGrafico>
            <CardGrafico icono={ShieldCheck} titulo="Estado de autorizaciones" subtitulo="Activas vs suspendidas">
              <DonaConLeyenda data={visDonaData} centro={(visitas.autorizaciones_activas ?? 0) + (visitas.autorizaciones_suspendidas ?? 0)} centroLabel="totales" />
            </CardGrafico>
          </div>
        </div>
      )}

      {/* Modal de listas (nutrición + medicamentos) */}
      {modal && (
        <ModalLista {...modal} onClose={() => setModal(null)} />
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalPop { from { opacity:0; transform:translateY(12px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin   { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .dash-central { grid-template-columns: 1fr 1fr !important; }
          .dash-central > :first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .dash-central { grid-template-columns: 1fr !important; }
          .dash-central > :first-child { grid-column: auto; }
          .sec-charts { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}