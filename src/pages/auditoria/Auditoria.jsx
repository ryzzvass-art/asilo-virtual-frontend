// src/pages/auditoria/Auditoria.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditoriaService } from '../../services/auditoriaService'
import useAuthStore from '../../store/authStore'

// ── Helpers ────────────────────────────────────────────────
const ACCION_ESTILO = {
  crear:    'bg-green-100 text-green-700',
  editar:   'bg-blue-100 text-blue-700',
  archivar: 'bg-yellow-100 text-yellow-700',
  activar:  'bg-purple-100 text-purple-700',
  eliminar: 'bg-red-100 text-red-600',
}
const ACCION_ICONO = {
  crear: '➕', editar: '✏️', archivar: '📁', activar: '✅', eliminar: '🗑️',
}

function BadgeAccion({ accion }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1
      ${ACCION_ESTILO[accion] || 'bg-gray-100 text-gray-600'}`}>
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

// ── Modal detalle (qué cambió) ─────────────────────────────
function ModalDetalle({ entrada, onClose }) {
  const antes = entrada.datos_anteriores
  const despues = entrada.datos_nuevos

  const esCreacion = !antes  // en creaciones no hay datos anteriores

  // Reunir claves, ocultando campos internos/sensibles
  let claves = Array.from(new Set([
    ...Object.keys(antes || {}),
    ...Object.keys(despues || {}),
  ])).filter(k => !CAMPOS_OCULTOS.includes(k))

  // En ediciones, mostrar SOLO los campos que cambiaron
  if (!esCreacion) {
    claves = claves.filter(k =>
      JSON.stringify(antes?.[k]) !== JSON.stringify(despues?.[k])
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Detalle de auditoría #{entrada.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmtFecha(entrada.fecha_hora)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-xs text-gray-400 uppercase">Usuario</span><p className="text-gray-700">{entrada.usuario_nombre}</p></div>
            <div><span className="text-xs text-gray-400 uppercase">Acción</span><p><BadgeAccion accion={entrada.accion} /></p></div>
            <div><span className="text-xs text-gray-400 uppercase">Entidad</span><p className="text-gray-700">{nombreEntidad(entrada.entidad)} #{entrada.entidad_id}</p></div>
            <div><span className="text-xs text-gray-400 uppercase">IP</span><p className="text-gray-700">{entrada.ip || '—'}</p></div>
          </div>

          {/* Cambios */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {esCreacion ? 'Datos registrados' : 'Cambios realizados'}
            </h3>
            {claves.length === 0 ? (
              <p className="text-sm text-gray-400">
                {esCreacion ? 'Sin datos' : 'No hubo cambios en campos visibles'}
              </p>
            ) : (
              <div className="space-y-2">
                {claves.map(k => {
                  const va = antes?.[k]
                  const vd = despues?.[k]
                  const cambio = !esCreacion && JSON.stringify(va) !== JSON.stringify(vd)
                  return (
                    <div key={k} className={`rounded-xl p-3 text-sm border
                      ${cambio ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-transparent'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className={`text-xs font-semibold uppercase ${cambio ? 'text-amber-700' : 'text-gray-500'}`}>{etiqueta(k)}</p>
                        {cambio && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">MODIFICADO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!esCreacion && (
                          <span className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 line-through">{formatVal(k, va)}</span>
                        )}
                        {!esCreacion && <span className="text-amber-500 font-bold">→</span>}
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium
                          ${cambio ? 'bg-green-100 text-green-700' : 'bg-white text-gray-700 border border-gray-100'}`}>
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

// Campos que NO se muestran al usuario final (internos, técnicos o sensibles)
const CAMPOS_OCULTOS = [
  'id', 'pk',
  'password', 'password_hash', 'last_login', 'ultimo_login',
  'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions',
  'created_at', 'updated_at', 'fecha_activacion', 'fecha_asignacion', 'fecha_autorizacion',
  'creado_por', 'prescrito_por', 'registrado_por', 'actualizado_por',
  'confirmado_por', 'revisado_por', 'autorizado_por', 'asignado_por',
]

// Cómo mostrar ciertos valores de forma legible
const VALORES = {
  estado: {
    activo: 'Activo', inactivo: 'Inactivo',
    hospitalizado: 'Hospitalizado', dado_de_alta: 'Dado de alta',
    archivado: 'Archivado', vigente: 'Vigente', pendiente: 'Pendiente',
    programada: 'Programada', realizada: 'Realizada', cancelada: 'Cancelada',
    finalizado: 'Finalizado', activa: 'Activa', revocada: 'Revocada',
    suspendido: 'Suspendido', en_curso: 'En curso', finalizada: 'Finalizada',
  },
  rol: { administrador: 'Administrador', cuidador: 'Cuidador' },
  tipo_comida: { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena' },
}

// Traducción de nombres de campo a español legible
const ETIQUETAS = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  dni: 'C.I.',
  email: 'Correo',
  rol: 'Rol',
  estado: 'Estado',
  telefono: 'Teléfono',
  fecha_nacimiento: 'Fecha de nacimiento',
  fecha_ingreso: 'Fecha de ingreso',
  tipo: 'Tipo',
  tipo_consulta: 'Tipo de consulta',
  tipo_dieta: 'Tipo de dieta',
  tipo_comida: 'Tipo de comida',
  responsable: 'Responsable',
  fecha_hora: 'Fecha y hora',
  fecha: 'Fecha',
  fecha_inicio: 'Fecha de inicio',
  fecha_fin: 'Fecha de fin',
  dosis: 'Dosis',
  horarios: 'Horarios',
  via_administracion: 'Vía de administración',
  medicamento: 'Medicamento',
  residente: 'Residente',
  observaciones: 'Observaciones',
  observacion: 'Observación',
  descripcion: 'Descripción',
  descripcion_menu: 'Menú',
  diagnosticos: 'Diagnósticos',
  alergias: 'Alergias',
  condiciones_cronicas: 'Condiciones crónicas',
  severidad: 'Severidad',
  grupo_alimentario: 'Grupo alimentario',
  relacion: 'Relación',
  relacion_cargo: 'Relación / Cargo',
  administrado: 'Administrado',
}

function etiqueta(k) {
  return ETIQUETAS[k] || k.replace(/_/g, ' ')
}

// Nombres legibles de las entidades auditadas
const ENTIDADES = {
  usuarios: 'Usuario',
  residentes: 'Residente',
  medicamentos: 'Medicamento',
  prescripciones: 'Prescripción',
  planes: 'Plan nutricional',
  actividades: 'Actividad',
  autorizaciones_visitantes: 'Autorización de visitante',
}
function nombreEntidad(e) {
  return ENTIDADES[e] || (e ? e.charAt(0).toUpperCase() + e.slice(1) : '—')
}

function formatVal(k, v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  if (typeof v === 'object') return JSON.stringify(v)

  const s = String(v)
  // Traducir valores conocidos (estado, rol, tipo_comida)
  if (VALORES[k] && VALORES[k][s]) return VALORES[k][s]
  // Formatear fechas ISO (con T y guiones)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s)
    if (!isNaN(d)) return d.toLocaleString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }
  return s
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
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">🔒</p>
        <p>Solo los administradores pueden ver el log de auditoría.</p>
      </div>
    )
  }

  const entradas = data?.results || []
  const totalPaginas = data?.pages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Auditoría</h1>
        <p className="text-gray-500 text-sm mt-1">Registro de todas las acciones del sistema ({data?.total ?? 0} registros)</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Entidad</label>
          <select value={filtros.entidad}
            onChange={e => { setFiltros({ ...filtros, entidad: e.target.value }); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas</option>
            <option value="usuarios">Usuarios</option>
            <option value="residentes">Residentes</option>
            <option value="medicamentos">Medicamentos</option>
            <option value="prescripciones">Prescripciones</option>
            <option value="planes">Planes nutricionales</option>
            <option value="actividades">Actividades</option>
            <option value="autorizaciones_visitantes">Autorizaciones de visitantes</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Acción</label>
          <select value={filtros.accion}
            onChange={e => { setFiltros({ ...filtros, accion: e.target.value }); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas</option>
            <option value="crear">Crear</option>
            <option value="editar">Editar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Desde</label>
          <input type="date" value={filtros.fecha_desde}
            onChange={e => { setFiltros({ ...filtros, fecha_desde: e.target.value }); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Hasta</label>
          <input type="date" value={filtros.fecha_hasta}
            onChange={e => { setFiltros({ ...filtros, fecha_hasta: e.target.value }); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {(filtros.entidad || filtros.accion || filtros.fecha_desde || filtros.fecha_hasta) && (
          <button onClick={() => { setFiltros({ entidad: '', accion: '', fecha_desde: '', fecha_hasta: '' }); setPage(1) }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Limpiar</button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin text-3xl">⚙️</div></div>
        ) : isError ? (
          <div className="text-center py-12 text-gray-400">Error al cargar el log</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>{['Fecha/Hora', 'Usuario', 'Acción', 'Entidad', 'IP', ''].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entradas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin registros</td></tr>
              ) : (
                entradas.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{fmtFecha(e.fecha_hora)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{e.usuario_nombre}</td>
                    <td className="px-6 py-4"><BadgeAccion accion={e.accion} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{nombreEntidad(e.entidad)} <span className="text-gray-300">#{e.entidad_id}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{e.ip || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setDetalle(e)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver detalle</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-40">
              ← Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page} de {totalPaginas}</span>
            <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page >= totalPaginas}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-40">
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {detalle && <ModalDetalle entrada={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}

// Quita campos vacíos antes de mandar al backend
function limpiar(obj) {
  const out = {}
  Object.entries(obj).forEach(([k, v]) => { if (v) out[k] = v })
  return out
}
