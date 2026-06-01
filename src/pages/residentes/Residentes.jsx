import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus, Search, CheckCircle2, BedDouble, FolderArchive,
  ChevronRight, ChevronLeft, X, Loader2, Users
} from 'lucide-react'
import { residentesService } from '../../services/residentesService'
import useAuthStore from '../../store/authStore'

const P = {
  warm800: '#7C3D28', warm600: '#A0522D', warm500: '#C87941',
  warm400: '#E8A96A', warm200: '#F7DFC0', warm100: '#FAEEE3', warm50: '#FDF6EE',
  cream200: '#F5EBD8', cream400: '#E8D5BF',
  health600: '#4A7C59', health100: '#E8F5ED',
  alert600: '#D4742A', alert100: '#FFF0E0',
  danger600: '#B94040', danger100: '#FFF0F0',
}

/* ── Badge estado ──────────────────────────────────────────── */
function BadgeEstado({ estado }) {
  const cfg = {
    activo:        { bg: P.health100, color: P.health600, icon: CheckCircle2,  label: 'Activo' },
    hospitalizado: { bg: P.alert100,  color: P.alert600,  icon: BedDouble,     label: 'Hospitalizado' },
    dado_de_alta:  { bg: '#F3F4F6',   color: '#6B7280',   icon: FolderArchive, label: 'Dado de alta' },
  }
  const { bg, color, icon: Icon, label } = cfg[estado] || cfg.dado_de_alta
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '12px', fontWeight: 600,
      padding: '4px 10px', borderRadius: '20px',
      background: bg, color, border: `1px solid ${color}25`,
    }}>
      <Icon size={12} /> {label}
    </span>
  )
}

