import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Login from './pages/auth/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Residentes from './pages/residentes/Residentes'
import ResidenteDetalle from './pages/residentes/ResidenteDetalle'
import Usuarios from './pages/usuarios/Usuarios'
import Actividades from './pages/actividades/Actividades'
import ActividadDetalle from './pages/actividades/ActividadDetalle'
import Visitas from './pages/visitantes/Visitantes'
import Medicamentos from './pages/medicamentos/Medicamentos'
import Nutricion from './pages/nutricion/Nutricion'
import Auditoria from './pages/auditoria/Auditoria'
import SolicitarReset from './pages/auth/SolicitarReset'
import ResetPassword from './pages/auth/ResetPassword'



function RutaProtegida({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<SolicitarReset />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rutas protegidas con el layout principal */}
        <Route path="/" element={
          <RutaProtegida>
            <MainLayout />
          </RutaProtegida>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="residentes" element={<Residentes />} />
          <Route path="residentes/:id" element={<ResidenteDetalle />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="actividades" element={<Actividades />} />
          <Route path="actividades/:id" element={<ActividadDetalle />} />
          <Route path="visitantes" element={<Visitas />} />
          <Route path="medicamentos" element={<Medicamentos />} />
          <Route path="nutricion" element={<Nutricion />} />
          <Route path="auditoria" element={<Auditoria />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}