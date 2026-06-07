import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Pill, Plus, X, Search, Package, Boxes, Pencil, Archive,
  CheckCircle2, FolderArchive, AlertTriangle, Clock, Loader2, History
} from 'lucide-react'
import { medicamentosService } from '../../services/medicamentosService'
import useAuthStore from '../../store/authStore'
import ModalHistorialStock from './ModalHistorialStock'

// ── Helpers ────────────────────────────────────────────────
function diasParaVencer(fecha) {
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24))
}

const OPCIONES_PRINCIPIO = ['Paracetamol', 'Ibuprofeno', 'Amoxicilina', 'Propranolol', 'Metformina', 'Losartán', 'Omeprazol', 'Atorvastatina', 'Salbutamol', 'Enalapril']
const OPCIONES_TIPO = ['Analgésico', 'Antibiótico', 'Antiinflamatorio', 'Betabloqueante', 'Antidiabético', 'Antihipertensivo', 'Antiácido', 'Broncodilatador', 'Estatina']
const OPCIONES_FORMA = ['Comprimido', 'Tableta', 'Cápsula', 'Jarabe', 'Ampolla', 'Inyectable', 'Sobre', 'Gotas', 'Crema', 'Supositorio']

const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
const inputClsMt = inputCls + " mt-1"
const inputDisabled = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-cream-200 text-warm-500 cursor-not-allowed"
const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

function BadgeEstado({ estado }) {
  const activo = estado === 'activo'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border
      ${activo ? 'bg-health-100 text-health-600 border-health-600/20' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
      {activo ? <CheckCircle2 size={12} /> : <FolderArchive size={12} />}
      {activo ? 'Activo' : 'Archivado'}
    </span>
  )
}

