import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const navItems = [
  { path: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { path: '/usuarios', icon: '👤', label: 'Usuarios', soloAdmin: true },
  { path: '/residentes',   icon: '👴', label: 'Residentes' },
  { path: '/medicamentos', icon: '💊', label: 'Medicamentos' },
  { path: '/nutricion',    icon: '🥗', label: 'Nutrición' },
  { path: '/actividades',  icon: '🎯', label: 'Actividades' },
  { path: '/visitantes', icon: '👥', label: 'Visitas' },
  { path: '/auditoria',    icon: '📋', label: 'Auditoría',  soloAdmin: true },
]

export default function MainLayout() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const esAdmin = usuario?.rol === 'administrador'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside className={`
        ${sidebarAbierto ? 'w-64' : 'w-16'}
        bg-blue-950 text-white flex flex-col transition-all duration-300 shrink-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-800">
          <span className="text-2xl shrink-0">🏥</span>
          {sidebarAbierto && (
            <div>
              <p className="font-bold text-sm leading-tight">Asilo Virtual</p>
              <p className="text-blue-300 text-xs">Sistema de Gestión</p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            if (item.soloAdmin && !esAdmin) return null
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-xl mb-1
                  transition-all duration-150 text-sm font-medium
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }
                `}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {sidebarAbierto && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Usuario */}
        <div className="border-t border-blue-800 p-4">
          {sidebarAbierto ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {usuario?.nombre} {usuario?.apellido}
                </p>
                <p className="text-xs text-blue-300 capitalize">{usuario?.rol}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-blue-300 hover:text-white transition text-lg"
                title="Cerrar sesión"
              >
                🚪
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center text-blue-300 hover:text-white transition text-lg"
              title="Cerrar sesión"
            >
              🚪
            </button>
          )}
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="text-gray-500 hover:text-gray-800 transition text-xl"
          >
            ☰
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-BO', {
              weekday: 'long', year: 'numeric',
              month: 'long', day: 'numeric'
            })}
          </span>
        </header>

        {/* Área de contenido — aquí se renderizan las páginas */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}