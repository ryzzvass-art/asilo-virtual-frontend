import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const estilos = {
    activo: 'bg-green-100 text-green-700',
    hospitalizado: 'bg-yellow-100 text-yellow-700',
    dado_de_alta: 'bg-gray-100 text-gray-500',
  }
  const etiquetas = {
    activo: '✅ Activo',
    hospitalizado: '🏥 Hospitalizado',
    dado_de_alta: '📁 Dado de alta',
  }
  return <span className={`text-sm font-medium px-3 py-1 rounded-full ${estilos[estado]}`}>{etiquetas[estado]}</span>
}

function SeccionCard({ titulo, icono, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4"><span>{icono}</span> {titulo}</h3>
      {children}
    </div>
  )
}

function CampoInfo({ label, valor }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-700 mt-1">{valor || '—'}</p>
    </div>
  )
}

const RELACION_LABEL_RES = {
  familiar: '👨‍👩‍👧 Familiar',
  amigo: '👫 Amigo',
  representante_legal: '⚖️ Representante legal',
  otro: '📌 Otro',
}

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

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin text-4xl">⚙️</div></div>
  if (!residente) return <div className="text-center py-16 text-gray-400">Residente no encontrado</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/residentes')} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{residente.nombre} {residente.apellido}</h1>
          <p className="text-gray-400 text-sm">C.I.: {residente.dni}</p>
        </div>
        <BadgeEstado estado={residente.estado} />
        {esAdmin && (
          <div className="relative">
            <button onClick={() => setCambiandoEstado(!cambiandoEstado)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cambiar estado ▾
            </button>
            {cambiandoEstado && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                {['activo', 'hospitalizado', 'dado_de_alta'].map(e => (
                  <button key={e} onClick={() => mutacionEstado.mutate(e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize">
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
        <SeccionCard titulo="Datos personales" icono="👤">
          {editandoDatos ? (
            <div className="space-y-3">
              {[
                { label: 'Nombre', key: 'nombre', type: 'text' },
                { label: 'Apellido completo', key: 'apellido', type: 'text' },
                { label: 'Fecha nacimiento', key: 'fecha_nacimiento', type: 'date' },
                { label: 'Fecha ingreso', key: 'fecha_ingreso', type: 'date' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-500 uppercase">{label}</label>
                  <input type={type} defaultValue={residente[key]}
                    onChange={e => setFormDatos(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditandoDatos(false)} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
                <button onClick={() => mutacionEditar.mutate(formDatos)} disabled={mutacionEditar.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
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
                  <button onClick={() => setEditandoDatos(true)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">✏️ Editar datos personales</button>
                </div>
              )}
            </div>
          )}
        </SeccionCard>

        {/* ── Contactos de emergencia ── */}
        <SeccionCard titulo="Contactos de emergencia" icono="📞">
          {esAdmin && !creandoContacto && (
            <button onClick={() => setCreandoContacto(true)} className="mb-3 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Agregar contacto</button>
          )}
          {creandoContacto && (
            <div className="bg-blue-50 rounded-xl p-3 mb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Tipo</label>
                <select value={formNuevoContacto.tipo}
                  onChange={e => setFormNuevoContacto(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="familiar">👨‍👩‍👧 Familiar</option>
                  <option value="medico_cabecera">👨‍⚕️ Médico de cabecera</option>
                </select>
              </div>
              {[
                { label: 'Nombre', key: 'nombre', type: 'text' },
                { label: 'Relación/Cargo', key: 'relacion_cargo', type: 'text' },
                { label: 'Teléfono', key: 'telefono', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-500 uppercase">{label}</label>
                  <input type={type} value={formNuevoContacto[key]}
                    onChange={e => setFormNuevoContacto(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              {errorContacto && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{errorContacto}</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setCreandoContacto(false); setErrorContacto('') }} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
                <button onClick={() => mutacionCrearContacto.mutate(formNuevoContacto)} disabled={mutacionCrearContacto.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
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
                <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                  {editandoContacto === c.id ? (
                    <div className="space-y-3">
                      {[
                        { label: 'Nombre', key: 'nombre', type: 'text' },
                        { label: 'Relación/Cargo', key: 'relacion_cargo', type: 'text' },
                        { label: 'Teléfono', key: 'telefono', type: 'text' },
                        { label: 'Email', key: 'email', type: 'email' },
                      ].map(({ label, key, type }) => (
                        <div key={key}>
                          <label className="text-xs font-medium text-gray-500 uppercase">{label}</label>
                          <input type={type} defaultValue={c[key]}
                            onChange={e => setFormContacto(f => ({ ...f, [key]: e.target.value }))}
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setEditandoContacto(null)} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
                        <button onClick={() => mutacionEditarContacto.mutate({ cid: c.id, data: formContacto })} disabled={mutacionEditarContacto.isPending}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
                          {mutacionEditarContacto.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 uppercase">
                          {c.tipo === 'familiar' ? '👨‍👩‍👧 Familiar' : '👨‍⚕️ Médico de cabecera'}
                        </span>
                        {esAdmin && (
                          <button onClick={() => { setEditandoContacto(c.id); setFormContacto({}) }}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium">✏️ Editar</button>
                        )}
                      </div>
                      <p className="font-medium text-gray-700 text-sm">{c.nombre}</p>
                      <p className="text-xs text-gray-400">{c.relacion_cargo}</p>
                      <p className="text-xs text-gray-500 mt-1">📞 {c.telefono}</p>
                      {c.email && <p className="text-xs text-gray-500">✉️ {c.email}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SeccionCard>

        {/* ── Historial médico ── */}
        <SeccionCard titulo="Historial médico" icono="🩺">
          {editandoHistorial ? (
            <div className="space-y-3">
              {[
                { label: 'Diagnósticos', key: 'diagnosticos' },
                { label: 'Alergias', key: 'alergias' },
                { label: 'Condiciones crónicas', key: 'condiciones_cronicas' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-500 uppercase">{label}</label>
                  <textarea rows={2} defaultValue={historial?.[key]}
                    onChange={e => setFormHistorial(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditandoHistorial(false)} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
                <button onClick={() => mutacionHistorial.mutate(formHistorial)} disabled={mutacionHistorial.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
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
                <button onClick={() => setEditandoHistorial(true)} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">✏️ Editar historial</button>
              )}
            </div>
          )}
        </SeccionCard>

        {/* ── Restricciones alimentarias ── */}
        <SeccionCard titulo="Restricciones alimentarias" icono="🥗">
  {esAdmin && (
    <button onClick={() => setModalRestricciones(true)}
      className="mb-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
      Gestionar restricciones
    </button>
  )}
  {residente.restricciones_alimentarias?.length === 0 ? (
    <p className="text-sm text-gray-400">Sin restricciones activas</p>
  ) : (
    <ul className="space-y-2">
      {residente.restricciones_alimentarias?.map((r, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span className={r.severidad === 'obligatorio' ? 'text-red-500' : 'text-yellow-500'}>
            {r.severidad === 'obligatorio' ? '🚫' : '⚠️'}
          </span>
          <span className="text-gray-700">{r.nombre}</span>
          <span className="text-xs text-gray-400">({r.severidad})</span>
        </li>
      ))}
    </ul>
  )}
  <button onClick={() => setModalPlan(true)}
    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium block">
    🍽️ Ver plan nutricional y menús
  </button>
</SeccionCard>

        {/* ── Medicamentos / Prescripciones ── */}
        <SeccionCard titulo="Medicamentos / Prescripciones" icono="💊">
          <div className="flex gap-3 mb-3">
            {esAdmin && (
              <button onClick={() => setModalPrescribir(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                + Prescribir medicamento
              </button>
            )}
            <button onClick={() => setModalHistorialTomas(true)}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium">
              📋 Ver historial de tomas
            </button>
          </div>

          {/* Activas */}
          {prescripciones?.filter(p => p.estado === 'activo').length === 0 ? (
            <p className="text-sm text-gray-400">Sin prescripciones activas</p>
          ) : (
            <div className="space-y-2">
              {prescripciones?.filter(p => p.estado === 'activo').map(p => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800 text-sm">{p.medicamento_nombre}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.via_administracion}</span>
                  </div>
                  <p className="text-xs text-gray-500">Dosis: {p.dosis}</p>
                  <p className="text-xs text-gray-500">Horarios: {p.horarios?.join(', ')}</p>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setModalTomas(p)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">💊 Registrar / ver tomas</button>
                    {esAdmin && (
                      <button onClick={() => mutacionFinalizarPrescripcion.mutate(p.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Finalizar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Finalizadas */}
          {prescripciones?.filter(p => p.estado === 'finalizado').length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Finalizadas</p>
              <div className="space-y-2">
                {prescripciones?.filter(p => p.estado === 'finalizado').map(p => (
                  <div key={p.id} className="bg-gray-50 rounded-xl p-3 opacity-75">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-600 text-sm">{p.medicamento_nombre}</p>
                      <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Finalizada</span>
                    </div>
                    <p className="text-xs text-gray-400">Dosis: {p.dosis} · {p.via_administracion}</p>
                    <p className="text-xs text-gray-400">{p.fecha_inicio} → {p.fecha_fin || 'sin fecha fin'}</p>
                    <button onClick={() => setModalTomas(p)} className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1">📋 Ver tomas</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SeccionCard>

        {/* ── Visitantes autorizados ── */}
        <SeccionCard titulo="Visitantes autorizados" icono="👥">
          {esAdmin && (
            <button onClick={() => setModalAutorizarVisitante(true)} className="mb-3 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Autorizar visitante</button>
          )}
          {visitantesAutorizados?.length === 0 ? (
            <p className="text-sm text-gray-400">Sin visitantes autorizados</p>
          ) : (
            <div className="space-y-2">
              {visitantesAutorizados?.map(a => (
                <div key={a.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">{a.visitante_nombre?.[0]}</div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{a.visitante_nombre}</p>
                      <p className="text-xs text-gray-400">{RELACION_LABEL_RES[a.relacion] || a.relacion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {a.estado === 'activo' ? '✅ Activo' : '🚫 Suspendido'}
                    </span>
                    {esAdmin && a.estado === 'activo' && (
                      <button onClick={() => mutacionSuspenderVisitante.mutate(a.visitante)} className="text-xs text-red-500 hover:text-red-700 font-medium">Suspender</button>
                    )}
                    {esAdmin && a.estado === 'suspendido' && (
                      <button onClick={() => mutacionReactivarVisitante.mutate({ visitanteId: a.visitante, relacion: a.relacion })} className="text-xs text-green-600 hover:text-green-800 font-medium">Reactivar</button>
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