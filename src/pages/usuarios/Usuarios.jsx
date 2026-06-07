import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus, X, Crown, Stethoscope, CheckCircle2, Ban,
  ShieldAlert, Users as UsersIcon, Loader2
} from 'lucide-react'
import { usuariosService } from '../../services/usuariosService'
import useAuthStore from '../../store/authStore'

const P = {
  warm800: '#7C3D28', warm700: '#8B4513', warm600: '#A0522D', warm500: '#C87941',
  warm400: '#E8A96A', warm200: '#F7DFC0', warm100: '#FAEEE3', warm50: '#FDF6EE',
  cream200: '#F5EBD8', cream400: '#E8D5BF',
  health600: '#4A7C59', health100: '#E8F5ED',
  danger600: '#B94040', danger100: '#FFF0F0',
  purple600: '#7B5EA7', purple100: '#EFE9F7',
  info600: '#5A7FA8', info100: '#EBF2FA',
}

/* ── Badges ─────────────────────────────────────────────────── */
function BadgeRol({ rol }) {
  const esAdmin = rol === 'administrador'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
      background: esAdmin ? P.purple100 : P.info100,
      color: esAdmin ? P.purple600 : P.info600,
      border: `1px solid ${esAdmin ? P.purple600 : P.info600}25`,
    }}>
      {esAdmin ? <Crown size={12} /> : <Stethoscope size={12} />}
      {esAdmin ? 'Administrador' : 'Cuidador'}
    </span>
  )
}

function BadgeEstado({ estado }) {
  const activo = estado === 'activo'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
      background: activo ? P.health100 : P.danger100,
      color: activo ? P.health600 : P.danger600,
      border: `1px solid ${activo ? P.health600 : P.danger600}25`,
    }}>
      {activo ? <CheckCircle2 size={12} /> : <Ban size={12} />}
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

