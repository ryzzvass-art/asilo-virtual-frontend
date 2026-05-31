import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function SolicitarReset() {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async () => {
    setCargando(true); setError(''); setMensaje('')
    try {
      const data = await api.post('/auth/password-reset/solicitar/', { email }).then(r => r.data)
      setMensaje(data.mensaje || 'Si el email está registrado, recibirás un enlace en minutos.')
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Recuperar contraseña</h1>
        <p className="text-sm text-gray-500 mb-6">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>

        {mensaje ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            {mensaje}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
            <button onClick={enviar} disabled={cargando || !email}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {cargando ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </div>
        )}

        <Link to="/login" className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-6">
          ← Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}