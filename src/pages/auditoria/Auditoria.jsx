// src/pages/auditoria/Auditoria.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Shield, ArrowRight, X 
} from 'lucide-react'
import { auditoriaService } from '../../services/auditoriaService'
import useAuthStore from '../../store/authStore'

// ── Estilos compartidos ─────────────────────────────────────
const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

// ── Helpers ────────────────────────────────────────────────
const ACCION_ESTILO = {
  crear:    'bg-health-100 text-health-600 border-health-600/20',
  editar:   'bg-info-100 text-info-600 border-info-600/20',
  archivar: 'bg-amber-100 text-amber-600 border-amber-600/20',
  activar:  'bg-purple-100 text-purple-600 border-purple-600/20',
  eliminar: 'bg-danger-100 text-danger-600 border-danger-600/20',
}

const ACCION_ICONO = {
  crear: '➕', editar: '✏️', archivar: '📁', activar: '✅', eliminar: '🗑️',
}

function BadgeAccion({ accion }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border ${ACCION_ESTILO[accion] || 'bg-warm-100 text-warm-700'}`}>
      <span>{ACCION_ICONO[accion] || '•'}</span> {accion}
    </span>
  )
}

function fmtFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Constantes para Modal ───────────────────────────────────
const CAMPOS_OCULTOS = [
  'id', 'pk', 'password', 'password_hash', 'last_login', 'ultimo_login',
  'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions',
  'created_at', 'updated_at', 'fecha_activacion', 'fecha_asignacion',
  'fecha_autorizacion', 'creado_por', 'prescrito_por', 'registrado_por',
  'actualizado_por', 'confirmado_por', 'revisado_por', 'autorizado_por',
  'asignado_por',
]

const VALORES = {
  estado: {
    activo: 'Activo', inactivo: 'Inactivo', hospitalizado: 'Hospitalizado',
    dado_de_alta: 'Dado de alta', archivado: 'Archivado', vigente: 'Vigente',
    pendiente: 'Pendiente', programada: 'Programada', realizada: 'Realizada',
    cancelada: 'Cancelada', finalizado: 'Finalizado',
  },
  rol: { administrador: 'Administrador', cuidador: 'Cuidador' },
  tipo_comida: { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena' },
  tipo_consulta: { control_rutinario: 'Control rutinario', urgencia: 'Urgencia', seguimiento: 'Seguimiento' },
}

const ETIQUETAS = {
  nombre: 'Nombre', apellido: 'Apellido', dni: 'C.I.', email: 'Correo',
  rol: 'Rol', estado: 'Estado', telefono: 'Teléfono', fecha_nacimiento: 'Fecha de nacimiento',
  fecha_ingreso: 'Fecha de ingreso', tipo: 'Tipo', responsable: 'Responsable',
  fecha_hora: 'Fecha y hora', observaciones: 'Observaciones', descripcion: 'Descripción',
}

const ENTIDADES = {
  usuarios: 'Usuario', residentes: 'Residente', medicamentos: 'Medicamento',
  stock_medicamentos: 'Lote de stock', prescripciones: 'Prescripción',
  planes: 'Plan nutricional', planes_nutricionales: 'Plan nutricional',
  plantillas_nutricionales: 'Plantilla nutricional', alimentos: 'Alimento',
  restricciones: 'Restricción', alimento_restricciones: 'Vínculo alimento-restricción',
  residente_restricciones: 'Restricción de residente', comidas_diarias: 'Comida',
  actividades: 'Actividad', actividad_residentes: 'Participante de actividad',
  visitantes: 'Visitante', autorizaciones_visitantes: 'Autorización de visitante',
  registros_visita: 'Registro de visita', contactos_emergencia: 'Contacto de emergencia',
  historial_medico: 'Historial médico', observaciones_diarias: 'Observación diaria',
  turnos_medicos: 'Turno médico',
}

// Para cada entidad: qué campo(s) del snapshot usar como nombre legible.
// Si la entidad no está aquí (pivotes, sin texto), se hace fallback a "#id".
const ENTIDAD_NOMBRE_CAMPOS = {
  usuarios:                  ['nombre', 'apellido'],
  residentes:                ['nombre', 'apellido'],
  medicamentos:              ['nombre_comercial'],
  actividades:               ['nombre'],
  alimentos:                 ['nombre'],
  restricciones:             ['nombre'],
  plantillas_nutricionales:  ['nombre'],
  visitantes:                ['nombre'],
  contactos_emergencia:      ['nombre'],
  turnos_medicos:            ['tipo_consulta'],
}

function etiqueta(k) {
  return ETIQUETAS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function nombreEntidad(e) {
  return ENTIDADES[e] || (e ? e.charAt(0).toUpperCase() + e.slice(1) : '—')
}

// Extrae un nombre representativo del snapshot (datos_nuevos preferido,
// datos_anteriores como respaldo en ediciones/eliminaciones).
function nombreRepresentativo(entrada) {
  const campos = ENTIDAD_NOMBRE_CAMPOS[entrada.entidad]
  if (!campos) return null   // entidad sin texto claro → usaremos #id

  const fuente =
    (entrada.datos_nuevos && Object.keys(entrada.datos_nuevos).length ? entrada.datos_nuevos : null) ||
    (entrada.datos_anteriores && Object.keys(entrada.datos_anteriores).length ? entrada.datos_anteriores : null)

  if (!fuente) return null

  const partes = campos
    .map(c => fuente[c])
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')

  if (!partes.length) return null

  // Si el campo tiene un valor "bonito" en VALORES (ej. tipo_consulta), traducirlo
  let texto = partes.map((v, i) => {
    const k = campos[i]
    return (VALORES[k] && VALORES[k][String(v)]) ? VALORES[k][String(v)] : String(v)
  }).join(' ')

  return texto.trim() || null
}

// Devuelve el JSX/etiqueta para mostrar la entidad: nombre si existe, si no "#id"
function descripcionEntidad(entrada) {
  const nombre = nombreRepresentativo(entrada)
  const tipo = nombreEntidad(entrada.entidad)
  if (nombre) return { tipo, detalle: nombre, esNombre: true }
  return { tipo, detalle: `#${entrada.entidad_id}`, esNombre: false }
}

