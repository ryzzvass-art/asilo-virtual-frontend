import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserRound, Pill, Salad,
  Activity, CalendarHeart, ClipboardList, LogOut,
  Menu, ChevronLeft, House, MoreHorizontal
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import NotificacionesTomas from "../components/NotificacionesTomas";

const navItems = [
  { path: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/usuarios',     icon: Users,           label: 'Usuarios',    soloAdmin: true },
  { path: '/residentes',   icon: UserRound,       label: 'Residentes' },
  { path: '/medicamentos', icon: Pill,            label: 'Medicamentos' },
  { path: '/nutricion',    icon: Salad,           label: 'Nutrición' },
  { path: '/actividades',  icon: Activity,        label: 'Actividades' },
  { path: '/visitantes',   icon: CalendarHeart,   label: 'Visitas' },
  { path: '/auditoria',    icon: ClipboardList,   label: 'Auditoría',   soloAdmin: true },
]

/* Ítems que van en la barra inferior (móvil). El resto entra en "Más". */
const BOTTOM_MAX = 4

export default function MainLayout() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const [menuMasAbierto, setMenuMasAbierto] = useState(false)
  const esAdmin = usuario?.rol === 'administrador'

  const handleLogout = () => { logout(); navigate('/login') }
  const iniciales = `${usuario?.nombre?.[0] ?? ''}${usuario?.apellido?.[0] ?? ''}`

  const itemsVisibles = navItems.filter(i => !i.soloAdmin || esAdmin)
  const itemsBottom = itemsVisibles.slice(0, BOTTOM_MAX)
  const itemsMas    = itemsVisibles.slice(BOTTOM_MAX)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FDF6EE' }}>

      {/* ── SIDEBAR (escritorio / tablet ≥768px) ───────────── */}
      <aside className="ml-sidebar" style={{
        width: sidebarAbierto ? '260px' : '72px',
        background: 'linear-gradient(160deg, #7C3D28 0%, #5C2810 100%)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 32px rgba(92,40,16,0.22)',
        position: 'relative', flexShrink: 0,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: sidebarAbierto ? '20px 20px 18px' : '20px 0 18px',
          justifyContent: sidebarAbierto ? 'flex-start' : 'center',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <House size={20} color="#FAEEE3" />
          </div>
          <div style={{ overflow: 'hidden', maxWidth: sidebarAbierto ? '180px' : '0', opacity: sidebarAbierto ? 1 : 0, transition: 'max-width 0.3s ease, opacity 0.2s ease', whiteSpace: 'nowrap' }}>
            <p style={{ color: '#FDF6EE', fontWeight: 700, fontSize: '14px', lineHeight: 1.2, margin: 0 }}>Asilo Virtual</p>
            <p style={{ color: '#E8A96A', fontSize: '11px', margin: '2px 0 0', letterSpacing: '0.03em' }}>Sistema de Gestión</p>
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
          {itemsVisibles.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} title={!sidebarAbierto ? item.label : undefined}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: sidebarAbierto ? '10px 12px' : '10px 0',
                  justifyContent: sidebarAbierto ? 'flex-start' : 'center',
                  borderRadius: '10px', marginBottom: '2px',
                  fontSize: '13.5px', fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none', position: 'relative', overflow: 'hidden',
                  transition: 'all 0.18s ease',
                  background: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
                  color: isActive ? '#FDF6EE' : '#F2C896',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.12)' : 'none',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', borderRadius: '0 3px 3px 0', background: isActive ? '#E8A96A' : 'transparent', transition: 'background 0.2s ease' }} />
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: isActive ? 'rgba(232,169,106,0.25)' : 'transparent', transition: 'background 0.2s ease' }}>
                      <Icon size={17} />
                    </span>
                    <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: sidebarAbierto ? '160px' : '0', opacity: sidebarAbierto ? 1 : 0, transition: 'max-width 0.3s ease, opacity 0.2s ease' }}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Colapsar */}
        <button onClick={() => setSidebarAbierto(!sidebarAbierto)} title={sidebarAbierto ? 'Contraer' : 'Expandir'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 10px 10px', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: '#F2C896', cursor: 'pointer', transition: 'background 0.18s ease, color 0.18s ease', gap: '8px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#FDF6EE' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#F2C896' }}
        >
          <ChevronLeft size={16} style={{ transition: 'transform 0.3s ease', transform: sidebarAbierto ? 'rotate(0deg)' : 'rotate(180deg)' }} />
          {sidebarAbierto && <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', maxWidth: sidebarAbierto ? '120px' : '0', opacity: sidebarAbierto ? 1 : 0, transition: 'max-width 0.3s ease, opacity 0.15s ease' }}>Contraer</span>}
        </button>

        {/* Usuario + logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)', padding: '12px 10px' }}>
          {sidebarAbierto ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #C87941, #E8A96A)', color: '#3D1A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.2)' }}>{iniciales}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#FDF6EE', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.nombre} {usuario?.apellido}</p>
                <p style={{ color: '#E8A96A', fontSize: '11px', margin: '1px 0 0', textTransform: 'capitalize' }}>{usuario?.rol}</p>
              </div>
              <button onClick={handleLogout} title="Cerrar sesión" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0, background: 'rgba(185,64,64,0.18)', border: '1px solid rgba(185,64,64,0.35)', color: '#F2A0A0', cursor: 'pointer', transition: 'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,64,64,0.55)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(185,64,64,0.18)'; e.currentTarget.style.color = '#F2A0A0'; e.currentTarget.style.transform = 'scale(1)' }}
              ><LogOut size={15} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #C87941, #E8A96A)', color: '#3D1A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', border: '2px solid rgba(255,255,255,0.2)' }}>{iniciales}</div>
              <button onClick={handleLogout} title="Cerrar sesión" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(185,64,64,0.18)', border: '1px solid rgba(185,64,64,0.35)', color: '#F2A0A0', cursor: 'pointer', transition: 'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,64,64,0.55)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(185,64,64,0.18)'; e.currentTarget.style.color = '#F2A0A0'; e.currentTarget.style.transform = 'scale(1)' }}
              ><LogOut size={16} /></button>
            </div>
          )}
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E8D5BF', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, boxShadow: '0 1px 12px rgba(124,61,40,0.07)' }}>
          {/* Botón expandir (escritorio, sidebar cerrado) */}
          {!sidebarAbierto && (
            <button className="ml-expand-btn" onClick={() => setSidebarAbierto(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px', borderRadius: '8px', background: 'transparent', border: '1px solid #E8D5BF', color: '#A0522D', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <Menu size={18} />
            </button>
          )}

          {/* Logo móvil (solo <768px) */}
          <div className="ml-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #A0522D, #C87941)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <House size={17} color="#FAEEE3" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#7C3D28' }}>Asilo Virtual</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Fecha (se oculta en móvil pequeño) */}
          <div className="ml-fecha" style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#A0522D', fontSize: '13px', background: '#F5EBD8', padding: '6px 12px', borderRadius: '20px', border: '1px solid #E8D5BF' }}>
            <CalendarHeart size={14} color="#C87941" />
            <span style={{ textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <NotificacionesTomas />
        </header>

        {/* Área de contenido */}
        <main className="ml-main" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>

        {/* ── BARRA INFERIOR (móvil <768px) ─────────────── */}
        <nav className="ml-bottombar" style={{
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8D5BF',
          boxShadow: '0 -2px 16px rgba(124,61,40,0.10)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', height: '62px' }}>
            {itemsBottom.map(item => {
              const Icon = item.icon
              return (
                <NavLink key={item.path} to={item.path}
                  style={({ isActive }) => ({
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '3px',
                    textDecoration: 'none', position: 'relative',
                    color: isActive ? '#A0522D' : '#B8956F',
                    transition: 'color 0.18s ease',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span style={{ position: 'absolute', top: 0, width: '28px', height: '3px', borderRadius: '0 0 3px 3px', background: '#C87941' }} />}
                      <Icon size={21} />
                      <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}

            {/* Botón "Más" si hay ítems extra */}
            {itemsMas.length > 0 && (
              <button onClick={() => setMenuMasAbierto(true)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#B8956F' }}>
                <MoreHorizontal size={21} />
                <span style={{ fontSize: '10px', fontWeight: 500 }}>Más</span>
              </button>
            )}
          </div>
        </nav>

        {/* Hoja "Más" (bottom sheet móvil) */}
        {menuMasAbierto && (
          <>
            <div onClick={() => setMenuMasAbierto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(60,26,10,0.45)', backdropFilter: 'blur(2px)', zIndex: 60, animation: 'fadeIn 0.18s ease' }} />
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
              background: 'white', borderRadius: '22px 22px 0 0',
              padding: '12px 16px calc(20px + env(safe-area-inset-bottom, 0))',
              boxShadow: '0 -8px 40px rgba(60,26,10,0.25)',
              animation: 'sheetUp 0.26s cubic-bezier(0.34,1.4,0.64,1)',
            }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '4px', background: '#E8D5BF', margin: '0 auto 14px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {itemsMas.map(item => {
                  const Icon = item.icon
                  return (
                    <NavLink key={item.path} to={item.path} onClick={() => setMenuMasAbierto(false)}
                      style={({ isActive }) => ({
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px',
                        padding: '16px 8px', borderRadius: '14px', textDecoration: 'none',
                        background: isActive ? '#FAEEE3' : '#FDF6EE',
                        border: `1px solid ${isActive ? '#E8A96A' : '#E8D5BF'}`,
                        color: isActive ? '#7C3D28' : '#A0522D',
                      })}
                    >
                      <Icon size={22} />
                      <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>{item.label}</span>
                    </NavLink>
                  )
                })}
                {/* Logout en la hoja */}
                <button onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', padding: '16px 8px', borderRadius: '14px', background: '#FFF0F0', border: '1px solid rgba(185,64,64,0.3)', color: '#B94040', cursor: 'pointer' }}>
                  <LogOut size={22} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Salir</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .nav-item:hover:not(.nav-item-active) { background: rgba(255,255,255,0.10) !important; color: #FDF6EE !important; transform: translateX(2px); }
        .nav-item { transition: all 0.18s ease !important; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes sheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }

        /* ── Responsive móvil ── */
        @media (max-width: 767px) {
          .ml-sidebar     { display: none !important; }
          .ml-expand-btn  { display: none !important; }
          .ml-mobile-logo { display: flex !important; }
          .ml-fecha       { display: none !important; }
          .ml-bottombar   { display: block !important; }
          .ml-main        { padding: 16px 14px 80px !important; }
        }
      `}</style>
    </div>
  )
}