/* ── Modal crear ────────────────────────────────────────────── */
function ModalCrearUsuario({ onClose, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', rol: 'cuidador', password: '' })
  const [error, setError] = useState('')
  const [focus, setFocus] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => usuariosService.crear(data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => setError(JSON.stringify(err.response?.data?.detalle || 'Error al crear usuario')),
  })

  const inputStyle = (key) => ({
    width: '100%', padding: '10px 12px',
    border: `1.5px solid ${focus === key ? P.warm500 : P.cream400}`,
    borderRadius: '10px', fontSize: '14px', color: P.warm800,
    background: focus === key ? '#FFFAF5' : P.warm50,
    outline: 'none', transition: 'all 0.18s ease',
    boxShadow: focus === key ? `0 0 0 3px ${P.warm200}` : 'none',
    boxSizing: 'border-box',
  })

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(60,26,10,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px',
      animation: 'fadeIn 0.18s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '22px', boxShadow: '0 24px 64px rgba(60,26,10,0.28)',
        width: '100%', maxWidth: '440px', overflow: 'hidden',
        animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', borderBottom: `1px solid ${P.cream400}`, background: P.warm50 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #A0522D, #C87941)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: P.warm800, margin: 0, flex: 1 }}>Nuevo Usuario</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = P.cream200; e.currentTarget.style.color = P.warm800 }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          ><X size={16} /></button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { label: 'Nombre',   key: 'nombre',   type: 'text' },
            { label: 'Apellido', key: 'apellido', type: 'text' },
            { label: 'Email',    key: 'email',    type: 'email' },
            { label: 'Password', key: 'password', type: 'password' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: P.warm700, marginBottom: '6px' }}>{label}</label>
              <input type={type} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                onFocus={() => setFocus(key)} onBlur={() => setFocus(null)}
                style={inputStyle(key)} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: P.warm700, marginBottom: '6px' }}>Rol</label>
            <select value={form.rol}
              onChange={e => setForm({ ...form, rol: e.target.value })}
              onFocus={() => setFocus('rol')} onBlur={() => setFocus(null)}
              style={{ ...inputStyle('rol'), cursor: 'pointer' }}>
              <option value="cuidador">Cuidador</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          {error && (
            <p style={{ fontSize: '13px', color: P.danger600, background: P.danger100, padding: '10px 12px', borderRadius: '10px', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: `1px solid ${P.cream400}` }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: `1.5px solid ${P.cream400}`, background: 'white', color: P.warm600, fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = P.warm50}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >Cancelar</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} style={{
            flex: 1, padding: '11px', borderRadius: '11px', border: 'none',
            background: mutation.isPending ? '#E8C4A0' : 'linear-gradient(135deg, #A0522D, #C87941)',
            color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            boxShadow: mutation.isPending ? 'none' : '0 4px 14px rgba(160,82,45,0.32)', transition: 'all 0.15s',
          }}>
            {mutation.isPending ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Modal editar ───────────────────────────────────────────── */
function ModalEditarUsuario({ usuarioObjetivo, usuarioActual, onClose, onGuardado }) {
  // Reglas de UI derivadas de las del backend:
  const esYoMismo   = usuarioObjetivo.id === usuarioActual?.id
  const esCuidador  = usuarioObjetivo.rol === 'cuidador'
  // El password solo se puede cambiar si te editas a ti mismo.
  const puedeCambiarPassword = esYoMismo
  // El rol solo es editable si NO te estás editando a ti mismo.
  const puedeCambiarRol = !esYoMismo

  const [form, setForm] = useState({
    nombre: usuarioObjetivo.nombre,
    apellido: usuarioObjetivo.apellido,
    email: usuarioObjetivo.email,
    rol: usuarioObjetivo.rol,
    password: '',
  })
  const [error, setError] = useState('')
  const [focus, setFocus] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => usuariosService.editar(usuarioObjetivo.id, data),
    onSuccess: () => { onGuardado(); onClose() },
    onError: (err) => {
      const d = err.response?.data
      setError(typeof d === 'string' ? d : (d?.detail || JSON.stringify(d) || 'Error al editar'))
    },
  })

  const guardar = () => {
    // Armamos solo los campos que este editor tiene permitido enviar.
    const data = { nombre: form.nombre, apellido: form.apellido, email: form.email }
    if (puedeCambiarRol) data.rol = form.rol
    if (puedeCambiarPassword && form.password.trim()) data.password = form.password
    mutation.mutate(data)
  }

  const inputStyle = (key) => ({
    width: '100%', padding: '10px 12px',
    border: `1.5px solid ${focus === key ? P.warm500 : P.cream400}`,
    borderRadius: '10px', fontSize: '14px', color: P.warm800,
    background: focus === key ? '#FFFAF5' : P.warm50,
    outline: 'none', transition: 'all 0.18s ease',
    boxShadow: focus === key ? `0 0 0 3px ${P.warm200}` : 'none',
    boxSizing: 'border-box',
  })

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(60,26,10,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px',
      animation: 'fadeIn 0.18s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '22px', boxShadow: '0 24px 64px rgba(60,26,10,0.28)',
        width: '100%', maxWidth: '440px', overflow: 'hidden',
        animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', borderBottom: `1px solid ${P.cream400}`, background: P.warm50 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #A0522D, #C87941)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: P.warm800, margin: 0, flex: 1 }}>Editar Usuario</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { label: 'Nombre',   key: 'nombre',   type: 'text' },
            { label: 'Apellido', key: 'apellido', type: 'text' },
            { label: 'Email',    key: 'email',    type: 'email' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: P.warm700, marginBottom: '6px' }}>{label}</label>
              <input type={type} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                onFocus={() => setFocus(key)} onBlur={() => setFocus(null)}
                style={inputStyle(key)} />
            </div>
          ))}

          {/* Rol: editable solo si NO es el propio usuario */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: P.warm700, marginBottom: '6px' }}>Rol</label>
            {puedeCambiarRol ? (
              <select value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                onFocus={() => setFocus('rol')} onBlur={() => setFocus(null)}
                style={{ ...inputStyle('rol'), cursor: 'pointer' }}>
                <option value="cuidador">Cuidador</option>
                <option value="administrador">Administrador</option>
              </select>
            ) : (
              <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, padding: '10px 12px', background: P.warm50, borderRadius: '10px' }}>
                {form.rol === 'administrador' ? 'Administrador' : 'Cuidador'} — no puedes cambiar tu propio rol.
              </p>
            )}
          </div>

          {/* Password: solo si te editas a ti mismo */}
          {puedeCambiarPassword ? (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: P.warm700, marginBottom: '6px' }}>
                Nueva contraseña <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(dejar vacío para no cambiarla)</span>
              </label>
              <input type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocus('password')} onBlur={() => setFocus(null)}
                style={inputStyle('password')} placeholder="••••••••" />
            </div>
          ) : esCuidador && (
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              La contraseña de un cuidador solo puede cambiarla el propio cuidador (vía recuperar contraseña).
            </p>
          )}

          {error && (
            <p style={{ fontSize: '13px', color: P.danger600, background: P.danger100, padding: '10px 12px', borderRadius: '10px', margin: 0 }}>{error}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: `1px solid ${P.cream400}` }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: `1.5px solid ${P.cream400}`, background: 'white', color: P.warm600, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={mutation.isPending} style={{
            flex: 1, padding: '11px', borderRadius: '11px', border: 'none',
            background: mutation.isPending ? '#E8C4A0' : 'linear-gradient(135deg, #A0522D, #C87941)',
            color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          }}>
            {mutation.isPending ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Página principal ───────────────────────────────────────── */
export default function Usuarios() {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando] = useState(null)   // ← nuevo: usuario a editar

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosService.listar,
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }) => usuariosService.cambiarEstado(id, estado),
    onSuccess: () => queryClient.invalidateQueries(['usuarios']),
  })

  if (!esAdmin) return (
    <div style={{
      background: P.danger100, border: `1px solid ${P.danger600}40`, borderRadius: '18px',
      padding: '24px', display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <ShieldAlert size={22} color={P.danger600} />
      <p style={{ color: P.danger600, margin: 0, fontSize: '14px', fontWeight: 500 }}>
        No tienes permisos para ver esta sección.
      </p>
    </div>
  )

  const fmtFecha = f => new Date(f).toLocaleDateString('es-BO')

  const puedeEditar = (u) => u.id === usuario?.id || u.rol === 'cuidador'

  const BotonEditar = ({ u }) => (
    puedeEditar(u) && (
      <button
        onClick={() => setEditando(u)}
        style={{
          fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '9px',
          border: `1px solid ${P.warm400}`, cursor: 'pointer', marginRight: '8px',
          background: P.warm50, color: P.warm700, transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = P.warm100}
        onMouseLeave={e => e.currentTarget.style.background = P.warm50}
      >
        Editar
      </button>
    )
  )

  const BotonEstado = ({ u }) => (
    u.id !== usuario?.id && (
      <button
        onClick={() => mutacionEstado.mutate({ id: u.id, estado: u.estado === 'activo' ? 'inactivo' : 'activo' })}
        style={{
          fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '9px',
          border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          background: u.estado === 'activo' ? P.danger100 : P.health100,
          color: u.estado === 'activo' ? P.danger600 : P.health600,
        }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'none'}
      >
        {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
      </button>
    )
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', animation: 'fadeUp 0.4s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: P.warm100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UsersIcon size={22} color={P.warm600} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: P.warm800, margin: 0, letterSpacing: '-0.5px' }}>Usuarios</h1>
            <p style={{ fontSize: '13px', color: P.warm600, margin: '2px 0 0' }}>
              {usuarios?.length ?? 0} usuario{(usuarios?.length ?? 0) !== 1 ? 's' : ''} registrado{(usuarios?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button onClick={() => setModalCrear(true)} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'linear-gradient(135deg, #A0522D, #C87941)', color: 'white',
          padding: '10px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(160,82,45,0.32)', transition: 'all 0.18s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(160,82,45,0.42)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(160,82,45,0.32)' }}
        >
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${P.cream400}`, borderTopColor: P.warm500, animation: 'spin 0.9s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* TABLA — escritorio */}
          <div className="usr-tabla" style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(124,61,40,0.07)', border: `1px solid ${P.cream400}`, animation: 'fadeUp 0.5s ease both' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: P.warm50, borderBottom: `1px solid ${P.cream400}` }}>
                  {['Usuario', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 24px', fontSize: '11px', fontWeight: 700, color: P.warm600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios?.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < usuarios.length - 1 ? `1px solid ${P.warm50}` : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = P.warm50}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                          background: u.rol === 'administrador' ? 'linear-gradient(135deg, #9B7BC4, #7B5EA7)' : 'linear-gradient(135deg, #F2C896, #E8A96A)',
                          color: u.rol === 'administrador' ? 'white' : P.warm800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px',
                        }}>
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: P.warm800, margin: 0, fontSize: '14px' }}>{u.nombre} {u.apellido}</p>
                          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: '14px', color: P.warm600 }}>{u.email}</td>
                    <td style={{ padding: '14px 24px' }}><BadgeRol rol={u.rol} /></td>
                    <td style={{ padding: '14px 24px' }}><BadgeEstado estado={u.estado} /></td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: '#9CA3AF' }}>{fmtFecha(u.created_at)}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <BotonEditar u={u} />
                      <BotonEstado u={u} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARDS — móvil */}
          <div className="usr-cards" style={{ display: 'none', flexDirection: 'column', gap: '12px' }}>
            {usuarios?.map(u => (
              <div key={u.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(124,61,40,0.06)', border: `1px solid ${P.cream400}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                    background: u.rol === 'administrador' ? 'linear-gradient(135deg, #9B7BC4, #7B5EA7)' : 'linear-gradient(135deg, #F2C896, #E8A96A)',
                    color: u.rol === 'administrador' ? 'white' : P.warm800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px',
                  }}>
                    {u.nombre[0]}{u.apellido[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: P.warm800, margin: 0, fontSize: '15px' }}>{u.nombre} {u.apellido}</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: `1px solid ${P.warm50}` }}>
                  <BadgeRol rol={u.rol} />
                  <BadgeEstado estado={u.estado} />
                  <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>{fmtFecha(u.created_at)}</span>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <BotonEditar u={u} />
                  {u.id !== usuario?.id && <BotonEstado u={u} />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalCrear && (
        <ModalCrearUsuario onClose={() => setModalCrear(false)} onGuardado={() => queryClient.invalidateQueries(['usuarios'])} />
      )}

      {editando && (
        <ModalEditarUsuario
          usuarioObjetivo={editando}
          usuarioActual={usuario}
          onClose={() => setEditando(null)}
          onGuardado={() => queryClient.invalidateQueries(['usuarios'])}
        />
      )}

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 767px) {
          .usr-tabla { display: none !important; }
          .usr-cards { display: flex !important; }
        }
      `}</style>
    </div>
  )
}