function formatVal(k, v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  if (typeof v === 'object') return JSON.stringify(v)

  const s = String(v)
  if (VALORES[k] && VALORES[k][s]) return VALORES[k][s]

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s)
    if (!isNaN(d)) return d.toLocaleString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }
  return s
}

// ── Modal Detalle ───────────────────────────────────────────
function ModalDetalle({ entrada, onClose }) {
  const antes = entrada.datos_anteriores || {}
  const despues = entrada.datos_nuevos || {}
  const esCreacion = !antes || Object.keys(antes).length === 0

  let claves = Array.from(new Set([
    ...Object.keys(antes),
    ...Object.keys(despues),
  ])).filter(k => !CAMPOS_OCULTOS.includes(k))

  if (!esCreacion) {
    claves = claves.filter(k => 
      JSON.stringify(antes[k]) !== JSON.stringify(despues[k])
    )
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 bg-warm-50 rounded-t-[22px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Detalle de Auditoría #{entrada.id}</h2>
            <p className="text-sm text-warm-600">{fmtFecha(entrada.fecha_hora)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-85px)]">
          <div className="grid grid-cols-2 gap-4 bg-warm-50 p-5 rounded-2xl">
            <div><span className="text-xs font-semibold text-warm-700 block mb-1">Usuario</span><p className="font-semibold text-warm-800">{entrada.usuario_nombre}</p></div>
            <div><span className="text-xs font-semibold text-warm-700 block mb-1">Acción</span><BadgeAccion accion={entrada.accion} /></div>
            <div><span className="text-xs font-semibold text-warm-700 block mb-1">Entidad</span><p className="font-semibold text-warm-800">{(() => { const d = descripcionEntidad(entrada); return <>{d.tipo} <span className={d.esNombre ? 'text-warm-600' : 'text-warm-400'}>{d.esNombre ? `«${d.detalle}»` : d.detalle}</span></> })()}</p></div>
            <div><span className="text-xs font-semibold text-warm-700 block mb-1">IP</span><p className="font-semibold text-warm-800">{entrada.ip || '—'}</p></div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-warm-800 mb-4">
              {esCreacion ? 'Datos registrados' : 'Campos modificados'}
            </h3>
            {claves.length === 0 ? (
              <p className="text-center py-10 text-warm-500 bg-warm-50 rounded-2xl">No hay campos para mostrar</p>
            ) : (
              <div className="space-y-3">
                {claves.map(k => {
                  const va = antes[k]
                  const vd = despues[k]
                  const cambio = !esCreacion && JSON.stringify(va) !== JSON.stringify(vd)

                  return (
                    <div key={k} className={`rounded-2xl p-4 border ${cambio ? 'bg-amber-50 border-amber-200' : 'bg-white border-cream-300'}`}>
                      <p className="text-xs font-semibold text-warm-700 mb-2.5">{etiqueta(k)}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        {!esCreacion && va !== undefined && (
                          <span className="line-through text-danger-600 bg-danger-50 px-3 py-1.5 rounded-xl text-sm">{formatVal(k, va)}</span>
                        )}
                        {!esCreacion && <ArrowRight size={16} className="text-warm-400" />}
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-medium ${cambio ? 'bg-health-100 text-health-700' : 'bg-warm-100 text-warm-800'}`}>
                          {formatVal(k, vd)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Auditoria() {
  const esAdmin = useAuthStore(s => s.usuario)?.rol === 'administrador'

  const [filtros, setFiltros] = useState({ entidad: '', accion: '', fecha_desde: '', fecha_hasta: '' })
  const [page, setPage] = useState(1)
  const [detalle, setDetalle] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-log', filtros, page],
    queryFn: () => auditoriaService.listarLog({ ...limpiar(filtros), page }),
    enabled: esAdmin,
    keepPreviousData: true,
  })

  if (!esAdmin) {
    return <div className="text-center py-20 text-gray-400">Solo administradores pueden acceder.</div>
  }

  const entradas = data?.results || []
  const totalPaginas = data?.pages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ animation: 'fadeUp 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-warm-100 flex items-center justify-center">
            <Shield size={24} className="text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-warm-800 tracking-tight">Auditoría</h1>
            <p className="text-warm-600 text-sm">{data?.total ?? 0} registro{(data?.total ?? 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400 flex gap-3 flex-wrap" style={{ animation: 'fadeUp 0.45s ease both' }}>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-semibold text-warm-700 mb-1.5">Entidad</label>
          <select value={filtros.entidad} onChange={e => { setFiltros({ ...filtros, entidad: e.target.value }); setPage(1) }} className={`${inputCls} cursor-pointer`}>
            <option value="">Todas las entidades</option>
            <optgroup label="Personas">
              <option value="usuarios">Usuarios</option>
              <option value="residentes">Residentes</option>
              <option value="visitantes">Visitantes</option>
            </optgroup>
            <optgroup label="Residentes">
              <option value="contactos_emergencia">Contactos de emergencia</option>
              <option value="historial_medico">Historial médico</option>
              <option value="observaciones_diarias">Observaciones diarias</option>
              <option value="turnos_medicos">Turnos médicos</option>
            </optgroup>
            <optgroup label="Medicamentos">
              <option value="medicamentos">Medicamentos</option>
              <option value="stock_medicamentos">Lotes de stock</option>
              <option value="prescripciones">Prescripciones</option>
              <option value="administraciones_medicamento">Administraciones</option>
            </optgroup>
            <optgroup label="Nutrición">
              <option value="alimentos">Alimentos</option>
              <option value="restricciones">Restricciones</option>
              <option value="alimento_restricciones">Vínculos alimento-restricción</option>
              <option value="residente_restricciones">Restricciones de residente</option>
              <option value="plantillas_nutricionales">Plantillas nutricionales</option>
              <option value="planes_nutricionales">Planes nutricionales</option>
              <option value="comidas_diarias">Comidas</option>
            </optgroup>
            <optgroup label="Actividades">
              <option value="actividades">Actividades</option>
              <option value="actividad_residentes">Participantes de actividad</option>
            </optgroup>
            <optgroup label="Visitas">
              <option value="autorizaciones_visitantes">Autorizaciones de visitante</option>
              <option value="registros_visita">Registros de visita</option>
            </optgroup>
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-semibold text-warm-700 mb-1.5">Acción</label>
          <select value={filtros.accion} onChange={e => { setFiltros({ ...filtros, accion: e.target.value }); setPage(1) }} className={`${inputCls} cursor-pointer`}>
            <option value="">Todas las acciones</option>
            <option value="crear">Crear</option>
            <option value="editar">Editar</option>
            <option value="archivar">Archivar</option>
            <option value="activar">Activar</option>
            <option value="eliminar">Eliminar</option>
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-semibold text-warm-700 mb-1.5">Desde</label>
          <input type="date" value={filtros.fecha_desde} onChange={e => { setFiltros({ ...filtros, fecha_desde: e.target.value }); setPage(1) }} className={inputCls} />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-semibold text-warm-700 mb-1.5">Hasta</label>
          <input type="date" value={filtros.fecha_hasta} onChange={e => { setFiltros({ ...filtros, fecha_hasta: e.target.value }); setPage(1) }} className={inputCls} />
        </div>

        {(filtros.entidad || filtros.accion || filtros.fecha_desde || filtros.fecha_hasta) && (
          <button onClick={() => { setFiltros({ entidad: '', accion: '', fecha_desde: '', fecha_hasta: '' }); setPage(1) }} className="self-end text-warm-600 hover:text-warm-800 font-semibold">Limpiar</button>
        )}
      </div>

      {/* TABLA escritorio */}
      <div className="aud-tabla bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden" style={{ animation: 'fadeUp 0.5s ease both' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-danger-600">Error al cargar auditoría</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-warm-50 border-b border-cream-400">
                {['Fecha/Hora', 'Usuario', 'Acción', 'Entidad', 'IP', 'Detalle'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-warm-400">No hay registros</td></tr>
              ) : (
                entradas.map(e => (
                  <tr key={e.id} className="hover:bg-warm-50 transition border-b border-warm-50 last:border-none">
                    <td className="px-6 py-4 text-sm text-warm-600">{fmtFecha(e.fecha_hora)}</td>
                    <td className="px-6 py-4 font-medium text-warm-800">{e.usuario_nombre}</td>
                    <td className="px-6 py-4"><BadgeAccion accion={e.accion} /></td>
                    <td className="px-6 py-4 text-sm text-warm-600">{(() => { const d = descripcionEntidad(e); return <>{d.tipo} <span className={d.esNombre ? 'text-warm-700 font-medium' : 'text-warm-400'}>{d.esNombre ? `«${d.detalle}»` : d.detalle}</span></> })()}</td>
                    <td className="px-6 py-4 text-sm text-warm-500">{e.ip || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setDetalle(e)} className="text-warm-600 hover:text-warm-800 font-semibold inline-flex items-center gap-1">
                        Ver detalle <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-cream-400">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className={btnSecundario}>← Anterior</button>
            <span className="text-sm text-warm-600">Página {page} de {totalPaginas}</span>
            <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page >= totalPaginas} className={btnSecundario}>Siguiente →</button>
          </div>
        )}
      </div>

      {/* CARDS MÓVIL */}
      <div className="aud-cards hidden flex-col gap-3">
        {entradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-400 p-8 text-center text-warm-400">No hay registros</div>
        ) : (
          entradas.map(e => (
            <div key={e.id} className="bg-white rounded-2xl p-5 shadow-sm border border-cream-400">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-warm-800">{e.usuario_nombre}</p>
                  <p className="text-xs text-warm-500">{fmtFecha(e.fecha_hora)}</p>
                </div>
                <BadgeAccion accion={e.accion} />
              </div>
              <p className="text-warm-600 mb-4">{(() => { const d = descripcionEntidad(e); return <>{d.tipo} <span className={d.esNombre ? 'text-warm-700 font-medium' : 'text-warm-400'}>{d.esNombre ? `«${d.detalle}»` : d.detalle}</span></> })()}</p>
              <button onClick={() => setDetalle(e)} className="w-full text-warm-600 hover:text-warm-800 font-semibold flex items-center justify-center gap-2 py-2 border border-cream-400 rounded-xl">
                Ver detalle completo <ArrowRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {detalle && <ModalDetalle entrada={detalle} onClose={() => setDetalle(null)} />}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        
        @media (max-width: 767px) {
          .aud-tabla { display: none !important; }
          .aud-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

function limpiar(obj) {
  const out = {}
  Object.entries(obj).forEach(([k, v]) => { if (v) out[k] = v })
  return out
}