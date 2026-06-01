import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, ChevronDown, User, Phone, Stethoscope, Salad,
  Pill, Users, Pencil, CheckCircle2, BedDouble, FolderArchive,
  Ban, AlertTriangle, UtensilsCrossed, ClipboardList, Mail, Plus
} from 'lucide-react'
import { residentesService } from '../../services/residentesService'
import { visitantesService } from '../../services/visitantesService'
import { medicamentosService } from '../../services/medicamentosService'
import useAuthStore from '../../store/authStore'

import ModalAutorizarVisitante from './ModalAutorizarVisitante'
import ModalPrescribir from './ModalPrescribir'
import ModalTomas from './ModalTomas'
import ModalHistorialTomas from './ModalHistorialTomas'
import ModalRestricciones from './ModalRestricciones'
import ModalPlanNutricional from './ModalPlanNutricional'

// ── Componentes pequeños ───────────────────────────────────
function BadgeEstado({ estado }) {
  const cfg = {
    activo:        { cls: 'bg-health-100 text-health-600 border-health-600/20', Icon: CheckCircle2,  label: 'Activo' },
    hospitalizado: { cls: 'bg-alert-100 text-alert-600 border-alert-600/20',    Icon: BedDouble,     label: 'Hospitalizado' },
    dado_de_alta:  { cls: 'bg-gray-100 text-gray-500 border-gray-300',          Icon: FolderArchive, label: 'Dado de alta' },
  }
  const { cls, Icon, label } = cfg[estado] || cfg.dado_de_alta
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${cls}`}>
      <Icon size={14} /> {label}
    </span>
  )
}

function SeccionCard({ titulo, icono: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-400 p-6 transition-shadow hover:shadow-md">
      <h3 className="font-bold text-warm-800 flex items-center gap-2.5 mb-4">
        <span className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-warm-600" />
        </span>
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function CampoInfo({ label, valor }) {
  return (
    <div>
      <p className="text-xs text-warm-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm text-warm-800 mt-1">{valor || '—'}</p>
    </div>
  )
}

const RELACION_LABEL_RES = {
  familiar: 'Familiar',
  amigo: 'Amigo',
  representante_legal: 'Representante legal',
  otro: 'Otro',
}

// Clases reutilizables para inputs cálidos
const inputCls = "w-full mt-1 px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const btnPrimario = "px-3 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition"
const btnSecundario = "px-3 py-2 border border-cream-400 rounded-xl text-sm text-warm-600 hover:bg-warm-50 transition"
const btnLink = "text-sm text-warm-600 hover:text-warm-800 font-semibold inline-flex items-center gap-1 transition"

// ════════════════════════════════════════════════════════════
export default function ResidenteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [editandoHistorial, setEditandoHistorial] = useState(false)
  const [formHistorial, setFormHistorial] = useState({})
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [editandoDatos, setEditandoDatos] = useState(false)
  const [formDatos, setFormDatos] = useState({})
  const [editandoContacto, setEditandoContacto] = useState(null)
  const [formContacto, setFormContacto] = useState({})
  const [creandoContacto, setCreandoContacto] = useState(false)
  const [formNuevoContacto, setFormNuevoContacto] = useState({
    tipo: 'familiar', nombre: '', relacion_cargo: '', telefono: '', email: ''
  })
  const [errorContacto, setErrorContacto] = useState('')
  const [modalAutorizarVisitante, setModalAutorizarVisitante] = useState(false)
  const [modalPrescribir, setModalPrescribir] = useState(false)
  const [modalTomas, setModalTomas] = useState(null)
  const [modalHistorialTomas, setModalHistorialTomas] = useState(false)
  const [modalRestricciones, setModalRestricciones] = useState(false)
  const [modalPlan, setModalPlan] = useState(false)

  // ── Queries ──
  const { data: residente, isLoading } = useQuery({
    queryKey: ['residente', id],
    queryFn: () => residentesService.obtener(id),
  })
  const { data: historial } = useQuery({
    queryKey: ['historial', id],
    queryFn: () => residentesService.obtenerHistorial(id),
    enabled: !!id,
  })
  const { data: contactos } = useQuery({
    queryKey: ['contactos', id],
    queryFn: () => residentesService.listarContactos(id),
    enabled: !!id,
  })
  const { data: visitantesAutorizados } = useQuery({
    queryKey: ['autorizaciones-residente', id],
    queryFn: () => visitantesService.listarAutorizacionesResidente(id),
    enabled: !!id,
  })
  const { data: prescripciones } = useQuery({
    queryKey: ['prescripciones', id],
    queryFn: () => medicamentosService.listarPrescripciones(id),
    enabled: !!id,
  })

  // ── Mutaciones ──
  const mutacionHistorial = useMutation({
    mutationFn: (data) => residentesService.editarHistorial(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['historial', id]); setEditandoHistorial(false) },
  })
  const mutacionEstado = useMutation({
    mutationFn: (estado) => residentesService.cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries(['residente', id])
      queryClient.invalidateQueries(['residentes'])
      setCambiandoEstado(false)
    },
  })
  const mutacionEditar = useMutation({
    mutationFn: (data) => residentesService.editar(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['residente', id]); setEditandoDatos(false) },
  })
  const mutacionEditarContacto = useMutation({
    mutationFn: ({ cid, data }) => residentesService.editarContacto(id, cid, data),
    onSuccess: () => { queryClient.invalidateQueries(['contactos', id]); setEditandoContacto(null) },
  })
  const mutacionCrearContacto = useMutation({
    mutationFn: (data) => residentesService.crearContacto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contactos', id])
      setCreandoContacto(false)
      setErrorContacto('')
      setFormNuevoContacto({ tipo: 'familiar', nombre: '', relacion_cargo: '', telefono: '', email: '' })
    },
    onError: (err) => {
      const detalle = err.response?.data?.detalle || err.response?.data
      setErrorContacto(detalle?.error || detalle?.tipo?.[0] || detalle?.non_field_errors?.[0] || JSON.stringify(detalle) || 'Error al guardar el contacto')
    },
  })
  const mutacionSuspenderVisitante = useMutation({
    mutationFn: (visitanteId) => visitantesService.suspender(visitanteId, id),
    onSuccess: () => queryClient.invalidateQueries(['autorizaciones-residente', id]),
  })
  const mutacionReactivarVisitante = useMutation({
    mutationFn: ({ visitanteId, relacion }) => visitantesService.autorizar(visitanteId, id, { relacion }),
    onSuccess: () => queryClient.invalidateQueries(['autorizaciones-residente', id]),
  })
  const mutacionFinalizarPrescripcion = useMutation({
    mutationFn: (pmId) => medicamentosService.finalizarPrescripcion(id, pmId),
    onSuccess: () => queryClient.invalidateQueries(['prescripciones', id]),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
    </div>
  )
  if (!residente) return <div className="text-center py-16 text-gray-400">Residente no encontrado</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/residentes')}
          className="w-10 h-10 rounded-xl border border-cream-400 bg-white text-warm-600 hover:bg-warm-50 hover:border-warm-400 flex items-center justify-center transition shrink-0">
          <ArrowLeft size={18} />
        </button>
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warm-300 to-warm-400 text-warm-800 flex items-center justify-center font-bold text-base shrink-0">
            {residente.nombre?.[0]}{residente.apellido?.[0]}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-warm-800 truncate">{residente.nombre} {residente.apellido}</h1>
            <p className="text-warm-600 text-sm">C.I.: {residente.dni}</p>
          </div>
        </div>
        <BadgeEstado estado={residente.estado} />
        {esAdmin && (
          <div className="relative">
            <button onClick={() => setCambiandoEstado(!cambiandoEstado)}
              className="px-4 py-2 border border-cream-400 rounded-xl text-sm text-warm-600 hover:bg-warm-50 hover:border-warm-400 flex items-center gap-1.5 transition">
              Cambiar estado <ChevronDown size={15} className={`transition-transform ${cambiandoEstado ? 'rotate-180' : ''}`} />
            </button>
            {cambiandoEstado && (
              <div className="absolute right-0 mt-2 bg-white border border-cream-400 rounded-xl shadow-xl z-10 overflow-hidden min-w-[160px]">
                {['activo', 'hospitalizado', 'dado_de_alta'].map(e => (
                  <button key={e} onClick={() => mutacionEstado.mutate(e)}
                    className="block w-full text-left px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-50 capitalize transition">
                    {e.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Datos personales ── */}
        <SeccionCard titulo="Datos personales" icono={User}>
          {editandoDatos ? (
            <div className="space-y-3">
              {[
                { label: 'Nombre', key: 'nombre', type: 'text' },
                { label: 'Apellido completo', key: 'apellido', type: 'text' },
                { label: 'Fecha nacimiento', key: 'fecha_nacimiento', type: 'date' },
                { label: 'Fecha ingreso', key: 'fecha_ingreso', type: 'date' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-warm-500 uppercase">{label}</label>
                  <input type={type} defaultValue={residente[key]}
                    onChange={e => setFormDatos(f => ({ ...f, [key]: e.target.value }))}
                    className={inputCls} />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditandoDatos(false)} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
                <button onClick={() => mutacionEditar.mutate(formDatos)} disabled={mutacionEditar.isPending}
                  className={`flex-1 ${btnPrimario}`}>
                  {mutacionEditar.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <CampoInfo label="Nombre" valor={residente.nombre} />
              <CampoInfo label="Apellido completo" valor={residente.apellido} />
              <CampoInfo label="C.I." valor={residente.dni} />
              <CampoInfo label="Fecha nacimiento" valor={residente.fecha_nacimiento} />
              <CampoInfo label="Fecha ingreso" valor={residente.fecha_ingreso} />
              <CampoInfo label="Registrado por" valor={residente.registrado_por_nombre} />
              {esAdmin && (
                <div className="col-span-2 pt-2">
                  <button onClick={() => setEditandoDatos(true)} className={btnLink}><Pencil size={14} /> Editar datos personales</button>
                </div>
              )}
            </div>
          )}
        </SeccionCard>

        {/* ── Contactos de emergencia ── */}
        <SeccionCard titulo="Contactos de emergencia" icono={Phone}>
          {esAdmin && !creandoContacto && (
            <button onClick={() => setCreandoContacto(true)} className={`mb-3 ${btnLink}`}><Plus size={14} /> Agregar contacto</button>
          )}
          {creandoContacto && (
            <div className="bg-warm-50 border border-cream-400 rounded-xl p-3 mb-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-warm-500 uppercase">Tipo</label>
                <select value={formNuevoContacto.tipo}
                  onChange={e => setFormNuevoContacto(f => ({ ...f, tipo: e.target.value }))}
                  className={inputCls}>
                  <option value="familiar">Familiar</option>
                  <option value="medico_cabecera">Médico de cabecera</option>
                </select>
              </div>
              {[
                { label: 'Nombre', key: 'nombre', type: 'text' },
                { label: 'Relación/Cargo', key: 'relacion_cargo', type: 'text' },
                { label: 'Teléfono', key: 'telefono', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-warm-500 uppercase">{label}</label>
                  <input type={type} value={formNuevoContacto[key]}
                    onChange={e => setFormNuevoContacto(f => ({ ...f, [key]: e.target.value }))}
                    className={inputCls} />
                </div>
              ))}
              {errorContacto && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{errorContacto}</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setCreandoContacto(false); setErrorContacto('') }} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
                <button onClick={() => mutacionCrearContacto.mutate(formNuevoContacto)} disabled={mutacionCrearContacto.isPending}
                  className={`flex-1 ${btnPrimario}`}>
                  {mutacionCrearContacto.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
          {contactos?.length === 0 && !creandoContacto ? (
            <p className="text-sm text-gray-400">Sin contactos registrados</p>
          ) : (
            <div className="space-y-4">
              {contactos?.map(c => (
                <div key={c.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-3">
                  {editandoContacto === c.id ? (
                    <div className="space-y-3">
                      {[
                        { label: 'Nombre', key: 'nombre', type: 'text' },
                        { label: 'Relación/Cargo', key: 'relacion_cargo', type: 'text' },
                        { label: 'Teléfono', key: 'telefono', type: 'text' },
                        { label: 'Email', key: 'email', type: 'email' },
                      ].map(({ label, key, type }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-warm-500 uppercase">{label}</label>
                          <input type={type} defaultValue={c[key]}
                            onChange={e => setFormContacto(f => ({ ...f, [key]: e.target.value }))}
                            className={inputCls} />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setEditandoContacto(null)} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
                        <button onClick={() => mutacionEditarContacto.mutate({ cid: c.id, data: formContacto })} disabled={mutacionEditarContacto.isPending}
                          className={`flex-1 ${btnPrimario}`}>
                          {mutacionEditarContacto.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-warm-600 uppercase inline-flex items-center gap-1.5">
                          {c.tipo === 'familiar' ? <Users size={13} /> : <Stethoscope size={13} />}
                          {c.tipo === 'familiar' ? 'Familiar' : 'Médico de cabecera'}
                        </span>
                        {esAdmin && (
                          <button onClick={() => { setEditandoContacto(c.id); setFormContacto({}) }}
                            className="text-xs text-warm-500 hover:text-warm-700 font-semibold inline-flex items-center gap-1 transition"><Pencil size={12} /> Editar</button>
                        )}
                      </div>
                      <p className="font-semibold text-warm-800 text-sm">{c.nombre}</p>
                      <p className="text-xs text-warm-500">{c.relacion_cargo}</p>
                      <p className="text-xs text-warm-600 mt-1 inline-flex items-center gap-1.5"><Phone size={12} /> {c.telefono}</p>
                      {c.email && <p className="text-xs text-warm-600 inline-flex items-center gap-1.5"><Mail size={12} /> {c.email}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SeccionCard>

        {/* ── Historial médico ── */}
        <SeccionCard titulo="Historial médico" icono={Stethoscope}>
          {editandoHistorial ? (
            <div className="space-y-3">
              {[
                { label: 'Diagnósticos', key: 'diagnosticos' },
                { label: 'Alergias', key: 'alergias' },
                { label: 'Condiciones crónicas', key: 'condiciones_cronicas' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-warm-500 uppercase">{label}</label>
                  <textarea rows={2} defaultValue={historial?.[key]}
                    onChange={e => setFormHistorial(f => ({ ...f, [key]: e.target.value }))}
                    className={inputCls} />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditandoHistorial(false)} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
                <button onClick={() => mutacionHistorial.mutate(formHistorial)} disabled={mutacionHistorial.isPending}
                  className={`flex-1 ${btnPrimario}`}>
                  {mutacionHistorial.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <CampoInfo label="Diagnósticos" valor={historial?.diagnosticos} />
              <CampoInfo label="Alergias" valor={historial?.alergias} />
              <CampoInfo label="Condiciones crónicas" valor={historial?.condiciones_cronicas} />
              {esAdmin && (
                <button onClick={() => setEditandoHistorial(true)} className={`mt-2 ${btnLink}`}><Pencil size={14} /> Editar historial</button>
              )}
            </div>
          )}
        </SeccionCard>

        {/* ── Restricciones alimentarias ── */}
        <SeccionCard titulo="Restricciones alimentarias" icono={Salad}>
          {esAdmin && (
            <button onClick={() => setModalRestricciones(true)} className={`mb-3 ${btnLink}`}>
              Gestionar restricciones
            </button>
          )}
          {residente.restricciones_alimentarias?.length === 0 ? (
            <p className="text-sm text-gray-400">Sin restricciones activas</p>
          ) : (
            <ul className="space-y-2">
              {residente.restricciones_alimentarias?.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {r.severidad === 'obligatorio'
                    ? <Ban size={15} className="text-danger-600 shrink-0" />
                    : <AlertTriangle size={15} className="text-alert-600 shrink-0" />}
                  <span className="text-warm-800">{r.nombre}</span>
                  <span className="text-xs text-warm-500">({r.severidad})</span>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setModalPlan(true)} className={`mt-3 block ${btnLink}`}>
            <UtensilsCrossed size={14} /> Ver plan nutricional y menús
          </button>
        </SeccionCard>

        {/* ── Medicamentos / Prescripciones ── */}
        <SeccionCard titulo="Medicamentos / Prescripciones" icono={Pill}>
          <div className="flex gap-4 mb-3 flex-wrap">
            {esAdmin && (
              <button onClick={() => setModalPrescribir(true)} className={btnLink}>
                <Plus size={14} /> Prescribir medicamento
              </button>
            )}
            <button onClick={() => setModalHistorialTomas(true)}
              className="text-sm text-warm-600 hover:text-warm-800 font-semibold inline-flex items-center gap-1 transition">
              <ClipboardList size={14} /> Ver historial de tomas
            </button>
          </div>

          {/* Activas */}
          {prescripciones?.filter(p => p.estado === 'activo').length === 0 ? (
            <p className="text-sm text-gray-400">Sin prescripciones activas</p>
          ) : (
            <div className="space-y-2">
              {prescripciones?.filter(p => p.estado === 'activo').map(p => (
                <div key={p.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="font-semibold text-warm-800 text-sm">{p.medicamento_nombre}</p>
                    <span className="text-xs bg-info-100 text-info-600 px-2 py-0.5 rounded-full shrink-0">{p.via_administracion}</span>
                  </div>
                  <p className="text-xs text-warm-600">Dosis: {p.dosis}</p>
                  <p className="text-xs text-warm-600">Horarios: {p.horarios?.join(', ')}</p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <button onClick={() => setModalTomas(p)} className="text-xs text-warm-600 hover:text-warm-800 font-semibold inline-flex items-center gap-1 transition"><Pill size={12} /> Registrar / ver tomas</button>
                    {esAdmin && (
                      <button onClick={() => mutacionFinalizarPrescripcion.mutate(p.id)} className="text-xs text-danger-600 hover:text-danger-700 font-semibold transition">Finalizar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Finalizadas */}
          {prescripciones?.filter(p => p.estado === 'finalizado').length > 0 && (
            <div className="mt-4 pt-4 border-t border-cream-400">
              <p className="text-xs font-bold text-warm-500 uppercase mb-2">Finalizadas</p>
              <div className="space-y-2">
                {prescripciones?.filter(p => p.estado === 'finalizado').map(p => (
                  <div key={p.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-3 opacity-75">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <p className="font-semibold text-warm-600 text-sm">{p.medicamento_nombre}</p>
                      <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full shrink-0">Finalizada</span>
                    </div>
                    <p className="text-xs text-warm-500">Dosis: {p.dosis} · {p.via_administracion}</p>
                    <p className="text-xs text-warm-500">{p.fecha_inicio} → {p.fecha_fin || 'sin fecha fin'}</p>
                    <button onClick={() => setModalTomas(p)} className="text-xs text-warm-600 hover:text-warm-800 font-semibold mt-1 inline-flex items-center gap-1 transition"><ClipboardList size={12} /> Ver tomas</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SeccionCard>

        {/* ── Visitantes autorizados ── */}
        <SeccionCard titulo="Visitantes autorizados" icono={Users}>
          {esAdmin && (
            <button onClick={() => setModalAutorizarVisitante(true)} className={`mb-3 ${btnLink}`}><Plus size={14} /> Autorizar visitante</button>
          )}
          {visitantesAutorizados?.length === 0 ? (
            <p className="text-sm text-gray-400">Sin visitantes autorizados</p>
          ) : (
            <div className="space-y-2">
              {visitantesAutorizados?.map(a => (
                <div key={a.id} className="bg-warm-50 border border-cream-400/60 rounded-xl p-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-health-100 flex items-center justify-center text-health-600 font-bold text-sm shrink-0">{a.visitante_nombre?.[0]}</div>
                    <div>
                      <p className="font-semibold text-warm-800 text-sm">{a.visitante_nombre}</p>
                      <p className="text-xs text-warm-500">{RELACION_LABEL_RES[a.relacion] || a.relacion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 ${a.estado === 'activo' ? 'bg-health-100 text-health-600' : 'bg-danger-100 text-danger-600'}`}>
                      {a.estado === 'activo' ? <><CheckCircle2 size={12} /> Activo</> : <><Ban size={12} /> Suspendido</>}
                    </span>
                    {esAdmin && a.estado === 'activo' && (
                      <button onClick={() => mutacionSuspenderVisitante.mutate(a.visitante)} className="text-xs text-danger-600 hover:text-danger-700 font-semibold transition">Suspender</button>
                    )}
                    {esAdmin && a.estado === 'suspendido' && (
                      <button onClick={() => mutacionReactivarVisitante.mutate({ visitanteId: a.visitante, relacion: a.relacion })} className="text-xs text-health-600 hover:text-health-700 font-semibold transition">Reactivar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SeccionCard>

      </div>

      {/* Modales */}
      {modalAutorizarVisitante && (
        <ModalAutorizarVisitante residenteId={id}
          onClose={() => setModalAutorizarVisitante(false)}
          onGuardado={() => queryClient.invalidateQueries(['autorizaciones-residente', id])} />
      )}
      {modalPrescribir && (
        <ModalPrescribir residenteId={id}
          onClose={() => setModalPrescribir(false)}
          onGuardado={() => queryClient.invalidateQueries(['prescripciones', id])} />
      )}
      {modalTomas && (
        <ModalTomas prescripcion={modalTomas} residenteId={id}
          onClose={() => setModalTomas(null)} />
      )}
      {modalHistorialTomas && (
        <ModalHistorialTomas residenteId={id} onClose={() => setModalHistorialTomas(false)} />
      )}
      {modalRestricciones && (
        <ModalRestricciones residenteId={id} onClose={() => setModalRestricciones(false)} />
      )}
      {modalPlan && (
        <ModalPlanNutricional residenteId={id} onClose={() => setModalPlan(false)} />
      )}
    </div>
  )
}
