import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)

  const enviar = async () => {
  setError('')

  if (password.length < 8) {
    return setError('La contraseña debe tener al menos 8 caracteres.')
  }

  if (password !== confirmar) {
    return setError('Las contraseñas no coinciden.')
  }

  setCargando(true)

  try {
    await api.post('/auth/password-reset/confirmar/', {
      token,
      nueva_password: password,
      confirmar_password: confirmar   // ← Agregar esto
    })

    setExito(true)
    setTimeout(() => navigate('/login'), 2500)
  } catch (err) {
    const detalle = err.response?.data?.detalle || err.response?.data
    setError(detalle?.error || 'El enlace es inválido o expiró. Solicita uno nuevo.')
  } finally {
    setCargando(false)
  }
}
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-600">Enlace inválido o incompleto.</p>
          <Link to="/recuperar" className="block text-sm text-blue-600 hover:text-blue-800 mt-4">Solicitar uno nuevo</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Nueva contraseña</h1>
        <p className="text-sm text-gray-500 mb-6">Ingresa tu nueva contraseña.</p>

        {exito ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            ✅ Contraseña actualizada. Redirigiendo al inicio de sesión...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
            <button onClick={enviar} disabled={cargando}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {cargando ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}