// src/pages/nutricion/components/TabPlantillas.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Clock, CheckCircle2, Ban, ChefHat, ClipboardList,
  ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  Users, Pencil, Plus, Search, X, Shuffle, Loader2, ArrowRight
} from 'lucide-react'
import { nutricionService } from '../../../services/nutricionService'
import useAuthStore from '../../../store/authStore'
import { inputCls, TIPO_COMIDA_ICON } from './nutricionShared'
import { BadgeEstadoPlantilla, Spinner, Empty } from './BadgesNutricion'
import ModalPlantilla, { ModalEditarPlantilla } from './ModalPlantilla'
import { ModalRechazar, ModalAsignar } from './ModalRechazarAsignar'

// ── Modal: residentes asignados a una plantilla (solo vigentes) ──
function ModalAsignados({ plantilla, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['plantilla-asignados', plantilla.id],
    queryFn: () => nutricionService.asignadosPlantilla(plantilla.id),
  })

  const asignados = data?.asignados || []

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-health-600 to-health-500 flex items-center justify-center shrink-0">
            <Users size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-warm-800">Residentes asignados</h2>
            <p className="text-xs text-warm-500 truncate">"{plantilla.nombre}" · planes vigentes</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 flex items-center justify-center transition"><X size={16} /></button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-warm-500" /></div>
          ) : asignados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Users size={28} className="text-warm-300" />
              <p className="text-warm-400 text-sm">Ningún residente tiene este plan vigente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {asignados.map(a => (
                <div key={a.plan_id} className="border border-cream-400 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-warm-600 font-bold text-xs shrink-0">
                      {a.residente.split(' ').map(p => p[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-warm-800 truncate">{a.residente}</p>
                      <p className="text-xs text-warm-400">Desde {a.fecha_inicio}</p>
                    </div>
                    {a.con_cambios && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-alert-100 text-alert-600 inline-flex items-center gap-1 shrink-0">
                        <Shuffle size={10} /> Plan con cambios
                      </span>
                    )}
                  </div>

                  {a.con_cambios && a.cambios?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-cream-200 space-y-1">
                      {a.cambios.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-warm-600">
                          <span className="capitalize text-warm-500 font-semibold w-16 shrink-0">
                            {TIPO_COMIDA_ICON[c.tipo_comida]} {c.tipo_comida}
                          </span>
                          <span className="line-through text-danger-400">{c.original}</span>
                          <ArrowRight size={11} className="text-warm-400 shrink-0" />
                          <span className="text-health-600 font-medium">{c.reemplazo}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}

// ── Tarjeta individual de plantilla ───────────────────────
function TarjetaPlantilla({ plantilla, esAdmin, esMia, onAprobar, onRechazar, onAsignar, onEditar, onVerAsignados }) {
  const [expandida, setExpandida] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-cream-400 shadow-sm overflow-hidden transition hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
            <ChefHat size={18} className="text-warm-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-warm-800 text-sm">{plantilla.nombre}</h3>
              <BadgeEstadoPlantilla estado={plantilla.estado} />
            </div>
            <p className="text-xs text-warm-500 mt-0.5 capitalize flex items-center gap-2">
              {plantilla.tipo_dieta.replace('_', ' ')}
              <span className="text-warm-300">·</span>
              <span className="text-warm-400">📅 {plantilla.fecha_menu}</span>
            </p>
            {plantilla.observaciones && (
              <p className="text-xs text-warm-400 mt-1 line-clamp-2">{plantilla.observaciones}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-warm-400 flex-wrap">
          <span>Creado por {plantilla.creado_por_nombre}</span>
          {plantilla.aprobado_por_nombre && (
            <span>· {plantilla.estado === 'aprobado' ? 'Aprobado' : 'Revisado'} por {plantilla.aprobado_por_nombre}</span>
          )}
          <span className="ml-auto">{new Date(plantilla.created_at).toLocaleDateString('es-BO')}</span>
        </div>

        {plantilla.estado === 'rechazado' && plantilla.motivo_rechazo && (
          <div className="mt-3 bg-danger-50 border border-danger-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-danger-600 mb-1">Motivo del rechazo:</p>
            <p className="text-xs text-danger-700">{plantilla.motivo_rechazo}</p>
          </div>
        )}

        <button onClick={() => setExpandida(!expandida)}
          className="mt-3 w-full flex items-center justify-between text-xs text-warm-500 hover:text-warm-700 font-semibold transition py-1">
          <span className="flex items-center gap-1.5">
            <ClipboardList size={12} /> Ver {plantilla.comidas?.length} comidas
          </span>
          {expandida ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expandida && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {plantilla.comidas?.map(c => (
              <div key={c.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-2.5">
                <p className="text-xs font-semibold text-warm-600 capitalize flex items-center gap-1">
                  {TIPO_COMIDA_ICON[c.tipo_comida]} {c.tipo_comida}
                </p>
                <p className="text-xs text-warm-800 mt-0.5">{c.alimento_nombre}</p>
                {c.descripcion_menu && <p className="text-xs text-warm-400 mt-0.5">{c.descripcion_menu}</p>}
              </div>
            ))}
          </div>
        )}

        {plantilla.estado === 'aprobado' && (
          <button onClick={() => onVerAsignados(plantilla)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-health-600 hover:text-health-700 border border-health-200 hover:bg-health-50 rounded-xl py-1.5 transition">
            <Users size={12} /> Ver residentes asignados
          </button>
        )}
      </div>

      {plantilla.estado === 'pendiente' || plantilla.estado === 'aprobado' ? (
        <div className="border-t border-cream-400 px-4 py-3 flex gap-2 flex-wrap bg-warm-50/50">
          {/* Editar: solo el creador, y solo si está pendiente */}
          {plantilla.estado === 'pendiente' && esMia && (
            <button onClick={() => onEditar(plantilla)}
              className="flex-1 px-3 py-1.5 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition">
              <Pencil size={13} /> Editar
            </button>
          )}
          {esAdmin && plantilla.estado === 'pendiente' && (
            <>
              <button onClick={() => onAprobar(plantilla)}
                className="flex-1 px-3 py-1.5 bg-health-600 hover:bg-health-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                <ThumbsUp size={13} /> Aprobar
              </button>
              <button onClick={() => onRechazar(plantilla)}
                className="flex-1 px-3 py-1.5 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                <ThumbsDown size={13} /> Rechazar
              </button>
            </>
          )}
          {esAdmin && plantilla.estado === 'aprobado' && (
            <button onClick={() => onAsignar(plantilla)}
              className="flex-1 px-3 py-1.5 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:shadow-md">
              <Users size={13} /> Asignar a residente
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

// ── Tab principal de plantillas ────────────────────────────
export default function TabPlantillas({ esAdmin }) {
  const queryClient = useQueryClient()
  const usuario = useAuthStore(s => s.usuario)
  const miId = usuario?.id ?? usuario?.user_id ?? usuario?.pk ?? usuario?.usuario_id

  const [subTab, setSubTab]               = useState('pendiente')
  const [modalNueva, setModalNueva]       = useState(false)
  const [modalRechazar, setModalRechazar] = useState(null)
  const [modalAsignar, setModalAsignar]   = useState(null)
  const [modalAsignados, setModalAsignados] = useState(null)
  const [filtroFecha, setFiltroFecha]     = useState('')
  const [modalEditar, setModalEditar]     = useState(null)

  const usaFiltroFecha = subTab === 'aprobado' || subTab === 'rechazado'

  const { data: plantillas, isLoading } = useQuery({
    queryKey: ['plantillas', subTab, filtroFecha],
    queryFn: () => nutricionService.listarPlantillas({
      estado: subTab,
      ...(usaFiltroFecha && filtroFecha ? { fecha: filtroFecha } : {}),
    }),
  })

  const mutAprobar = useMutation({
    mutationFn: (id) => nutricionService.aprobarPlantilla(id),
    onSuccess: () => queryClient.invalidateQueries(['plantillas']),
  })

  const subTabs = [
    { key: 'pendiente', label: 'Pendientes', icon: Clock,        color: 'text-alert-600' },
    { key: 'aprobado',  label: 'Aprobados',  icon: CheckCircle2, color: 'text-health-600' },
    { key: 'rechazado', label: 'Rechazados', icon: Ban,          color: 'text-danger-600' },
  ]

  const cambiarSubTab = (key) => { setSubTab(key); setFiltroFecha('') }

  return (
    <div className="space-y-4" style={{ animation: 'fadeUp 0.5s ease both' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-cream-400">
          {subTabs.map(t => {
            const Icon = t.icon
            const activo = subTab === t.key
            return (
              <button key={t.key} onClick={() => cambiarSubTab(t.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5
                  ${activo ? 'bg-gradient-to-br from-warm-600 to-warm-500 text-white shadow' : `${t.color} hover:bg-warm-50`}`}>
                <Icon size={12} /> {t.label}
                {plantillas?.length > 0 && activo && (
                  <span className="bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {plantillas.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {usaFiltroFecha && (
          <div className="flex items-center gap-2 bg-white border border-cream-400 rounded-xl px-3 py-1.5 shadow-sm">
            <Search size={14} className="text-warm-400 shrink-0" />
            <input type="date" value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
              className="text-sm text-warm-700 bg-transparent focus:outline-none" />
            {filtroFecha && (
              <button onClick={() => setFiltroFecha('')} className="text-warm-400 hover:text-warm-700 transition">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        <button onClick={() => setModalNueva(true)}
          className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
          <Plus size={15} /> Nuevo plan nutricional
        </button>
      </div>

      {isLoading ? <Spinner /> : plantillas?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-400 shadow-sm">
          <Empty
            icon={subTab === 'pendiente' ? '📋' : subTab === 'aprobado' ? '✅' : '❌'}
            texto={
              subTab === 'pendiente' ? 'Sin planes pendientes de aprobación' :
              subTab === 'aprobado'  ? (filtroFecha ? 'Sin planes aprobados en esa fecha' : 'Sin planes aprobados') :
              (filtroFecha ? 'Sin planes rechazados en esa fecha' : 'Sin planes rechazados')
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plantillas?.map(p => (
            <TarjetaPlantilla key={p.id} plantilla={p} esAdmin={esAdmin}
              esMia={String(p.creado_por) === String(miId)}
              onAprobar={(pt) => mutAprobar.mutate(pt.id)}
              onRechazar={(pt) => setModalRechazar(pt)}
              onAsignar={(pt) => setModalAsignar(pt)}
              onEditar={(pt) => setModalEditar(pt)}
              onVerAsignados={(pt) => setModalAsignados(pt)}
            />
          ))}
        </div>
      )}

      {modalNueva && (
        <ModalPlantilla onClose={() => setModalNueva(false)}
          onGuardado={() => queryClient.invalidateQueries(['plantillas'])} />
      )}
      {modalEditar && (
        <ModalEditarPlantilla plantilla={modalEditar} onClose={() => setModalEditar(null)}
          onGuardado={() => queryClient.invalidateQueries(['plantillas'])} />
      )}
      {modalRechazar && (
        <ModalRechazar plantilla={modalRechazar} onClose={() => setModalRechazar(null)}
          onGuardado={() => queryClient.invalidateQueries(['plantillas'])} />
      )}
      {modalAsignar && (
        <ModalAsignar plantilla={modalAsignar} onClose={() => setModalAsignar(null)}
          onGuardado={() => {
            queryClient.invalidateQueries(['plantillas'])
            queryClient.invalidateQueries(['plantilla-asignados', modalAsignar.id])
          }} />
      )}
      {modalAsignados && (
        <ModalAsignados plantilla={modalAsignados} onClose={() => setModalAsignados(null)} />
      )}

      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  )
}
