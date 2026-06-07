// src/pages/nutricion/Nutricion.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Salad, CheckCircle2, Archive, Apple, ShieldX, UtensilsCrossed,
  ChefHat, Search, Plus, Pencil
} from 'lucide-react'
import { nutricionService } from '../../services/nutricionService'
import useAuthStore from '../../store/authStore'

import { inputCls, GRUPOS_ALIMENTARIOS } from './components/nutricionShared'
import {
  BadgeSeveridad, BadgeEstadoAlimento, BadgeEstadoRestriccion, Spinner
} from './components/BadgesNutricion'
import ModalRestriccion from './components/ModalRestriccion'
import ModalAlimento    from './components/ModalAlimento'
import TabPlantillas    from './components/TabPlantillas'

const POR_PAGINA = 10

function PaginadorSimple({ pagina, total, porPagina, onChange }) {
  const totalPaginas = Math.ceil(total / porPagina)
  if (totalPaginas <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-cream-400 bg-warm-50/50">
      <p className="text-xs text-warm-400">
        Mostrando {Math.min((pagina - 1) * porPagina + 1, total)}–{Math.min(pagina * porPagina, total)} de {total}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1}
          className="px-3 py-1.5 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
          ← Anterior
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition
              ${n === pagina ? 'bg-warm-600 text-white border-warm-600' : 'border-cream-400 text-warm-600 hover:bg-warm-100'}`}>
            {n}
          </button>
        ))}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas}
          className="px-3 py-1.5 text-xs rounded-lg border border-cream-400 text-warm-600 hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Siguiente →
        </button>
      </div>
    </div>
  )
}

export default function Nutricion() {
  const queryClient = useQueryClient()
  const esAdmin = useAuthStore(s => s.usuario)?.rol === 'administrador'

  const [tab, setTab] = useState('restricciones')

  // ── Estados restricciones ──
  const [modalRestriccion, setModalRestriccion] = useState(null)
  const [filtroSeveridad, setFiltroSeveridad]   = useState('')
  const [filtroEstadoR, setFiltroEstadoR]       = useState('activo')
  const [busquedaR, setBusquedaR]               = useState('')
  const [paginaR, setPaginaR]                   = useState(1)

  // ── Estados alimentos ──
  const [modalAlimento, setModalAlimento]   = useState(null)
  const [busquedaA, setBusquedaA]           = useState('')
  const [filtroGrupoA, setFiltroGrupoA]     = useState('')
  const [filtroEstadoA, setFiltroEstadoA]   = useState('')   // Corrección 1: filtro de estado
  const [paginaA, setPaginaA]               = useState(1)

  // ── Queries ──
  const { data: restricciones, isLoading: cargandoR } = useQuery({
    queryKey: ['restricciones'],
    queryFn: () => nutricionService.listarRestricciones({ incluir_archivadas: true }),
  })
  const { data: alimentos, isLoading: cargandoA } = useQuery({
    queryKey: ['alimentos'],
    queryFn: () => nutricionService.listarAlimentos({ incluir_no_activos: true }),
  })

  // ── Filtros ──
  const restriccionesFiltradas = restricciones?.filter(r => {
    if (filtroEstadoR === 'activo'    && r.estado !== 'activo')    return false
    if (filtroEstadoR === 'archivado' && r.estado !== 'archivado') return false
    if (filtroSeveridad && r.severidad !== filtroSeveridad)        return false
    if (busquedaR && !r.nombre.toLowerCase().includes(busquedaR.toLowerCase())) return false
    return true
  }) || []

  const alimentosFiltrados = alimentos?.filter(a => {
    if (busquedaA && !a.nombre.toLowerCase().includes(busquedaA.toLowerCase())) return false
    if (filtroGrupoA && a.grupo_alimentario !== filtroGrupoA)                   return false
    if (filtroEstadoA && a.estado !== filtroEstadoA)                            return false   // Corrección 1
    return true
  }) || []

  // ── Paginación ──
  const restriccionesPag = restriccionesFiltradas.slice((paginaR - 1) * POR_PAGINA, paginaR * POR_PAGINA)
  const alimentosPag     = alimentosFiltrados.slice((paginaA - 1) * POR_PAGINA, paginaA * POR_PAGINA)

  // ── Mutaciones ──
  const mutArchivarR = useMutation({
    mutationFn: (id) => nutricionService.archivarRestriccion(id),
    onSuccess: () => queryClient.invalidateQueries(['restricciones']),
  })
  const mutActivarR = useMutation({
    mutationFn: (id) => nutricionService.activarRestriccion(id),
    onSuccess: () => queryClient.invalidateQueries(['restricciones']),
  })
  const mutActivarA = useMutation({
    mutationFn: (id) => nutricionService.activarAlimento(id),
    onSuccess: () => queryClient.invalidateQueries(['alimentos']),
  })
  const mutArchivarA = useMutation({
    mutationFn: (id) => nutricionService.archivarAlimento(id),
    onSuccess: () => queryClient.invalidateQueries(['alimentos']),
  })

  const tabs = [
    { key: 'restricciones', label: 'Restricciones',       icon: ShieldX },
    { key: 'alimentos',     label: 'Alimentos',            icon: UtensilsCrossed },
    { key: 'plantillas',    label: 'Planes nutricionales', icon: ChefHat },
  ]

  // ¿Puede crear en el tab actual? Restricciones: solo admin. Alimentos: admin o cuidador (corrección 3)
  const puedeCrear = tab === 'restricciones' ? esAdmin : tab === 'alimentos' ? true : false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ animation: 'fadeUp 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-warm-100 flex items-center justify-center">
            <Salad size={22} className="text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-warm-800 tracking-tight">Nutrición</h1>
            <p className="text-warm-600 text-sm">Restricciones, alimentos y planes nutricionales</p>
          </div>
        </div>
        {puedeCrear && tab !== 'plantillas' && (
          <button
            onClick={() => tab === 'restricciones' ? setModalRestriccion({}) : setModalAlimento({})}
            className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <Plus size={16} /> {tab === 'restricciones' ? 'Nueva restricción' : 'Nuevo alimento'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-cream-400 w-fit" style={{ animation: 'fadeUp 0.45s ease both' }}>
        {tabs.map(t => {
          const Icon = t.icon
          const activo = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2
                ${activo ? 'bg-gradient-to-br from-warm-600 to-warm-500 text-white shadow' : 'text-warm-600 hover:bg-warm-50'}`}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Restricciones ── */}
      {tab === 'restricciones' && (
        <div className="space-y-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
              <input type="text" value={busquedaR} placeholder="Buscar por nombre..."
                onChange={e => { setBusquedaR(e.target.value); setPaginaR(1) }}
                className={`${inputCls} pl-9`} />
            </div>
            <select value={filtroEstadoR} onChange={e => { setFiltroEstadoR(e.target.value); setPaginaR(1) }}
              className={`${inputCls} cursor-pointer min-w-36 flex-none`}>
              <option value="activo">Solo activas</option>
              <option value="archivado">Solo archivadas</option>
              <option value="todos">Todas</option>
            </select>
            <select value={filtroSeveridad} onChange={e => { setFiltroSeveridad(e.target.value); setPaginaR(1) }}
              className={`${inputCls} cursor-pointer min-w-40 flex-none`}>
              <option value="">Toda severidad</option>
              <option value="obligatorio">Obligatorio</option>
              <option value="recomendado">Recomendado</option>
            </select>
          </div>

          {cargandoR ? <Spinner /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden">
              {/* Tabla desktop */}
              <div className="nut-tabla overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-warm-50 border-b border-cream-400">
                      <th className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider w-12">#</th>
                      {['Restricción', 'Condiciones asociadas', 'Severidad', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restriccionesPag.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-warm-400">Sin restricciones</td></tr>
                    ) : (
                      restriccionesPag.map((r, i) => (
                        <tr key={r.id} className={`hover:bg-warm-50 transition ${i < restriccionesPag.length - 1 ? 'border-b border-warm-50' : ''}`}>
                          <td className="px-6 py-4 text-sm font-semibold text-warm-400">{(paginaR - 1) * POR_PAGINA + i + 1}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-warm-800">{r.nombre}</p>
                            <p className="text-xs text-warm-400">{r.descripcion}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-warm-600">{r.condiciones_asociadas || '—'}</td>
                          <td className="px-6 py-4"><BadgeSeveridad severidad={r.severidad} /></td>
                          <td className="px-6 py-4"><BadgeEstadoRestriccion estado={r.estado} /></td>
                          <td className="px-6 py-4">
                            {esAdmin && (
                              <div className="flex gap-2 flex-wrap">
                                <button onClick={() => setModalRestriccion(r)}
                                  className="text-warm-500 hover:text-warm-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Pencil size={13} /> Editar</button>
                                {r.estado === 'activo' ? (
                                  <button onClick={() => mutArchivarR.mutate(r.id)}
                                    className="text-danger-600 hover:text-danger-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Archive size={13} /> Archivar</button>
                                ) : (
                                  <button onClick={() => mutActivarR.mutate(r.id)}
                                    className="text-health-600 hover:text-health-700 text-sm font-semibold inline-flex items-center gap-1 transition"><CheckCircle2 size={13} /> Activar</button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Cards móvil */}
              <div className="nut-cards hidden flex-col gap-3 p-4">
                {restriccionesPag.map((r, i) => (
                  <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-warm-400 bg-warm-100 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{(paginaR - 1) * POR_PAGINA + i + 1}</span>
                        <p className="font-bold text-warm-800">{r.nombre}</p>
                      </div>
                      <BadgeSeveridad severidad={r.severidad} />
                    </div>
                    {r.descripcion && <p className="text-xs text-warm-500 mb-2">{r.descripcion}</p>}
                    <p className="text-sm text-warm-600 mb-2"><span className="text-warm-400">Condiciones:</span> {r.condiciones_asociadas || '—'}</p>
                    <BadgeEstadoRestriccion estado={r.estado} />
                    {esAdmin && (
                      <div className="flex gap-3 pt-3 mt-3 border-t border-warm-50">
                        <button onClick={() => setModalRestriccion(r)} className="text-warm-500 text-sm font-semibold inline-flex items-center gap-1"><Pencil size={13} /> Editar</button>
                        {r.estado === 'activo' ? (
                          <button onClick={() => mutArchivarR.mutate(r.id)} className="text-danger-600 text-sm font-semibold inline-flex items-center gap-1 ml-auto"><Archive size={13} /> Archivar</button>
                        ) : (
                          <button onClick={() => mutActivarR.mutate(r.id)} className="text-health-600 text-sm font-semibold inline-flex items-center gap-1 ml-auto"><CheckCircle2 size={13} /> Activar</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <PaginadorSimple pagina={paginaR} total={restriccionesFiltradas.length} porPagina={POR_PAGINA} onChange={setPaginaR} />
            </div>
          )}
        </div>
      )}

      {/* ── Tab Alimentos ── */}
      {tab === 'alimentos' && (
        <div className="space-y-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
              <input type="text" value={busquedaA} placeholder="Buscar por nombre..."
                onChange={e => { setBusquedaA(e.target.value); setPaginaA(1) }}
                className={`${inputCls} pl-9`} />
            </div>
            {/* Corrección 1: filtro de estado */}
            <select value={filtroEstadoA} onChange={e => { setFiltroEstadoA(e.target.value); setPaginaA(1) }}
              className={`${inputCls} cursor-pointer min-w-40 flex-none`}>
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="pendiente">Pendientes</option>
              <option value="archivado">Archivados</option>
            </select>
            <select value={filtroGrupoA} onChange={e => { setFiltroGrupoA(e.target.value); setPaginaA(1) }}
              className={`${inputCls} cursor-pointer min-w-44 flex-none`}>
              <option value="">Todos los grupos</option>
              {GRUPOS_ALIMENTARIOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {cargandoA ? <Spinner /> : (
            <div className="bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden">
              {/* Tabla desktop */}
              <div className="nut-tabla overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-warm-50 border-b border-cream-400">
                      <th className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider w-12">#</th>
                      {['Alimento', 'Grupo', 'Restricciones que viola', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alimentosPag.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-warm-400">Sin alimentos</td></tr>
                    ) : (
                      alimentosPag.map((a, i) => (
                        <tr key={a.id} className={`hover:bg-warm-50 transition ${i < alimentosPag.length - 1 ? 'border-b border-warm-50' : ''}`}>
                          <td className="px-6 py-4 text-sm font-semibold text-warm-400">{(paginaA - 1) * POR_PAGINA + i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                                <Apple size={16} className="text-warm-600" />
                              </div>
                              <span className="font-semibold text-warm-800">{a.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-warm-600">{a.grupo_alimentario}</td>
                          <td className="px-6 py-4">
                            {a.restricciones_que_viola?.length === 0 ? (
                              <span className="text-xs text-warm-300">Ninguna</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {a.restricciones_que_viola?.map(r => (
                                  <span key={r.id} className={`text-xs px-2 py-0.5 rounded-full
                                    ${r.severidad === 'obligatorio' ? 'bg-danger-100 text-danger-600' : 'bg-alert-100 text-alert-600'}`}>
                                    {r.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4"><BadgeEstadoAlimento estado={a.estado} /></td>
                          <td className="px-6 py-4">
                            {esAdmin && (
                              <div className="flex gap-2 flex-wrap">
                                <button onClick={() => setModalAlimento(a)}
                                  className="text-warm-500 hover:text-warm-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Pencil size={13} /> Editar</button>
                                {(a.estado === 'pendiente' || a.estado === 'archivado') && (
                                  <button onClick={() => mutActivarA.mutate(a.id)}
                                    className="text-health-600 hover:text-health-700 text-sm font-semibold inline-flex items-center gap-1 transition"><CheckCircle2 size={13} /> Activar</button>
                                )}
                                {a.estado !== 'archivado' && (
                                  <button onClick={() => { if (window.confirm(`¿Archivar "${a.nombre}"?`)) mutArchivarA.mutate(a.id) }}
                                    className="text-danger-600 hover:text-danger-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Archive size={13} /> Archivar</button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Cards móvil */}
              <div className="nut-cards hidden flex-col gap-3 p-4">
                {alimentosPag.map((a, i) => (
                  <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-warm-400 bg-warm-100 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{(paginaA - 1) * POR_PAGINA + i + 1}</span>
                      <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                        <Apple size={18} className="text-warm-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-warm-800">{a.nombre}</p>
                        <p className="text-xs text-warm-400">{a.grupo_alimentario}</p>
                      </div>
                      <BadgeEstadoAlimento estado={a.estado} />
                    </div>
                    {a.restricciones_que_viola?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {a.restricciones_que_viola?.map(r => (
                          <span key={r.id} className={`text-xs px-2 py-0.5 rounded-full
                            ${r.severidad === 'obligatorio' ? 'bg-danger-100 text-danger-600' : 'bg-alert-100 text-alert-600'}`}>
                            {r.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                    {esAdmin && (
                      <div className="flex gap-3 pt-3 border-t border-warm-50">
                        <button onClick={() => setModalAlimento(a)} className="text-warm-500 text-sm font-semibold inline-flex items-center gap-1"><Pencil size={13} /> Editar</button>
                        {(a.estado === 'pendiente' || a.estado === 'archivado') && (
                          <button onClick={() => mutActivarA.mutate(a.id)} className="text-health-600 text-sm font-semibold inline-flex items-center gap-1"><CheckCircle2 size={13} /> Activar</button>
                        )}
                        {a.estado !== 'archivado' && (
                          <button onClick={() => { if (window.confirm(`¿Archivar "${a.nombre}"?`)) mutArchivarA.mutate(a.id) }}
                            className="text-danger-600 text-sm font-semibold inline-flex items-center gap-1 ml-auto"><Archive size={13} /> Archivar</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <PaginadorSimple pagina={paginaA} total={alimentosFiltrados.length} porPagina={POR_PAGINA} onChange={setPaginaA} />
            </div>
          )}
        </div>
      )}

      {/* ── Tab Plantillas ── */}
      {tab === 'plantillas' && <TabPlantillas esAdmin={esAdmin} />}

      {/* Modales */}
      {modalRestriccion !== null && (
        <ModalRestriccion
          restriccion={modalRestriccion.id ? modalRestriccion : null}
          onClose={() => setModalRestriccion(null)}
          onGuardado={() => queryClient.invalidateQueries(['restricciones'])}
        />
      )}
      {modalAlimento !== null && (
        <ModalAlimento
          alimento={modalAlimento.id ? modalAlimento : null}
          onClose={() => setModalAlimento(null)}
          onGuardado={() => queryClient.invalidateQueries(['alimentos'])}
        />
      )}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 767px) {
          .nut-tabla { display: none !important; }
          .nut-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