/* ── Modal crear ───────────────────────────────────────────── */
function ModalCrear({ onClose, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', fecha_nacimiento: '', fecha_ingreso: '' })
  const [error, setError] = useState('')
  const [focus, setFocus] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => residentesService.crear(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al crear residente')),
  })

  const campos = [
    { label: 'Nombre',            key: 'nombre',           type: 'text' },
    { label: 'Apellido completo', key: 'apellido',         type: 'text' },
    { label: 'C.I.',              key: 'dni',              type: 'text' },
    { label: 'Fecha nacimiento',  key: 'fecha_nacimiento', type: 'date' },
    { label: 'Fecha ingreso',     key: 'fecha_ingreso',    type: 'date' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(60,26,10,0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px',
      animation: 'fadeIn 0.18s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '22px',
        boxShadow: '0 24px 64px rgba(60,26,10,0.28)',
        width: '100%', maxWidth: '440px',
        animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '20px 24px', borderBottom: `1px solid ${P.cream400}`,
          background: P.warm50,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #C87941, #E8A96A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserPlus size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: P.warm800, margin: 0, flex: 1 }}>
            Nuevo Residente
          </h2>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '9px', border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = P.cream200; e.currentTarget.style.color = P.warm800 }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {campos.map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: P.warm700 || P.warm600, marginBottom: '6px' }}>
                {label}
              </label>
              <input
                type={type} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                onFocus={() => setFocus(key)} onBlur={() => setFocus(null)}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: `1.5px solid ${focus === key ? P.warm500 : P.cream400}`,
                  borderRadius: '10px', fontSize: '14px', color: P.warm800,
                  background: focus === key ? '#FFFAF5' : P.warm50,
                  outline: 'none', transition: 'all 0.18s ease',
                  boxShadow: focus === key ? `0 0 0 3px ${P.warm200}` : 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          {error && (
            <p style={{ fontSize: '13px', color: P.danger600, background: P.danger100, padding: '10px 12px', borderRadius: '10px', margin: 0 }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: `1px solid ${P.cream400}` }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: '11px',
            border: `1.5px solid ${P.cream400}`, background: 'white',
            color: P.warm600, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = P.warm50}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Cancelar
          </button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} style={{
            flex: 1, padding: '11px', borderRadius: '11px', border: 'none',
            background: mutation.isPending ? '#E8C4A0' : 'linear-gradient(135deg, #A0522D, #C87941)',
            color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            boxShadow: mutation.isPending ? 'none' : '0 4px 14px rgba(160,82,45,0.32)',
            transition: 'all 0.15s',
          }}>
            {mutation.isPending ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Página principal ──────────────────────────────────────── */
export default function Residentes() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [filtros, setFiltros] = useState({ nombre: '', estado: '' })
  const [pagina, setPagina] = useState(1)
  const [modalCrear, setModalCrear] = useState(false)
  const [focusBuscar, setFocusBuscar] = useState(false)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['residentes', filtros, pagina],
    page_size: 100,
    queryFn: () => residentesService.listar({ ...filtros, page: pagina }),
    keepPreviousData: true,
  })

  // Volver a página 1 cuando cambian los filtros
  const actualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
    setPagina(1)
  }

  /* Detección defensiva del formato de paginación.
     - DRF estándar: { count, next, previous, results }
     - Sin paginar:  { results, total } o array directo */
  const lista       = data?.results ?? (Array.isArray(data) ? data : [])
  const totalItems  = data?.count ?? data?.total ?? lista.length
  const tienePaginacion = data?.count != null && (data?.next != null || data?.previous != null || totalItems > lista.length)
  const porPagina   = lista.length > 0 && tienePaginacion ? lista.length : (totalItems || 1)
  const totalPaginas = tienePaginacion ? Math.max(1, Math.ceil(totalItems / (porPagina || 1))) : 1
  const desde = totalItems === 0 ? 0 : (pagina - 1) * (porPagina || lista.length) + 1
  const hasta = Math.min(pagina * (porPagina || lista.length), totalItems)

  const fmtFecha = f => new Date(f).toLocaleDateString('es-BO')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', animation: 'fadeUp 0.4s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: P.warm100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color={P.warm600} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: P.warm800, margin: 0, letterSpacing: '-0.5px' }}>Residentes</h1>
            <p style={{ fontSize: '13px', color: P.warm600, margin: '2px 0 0' }}>
              {totalItems} residente{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {esAdmin && (
          <button onClick={() => setModalCrear(true)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'linear-gradient(135deg, #A0522D, #C87941)',
            color: 'white', padding: '10px 18px', borderRadius: '12px',
            fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(160,82,45,0.32)', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(160,82,45,0.42)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(160,82,45,0.32)' }}
          >
            <UserPlus size={16} /> Nuevo residente
          </button>
        )}
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '14px',
        boxShadow: '0 2px 12px rgba(124,61,40,0.06)', border: `1px solid ${P.cream400}`,
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        animation: 'fadeUp 0.45s ease both',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} color={focusBuscar ? P.warm500 : '#C8A882'}
            style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.18s', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Buscar por nombre o apellido…"
            value={filtros.nombre}
            onChange={e => actualizarFiltro('nombre', e.target.value)}
            onFocus={() => setFocusBuscar(true)} onBlur={() => setFocusBuscar(false)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px',
              border: `1.5px solid ${focusBuscar ? P.warm500 : P.cream400}`,
              borderRadius: '11px', fontSize: '14px', color: P.warm800,
              background: focusBuscar ? '#FFFAF5' : P.warm50,
              outline: 'none', transition: 'all 0.18s ease',
              boxShadow: focusBuscar ? `0 0 0 3px ${P.warm200}` : 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={filtros.estado}
          onChange={e => actualizarFiltro('estado', e.target.value)}
          style={{
            padding: '10px 14px', border: `1.5px solid ${P.cream400}`,
            borderRadius: '11px', fontSize: '14px', color: P.warm800,
            background: P.warm50, outline: 'none', cursor: 'pointer',
            minWidth: '170px',
          }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="hospitalizado">Hospitalizado</option>
          <option value="dado_de_alta">Dado de alta</option>
        </select>
      </div>

      {/* ── Contenido ── */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${P.cream400}`, borderTopColor: P.warm500, animation: 'spin 0.9s linear infinite' }} />
        </div>
      ) : lista.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '18px', border: `1px solid ${P.cream400}`,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <Users size={36} color={P.cream400} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>No se encontraron residentes</p>
        </div>
      ) : (
        <>
          {/* TABLA — escritorio (≥768px) */}
          <div className="resid-tabla" style={{
            background: 'white', borderRadius: '18px', overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(124,61,40,0.07)', border: `1px solid ${P.cream400}`,
            animation: 'fadeUp 0.5s ease both',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: P.warm50, borderBottom: `1px solid ${P.cream400}` }}>
                  {['#', 'Nombre', 'C.I.', 'Fecha ingreso', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 24px', fontSize: '11px', fontWeight: 700, color: P.warm600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < lista.length - 1 ? `1px solid ${P.warm50}` : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = P.warm50}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 700, color: P.warm400, width: '48px' }}>
                      {desde + i}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #F2C896, #E8A96A)',
                          color: P.warm800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '13px',
                        }}>
                          {r.nombre[0]}{r.apellido[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: P.warm800, margin: 0, fontSize: '14px' }}>{r.nombre} {r.apellido}</p>
                          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>ID: {r.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: P.warm600 }}>{r.dni}</td>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: P.warm600 }}>{fmtFecha(r.fecha_ingreso)}</td>
                    <td style={{ padding: '14px 24px' }}><BadgeEstado estado={r.estado} /></td>
                    <td style={{ padding: '14px 24px' }}>
                      <button onClick={() => navigate(`/residentes/${r.id}`)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        color: P.warm600, fontSize: '13px', fontWeight: 600,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = P.warm800}
                      onMouseLeave={e => e.currentTarget.style.color = P.warm600}
                      >
                        Ver ficha <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARDS — móvil (<768px) */}
          <div className="resid-cards" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
            {lista.map((r, i) => (
              <div key={r.id} onClick={() => navigate(`/residentes/${r.id}`)} style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 12px rgba(124,61,40,0.06)', border: `1px solid ${P.cream400}`,
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #F2C896, #E8A96A)',
                    color: P.warm800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '15px',
                  }}>
                    {r.nombre[0]}{r.apellido[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: P.warm800, margin: 0, fontSize: '15px' }}>
                      <span style={{ color: P.warm400, fontWeight: 700, marginRight: '6px' }}>#{desde + i}</span>
                      {r.nombre} {r.apellido}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>C.I. {r.dni}</p>
                  </div>
                  <ChevronRight size={18} color={P.warm400} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${P.warm50}` }}>
                  <BadgeEstado estado={r.estado} />
                  <span style={{ fontSize: '12px', color: P.warm600 }}>Ingreso: {fmtFecha(r.fecha_ingreso)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Paginación ── */}
          {tienePaginacion && totalPaginas > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '12px',
              background: 'white', borderRadius: '14px', padding: '12px 18px',
              border: `1px solid ${P.cream400}`, boxShadow: '0 2px 12px rgba(124,61,40,0.06)',
            }}>
              <span style={{ fontSize: '13px', color: P.warm600 }}>
                Mostrando <strong style={{ color: P.warm800 }}>{desde}–{hasta}</strong> de <strong style={{ color: P.warm800 }}>{totalItems}</strong>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Anterior */}
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina <= 1 || isFetching}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '8px 12px', borderRadius: '10px',
                    border: `1px solid ${P.cream400}`,
                    background: pagina <= 1 ? '#F9F5EF' : 'white',
                    color: pagina <= 1 ? '#C8B8A4' : P.warm600,
                    fontSize: '13px', fontWeight: 600,
                    cursor: pagina <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (pagina > 1) { e.currentTarget.style.background = P.warm100; e.currentTarget.style.borderColor = P.warm400 } }}
                  onMouseLeave={e => { if (pagina > 1) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = P.cream400 } }}
                >
                  <ChevronLeft size={15} /> Anterior
                </button>

                {/* Números de página */}
                <div className="resid-pagenums" style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalPaginas }, (_, idx) => idx + 1)
                    .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
                    .map((n, idx, arr) => (
                      <span key={n} style={{ display: 'flex', alignItems: 'center' }}>
                        {idx > 0 && arr[idx - 1] !== n - 1 && (
                          <span style={{ color: '#C8B8A4', padding: '0 4px', fontSize: '13px' }}>…</span>
                        )}
                        <button
                          onClick={() => setPagina(n)}
                          disabled={isFetching}
                          style={{
                            minWidth: '36px', height: '36px', borderRadius: '10px',
                            border: n === pagina ? 'none' : `1px solid ${P.cream400}`,
                            background: n === pagina ? 'linear-gradient(135deg, #A0522D, #C87941)' : 'white',
                            color: n === pagina ? 'white' : P.warm600,
                            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                            boxShadow: n === pagina ? '0 2px 8px rgba(160,82,45,0.32)' : 'none',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (n !== pagina) e.currentTarget.style.background = P.warm100 }}
                          onMouseLeave={e => { if (n !== pagina) e.currentTarget.style.background = 'white' }}
                        >
                          {n}
                        </button>
                      </span>
                    ))}
                </div>

                {/* Siguiente */}
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas || isFetching}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '8px 12px', borderRadius: '10px',
                    border: `1px solid ${P.cream400}`,
                    background: pagina >= totalPaginas ? '#F9F5EF' : 'white',
                    color: pagina >= totalPaginas ? '#C8B8A4' : P.warm600,
                    fontSize: '13px', fontWeight: 600,
                    cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (pagina < totalPaginas) { e.currentTarget.style.background = P.warm100; e.currentTarget.style.borderColor = P.warm400 } }}
                  onMouseLeave={e => { if (pagina < totalPaginas) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = P.cream400 } }}
                >
                  Siguiente <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalCrear && (
        <ModalCrear onClose={() => setModalCrear(false)} onGuardado={() => queryClient.invalidateQueries(['residentes'])} />
      )}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 767px) {
          .resid-tabla { display: none !important; }
          .resid-cards { display: flex !important; }
          .resid-pagenums { display: none !important; }
        }
      `}</style>
    </div>
  )
}