// ── Campo select con opción "Otro" ─────────────────────────
function CampoSelectOtro({ label, valor, opciones, onChange, placeholder, disabled }) {
  const enLista = opciones.includes(valor)
  const [modoOtro, setModoOtro] = useState(!!valor && !enLista)

  if (disabled) {
    return (
      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1.5">{label}</label>
        <input type="text" value={valor} readOnly disabled className={inputDisabled} />
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-warm-700 mb-1.5">{label}</label>
      <select
        value={modoOtro ? 'otro' : valor}
        onChange={e => {
          if (e.target.value === 'otro') {
            setModoOtro(true)
            onChange('')
          } else {
            setModoOtro(false)
            onChange(e.target.value)
          }
        }}
        className={inputCls + ' cursor-pointer'}>
        <option value="">Seleccionar…</option>
        {opciones.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="otro">Otro…</option>
      </select>
      {modoOtro && (
        <input type="text" value={valor} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className={inputClsMt} />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL CREAR / EDITAR MEDICAMENTO
// ════════════════════════════════════════════════════════════
function ModalMedicamento({ medicamento, onClose, onGuardado }) {
  const esEdicion = !!medicamento
  const archivado = medicamento?.estado === 'archivado'  // Corrección 1

  const [form, setForm] = useState({
    nombre_comercial:   medicamento?.nombre_comercial   || '',
    principio_activo:   medicamento?.principio_activo    || '',
    tipo:               medicamento?.tipo                || '',
    forma_farmaceutica: medicamento?.forma_farmaceutica  || '',
    contraindicaciones: medicamento?.contraindicaciones  || '',
    observaciones:      medicamento?.observaciones       || '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => {
      // Corrección 1: si está archivado, solo se envían las observaciones
      const payload = archivado ? { observaciones: data.observaciones } : data
      return esEdicion
        ? medicamentosService.editar(medicamento.id, payload)
        : medicamentosService.crear(payload)
    },
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => {
      const data = err.response?.data
      setError(
        data?.error ||
        data?.nombre_comercial?.[0] ||
        data?.principio_activo?.[0] ||
        data?.tipo?.[0] ||
        data?.forma_farmaceutica?.[0] ||
        (typeof data === 'string' ? data : 'Error al guardar')
      )
    },
  })

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Pill size={20} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-warm-800 flex-1">
            {esEdicion ? 'Editar medicamento' : 'Nuevo medicamento'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Aviso si está archivado */}
          {archivado && (
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 text-sm text-gray-600 flex items-center gap-2">
              <FolderArchive size={15} className="shrink-0" />
              Medicamento archivado: solo se pueden editar las observaciones.
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Nombre comercial</label>
            <input type="text" value={form.nombre_comercial} placeholder="Ej: Inderal"
              readOnly={archivado} disabled={archivado}
              onChange={e => setForm({ ...form, nombre_comercial: e.target.value })}
              className={archivado ? inputDisabled : inputCls} />
          </div>

          <CampoSelectOtro
            label="Principio activo"
            valor={form.principio_activo}
            opciones={OPCIONES_PRINCIPIO}
            placeholder="Especifica el principio activo"
            disabled={archivado}
            onChange={v => setForm({ ...form, principio_activo: v })}
          />
          <CampoSelectOtro
            label="Tipo / Categoría"
            valor={form.tipo}
            opciones={OPCIONES_TIPO}
            placeholder="Especifica la categoría"
            disabled={archivado}
            onChange={v => setForm({ ...form, tipo: v })}
          />
          <CampoSelectOtro
            label="Forma farmacéutica"
            valor={form.forma_farmaceutica}
            opciones={OPCIONES_FORMA}
            placeholder="Especifica la forma"
            disabled={archivado}
            onChange={v => setForm({ ...form, forma_farmaceutica: v })}
          />
          {esEdicion && !archivado && (
            <p className="text-[11px] text-warm-400 -mt-2">
              Al cambiar la forma farmacéutica, la unidad de todos los lotes se actualiza automáticamente.
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Contraindicaciones</label>
            <textarea rows={3} value={form.contraindicaciones}
              readOnly={archivado} disabled={archivado}
              placeholder="Ej: Asma bronquial, broncoespasmo..."
              onChange={e => setForm({ ...form, contraindicaciones: e.target.value })}
              className={archivado ? inputDisabled : inputCls} />
          </div>

          {/* Observaciones: SIEMPRE editable (corrección 1) */}
          <div>
            <label className="block text-sm font-semibold text-warm-700 mb-1.5">Observaciones</label>
            <textarea rows={2} value={form.observaciones}
              placeholder="Notas internas sobre el medicamento"
              onChange={e => setForm({ ...form, observaciones: e.target.value })}
              className={inputCls} />
          </div>

          {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-cream-400 sticky bottom-0 bg-white">
          <button onClick={onClose} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className={`flex-1 ${btnPrimario}`}>
            {mutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MODAL GESTIÓN DE STOCK (lotes)
// ════════════════════════════════════════════════════════════
function ModalStock({ medicamento, onClose }) {
  const queryClient = useQueryClient()
  const esAdmin = useAuthStore(s => s.usuario)?.rol === 'administrador'
  const archivado = medicamento.estado === 'archivado'

  const [agregando, setAgregando] = useState(false)
  const [editandoLote, setEditandoLote] = useState(null)
  const [formEdit, setFormEdit] = useState({ cantidad: '', fecha_vencimiento: '', umbral_minimo: '', lote: '', observaciones: '' })

  const unidadFija = medicamento.forma_farmaceutica || ''

  const [form, setForm] = useState({
    cantidad: '',
    fecha_vencimiento: '',
    umbral_minimo: '',
    lote: '',
    observaciones: '',
  })
  const [error, setError] = useState('')

  const { data: lotes, isLoading } = useQuery({
    queryKey: ['stock', medicamento.id],
    queryFn: () => medicamentosService.listarStock(medicamento.id),
  })

  const mutAgregar = useMutation({
    mutationFn: (data) => medicamentosService.agregarLote(medicamento.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock', medicamento.id])
      queryClient.invalidateQueries(['alertas-stock'])
      queryClient.invalidateQueries(['movimientos', medicamento.id])
      setAgregando(false)
      setForm({ cantidad: '', fecha_vencimiento: '', umbral_minimo: '', lote: '', observaciones: '' })
      setError('')
    },
    onError: (err) => {
      const data = err.response?.data
      const msg = data?.error || data?.fecha_vencimiento?.[0] || data?.cantidad?.[0] || data?.non_field_errors?.[0] || 'Error al agregar lote'
      setError(msg)
    },
  })

  const mutEditar = useMutation({
    mutationFn: ({ loteId, data }) =>
      medicamentosService.actualizarLote(medicamento.id, loteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock', medicamento.id])
      queryClient.invalidateQueries(['alertas-stock'])
      queryClient.invalidateQueries(['movimientos', medicamento.id])
      setEditandoLote(null)
      setError('')
    },
    onError: (err) => {
      const data = err.response?.data
      setError(
        data?.error ||
        data?.cantidad?.[0] ||
        data?.fecha_vencimiento?.[0] ||
        data?.umbral_minimo?.[0] ||
        'Error al editar el lote'
      )
    },
  })

  const abrirEdicion = (lote) => {
    setError('')
    setEditandoLote(lote.id)
    setFormEdit({
      cantidad: String(lote.cantidad),
      fecha_vencimiento: lote.fecha_vencimiento,
      umbral_minimo: String(lote.umbral_minimo),
      lote: lote.lote,
      observaciones: lote.observaciones || '',
    })
  }

  const guardarEdicion = (loteId) => {
    if (archivado) {
      mutEditar.mutate({ loteId, data: { observaciones: formEdit.observaciones } })
      return
    }
    mutEditar.mutate({
      loteId,
      data: {
        cantidad: Number(formEdit.cantidad),
        fecha_vencimiento: formEdit.fecha_vencimiento,
        umbral_minimo: Number(formEdit.umbral_minimo),
        lote: formEdit.lote,
        observaciones: formEdit.observaciones,
      },
    })
  }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <Boxes size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Stock por lotes</h2>
            <p className="text-sm text-warm-500">{medicamento.nombre_comercial} · unidad: {unidadFija || '—'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {archivado && (
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 text-sm text-gray-600 flex items-center gap-2">
              <FolderArchive size={15} className="shrink-0" />
              Medicamento archivado: solo se pueden editar las observaciones de cada lote.
            </div>
          )}

          {esAdmin && !archivado && !agregando && (
            <button onClick={() => setAgregando(true)}
              className="text-sm text-warm-600 hover:text-warm-800 font-semibold inline-flex items-center gap-1 transition">
              <Plus size={14} /> Agregar lote
            </button>
          )}

          {agregando && (
            <div className="bg-warm-50 border border-cream-400 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-warm-500 uppercase">Cantidad</label>
                  <input type="number" min="1" value={form.cantidad}
                    onChange={e => setForm({ ...form, cantidad: e.target.value })} className={inputClsMt} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-warm-500 uppercase">Unidad</label>
                  <input type="text" value={unidadFija} readOnly disabled
                    className={inputClsMt + ' bg-cream-200 text-warm-500 cursor-not-allowed'} />
                  <p className="text-[11px] text-warm-400 mt-1">Definida por la forma farmacéutica.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-warm-500 uppercase">Vencimiento</label>
                  <input type="date" value={form.fecha_vencimiento}
                    onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} className={inputClsMt} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-warm-500 uppercase">Umbral mínimo</label>
                  <input type="number" value={form.umbral_minimo}
                    onChange={e => setForm({ ...form, umbral_minimo: e.target.value })} className={inputClsMt} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-warm-500 uppercase">Número de lote</label>
                <input type="text" value={form.lote} placeholder="Ej: LOTE-2026-001"
                  onChange={e => setForm({ ...form, lote: e.target.value })} className={inputClsMt} />
              </div>
              <div>
                <label className="text-xs font-semibold text-warm-500 uppercase">Observaciones</label>
                <textarea rows={2} value={form.observaciones} placeholder="Opcional"
                  onChange={e => setForm({ ...form, observaciones: e.target.value })} className={inputClsMt} />
              </div>
              {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setAgregando(false); setError('') }} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
                <button onClick={() => mutAgregar.mutate(form)} disabled={mutAgregar.isPending} className={`flex-1 ${btnPrimario}`}>
                  {mutAgregar.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Agregar'}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-warm-500 text-center py-6">Cargando lotes...</p>
          ) : lotes?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin lotes registrados</p>
          ) : (
            <div className="space-y-2">
              {lotes?.map(lote => {
                const dias = diasParaVencer(lote.fecha_vencimiento)
                const stockBajo = lote.cantidad <= lote.umbral_minimo
                const porVencer = dias <= 30
                const puedeEditarTodo = esAdmin && !archivado && !lote.tiene_administraciones
                const puedeEditarObs = archivado
                const mostrarEditar = puedeEditarTodo || puedeEditarObs

                return (
                  <div key={lote.id} className="border border-cream-400 rounded-xl p-3 bg-white">
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <span className="font-semibold text-warm-800 text-sm inline-flex items-center gap-1.5">
                        <Package size={14} className="text-warm-500" /> {lote.lote}
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {stockBajo && <span className="text-xs bg-danger-100 text-danger-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><AlertTriangle size={11} /> Stock bajo</span>}
                        {porVencer && <span className="text-xs bg-alert-100 text-alert-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Clock size={11} /> Por vencer</span>}
                      </div>
                    </div>

                    {editandoLote === lote.id ? (
                      <div className="mt-2 pt-3 border-t border-cream-200 space-y-3">
                        {!archivado && (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-warm-500 uppercase">Cantidad</label>
                                <input type="number" min="1" value={formEdit.cantidad}
                                  onChange={e => setFormEdit({ ...formEdit, cantidad: e.target.value })} className={inputClsMt} />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-warm-500 uppercase">Unidad</label>
                                <input type="text" value={unidadFija} readOnly disabled
                                  className={inputClsMt + ' bg-cream-200 text-warm-500 cursor-not-allowed'} />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-warm-500 uppercase">Vencimiento</label>
                                <input type="date" value={formEdit.fecha_vencimiento}
                                  onChange={e => setFormEdit({ ...formEdit, fecha_vencimiento: e.target.value })} className={inputClsMt} />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-warm-500 uppercase">Umbral mínimo</label>
                                <input type="number" value={formEdit.umbral_minimo}
                                  onChange={e => setFormEdit({ ...formEdit, umbral_minimo: e.target.value })} className={inputClsMt} />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-warm-500 uppercase">Número de lote</label>
                              <input type="text" value={formEdit.lote}
                                onChange={e => setFormEdit({ ...formEdit, lote: e.target.value })} className={inputClsMt} />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="text-xs font-semibold text-warm-500 uppercase">Observaciones</label>
                          <textarea rows={2} value={formEdit.observaciones} placeholder="Opcional"
                            onChange={e => setFormEdit({ ...formEdit, observaciones: e.target.value })} className={inputClsMt} />
                        </div>
                        {error && <p className="text-danger-600 text-sm bg-danger-100 p-3 rounded-xl">{error}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => { setEditandoLote(null); setError('') }} className={`flex-1 ${btnSecundario}`}>Cancelar</button>
                          <button onClick={() => guardarEdicion(lote.id)} disabled={mutEditar.isPending} className={`flex-1 ${btnPrimario}`}>
                            {mutEditar.isPending ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : 'Guardar cambios'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-xs text-warm-600">
                          <div><span className="text-warm-400">Cantidad:</span> {lote.cantidad} {lote.unidad}</div>
                          <div><span className="text-warm-400">Umbral:</span> {lote.umbral_minimo}</div>
                          <div><span className="text-warm-400">Vence:</span> {lote.fecha_vencimiento}</div>
                        </div>
                        {lote.observaciones && (
                          <p className="text-xs text-warm-500 mt-1.5 italic">Obs: {lote.observaciones}</p>
                        )}

                        {mostrarEditar ? (
                          <button
                            onClick={() => abrirEdicion(lote)}
                            className="text-xs font-semibold text-warm-600 hover:text-warm-800 mt-2 inline-flex items-center gap-1">
                            <Pencil size={12} /> {archivado ? 'Editar observaciones' : 'Editar lote'}
                          </button>
                        ) : esAdmin && lote.tiene_administraciones ? (
                          <p className="text-[11px] text-warm-400 mt-2 italic">No editable: ya tiene medicamentos administrados.</p>
                        ) : null}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Medicamentos() {
  const queryClient = useQueryClient()
  const esAdmin = useAuthStore(s => s.usuario)?.rol === 'administrador'

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('activo')
  const [modalMed, setModalMed] = useState(null)
  const [modalStock, setModalStock] = useState(null)
  const [modalHistorial, setModalHistorial] = useState(null)

  const { data: medicamentos, isLoading } = useQuery({
    queryKey: ['medicamentos'],
    queryFn: () => medicamentosService.listar({ incluir_archivados: true }),
  })

  const { data: alertas } = useQuery({
    queryKey: ['alertas-stock'],
    queryFn: () => medicamentosService.alertasStock(),
  })

  const mutArchivar = useMutation({
    mutationFn: (id) => medicamentosService.archivar(id),
    onSuccess: () => queryClient.invalidateQueries(['medicamentos']),
  })

  // El orden viene del backend (-updated_at). Aquí solo búsqueda + filtro de estado.
  const filtrados = medicamentos
    ?.filter(m => {
      if (filtroEstado === 'activo' && m.estado !== 'activo') return false
      if (filtroEstado === 'archivado' && m.estado !== 'archivado') return false  // Corrección 2
      if (!busqueda) return true
      return (
        m.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.principio_activo.toLowerCase().includes(busqueda.toLowerCase())
      )
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ animation: 'fadeUp 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-warm-100 flex items-center justify-center">
            <Pill size={22} className="text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-warm-800 tracking-tight">Medicamentos</h1>
            <p className="text-warm-600 text-sm">Catálogo y control de stock</p>
          </div>
        </div>
        {esAdmin && (
          <button onClick={() => setModalMed({})}
            className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <Plus size={16} /> Nuevo medicamento
          </button>
        )}
      </div>

      {/* Alertas de stock */}
      {alertas?.length > 0 && (
        <div className="bg-alert-100 border border-alert-600/25 rounded-2xl p-4" style={{ animation: 'fadeUp 0.45s ease both' }}>
          <h3 className="font-bold text-alert-600 mb-2 flex items-center gap-2">
            <AlertTriangle size={17} /> {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} de stock
          </h3>
          <div className="space-y-1">
            {alertas.map((a, i) => (
              <p key={i} className="text-sm text-alert-600/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-alert-600 shrink-0" />
                {a.medicamento_nombre || a.lote} — {a.tipo === 'stock_bajo' ? 'Stock bajo' : 'Vencimiento próximo'}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Buscador y filtro */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400 flex gap-3 flex-wrap" style={{ animation: 'fadeUp 0.5s ease both' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
          <input type="text" placeholder="Buscar por nombre o principio activo..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className={`${inputCls} pl-10`} />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className={`${inputCls} cursor-pointer min-w-40 flex-none`}>
          <option value="activo">Solo activos</option>
          <option value="archivado">Solo archivados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabla / Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* TABLA escritorio */}
          <div className="med-tabla bg-white rounded-2xl shadow-sm border border-cream-400 overflow-hidden" style={{ animation: 'fadeUp 0.55s ease both' }}>
            <table className="w-full">
              <thead>
                <tr className="bg-warm-50 border-b border-cream-400">
                  {['Medicamento', 'Principio activo', 'Forma', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-warm-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados?.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">No hay medicamentos</td></tr>
                ) : (
                  filtrados?.map((m, i) => (
                    <tr key={m.id} className={`hover:bg-warm-50 transition ${i < filtrados.length - 1 ? 'border-b border-warm-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                            <Pill size={16} className="text-warm-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-warm-800">{m.nombre_comercial}</p>
                            <p className="text-xs text-warm-400">{m.tipo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-warm-600">{m.principio_activo}</td>
                      <td className="px-6 py-4 text-sm text-warm-600">{m.forma_farmaceutica}</td>
                      <td className="px-6 py-4"><BadgeEstado estado={m.estado} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setModalStock(m)}
                            className="text-warm-600 hover:text-warm-800 text-sm font-semibold inline-flex items-center gap-1 transition">
                            <Boxes size={14} /> Stock
                          </button>
                          <button onClick={() => setModalHistorial(m)}
                            className="text-warm-500 hover:text-warm-700 text-sm font-semibold inline-flex items-center gap-1 transition">
                            <History size={13} /> Historial
                          </button>
                          {esAdmin && (
                            <>
                              <button onClick={() => setModalMed(m)}
                                className="text-warm-500 hover:text-warm-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Pencil size={13} /> Editar</button>
                              {m.estado === 'activo' && (
                                <button onClick={() => mutArchivar.mutate(m.id)}
                                  className="text-danger-600 hover:text-danger-700 text-sm font-semibold inline-flex items-center gap-1 transition"><Archive size={13} /> Archivar</button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS móvil */}
          <div className="med-cards hidden flex-col gap-3">
            {filtrados?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-cream-400 p-8 text-center text-gray-400 text-sm">No hay medicamentos</div>
            ) : (
              filtrados?.map(m => (
                <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-cream-400">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                      <Pill size={20} className="text-warm-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-warm-800">{m.nombre_comercial}</p>
                      <p className="text-xs text-warm-400">{m.tipo} · {m.forma_farmaceutica}</p>
                    </div>
                    <BadgeEstado estado={m.estado} />
                  </div>
                  <p className="text-sm text-warm-600 mb-3"><span className="text-warm-400">Principio activo:</span> {m.principio_activo}</p>
                  <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-warm-50">
                    <button onClick={() => setModalStock(m)} className="text-warm-600 text-sm font-semibold inline-flex items-center gap-1"><Boxes size={14} /> Stock</button>
                    <button onClick={() => setModalHistorial(m)} className="text-warm-500 text-sm font-semibold inline-flex items-center gap-1"><History size={13} /> Historial</button>
                    {esAdmin && (
                      <>
                        <button onClick={() => setModalMed(m)} className="text-warm-500 text-sm font-semibold inline-flex items-center gap-1"><Pencil size={13} /> Editar</button>
                        {m.estado === 'activo' && (
                          <button onClick={() => mutArchivar.mutate(m.id)} className="text-danger-600 text-sm font-semibold inline-flex items-center gap-1 ml-auto"><Archive size={13} /> Archivar</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modales */}
      {modalMed !== null && (
        <ModalMedicamento
          medicamento={modalMed.id ? modalMed : null}
          onClose={() => setModalMed(null)}
          onGuardado={() => queryClient.invalidateQueries(['medicamentos'])}
        />
      )}
      {modalStock && (
        <ModalStock medicamento={modalStock} onClose={() => setModalStock(null)} />
      )}
      {modalHistorial && (
        <ModalHistorialStock medicamento={modalHistorial} onClose={() => setModalHistorial(null)} />
      )}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 767px) {
          .med-tabla { display: none !important; }
          .med-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
