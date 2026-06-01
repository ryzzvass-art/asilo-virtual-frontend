import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, House, AlertCircle, Loader2 } from 'lucide-react'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'

/* ─── Canvas: brisa + hojas sobre el gif ───────────────────── */
function WindCanvas() {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const stateRef  = useRef({
    leaves: [], wind: [], time: 0,
    nextLeaf: 0, nextWind: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const rand = (a, b) => a + Math.random() * (b - a)
    const lerp = (a, b, t) => a + (b - a) * t

    /* Hoja — colores que armonizan con beige/marrón del gif */
    const LEAF_COLORS = [
      '#A0522D', '#C87941', '#8B6340', '#D4A065',
      '#7C5230', '#B8860B', '#CD853F', '#A0784A',
    ]

    function spawnLeaf(W, H) {
      return {
        x:     rand(-20, W + 20),
        y:     rand(-30, H * 0.4),
        vx:    rand(0.7, 1.7),
        vy:    rand(0.2, 0.65),
        angle: rand(0, Math.PI * 2),
        spin:  rand(-0.02, 0.02),
        size:  rand(6, 13),
        color: LEAF_COLORS[Math.floor(rand(0, LEAF_COLORS.length))],
        wobble:      rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.010, 0.022),
        life: 0,
        maxLife: rand(180, 340),
        opacity: 0,
      }
    }

    function spawnWind(W, H) {
      return {
        x:       -80,
        y:       rand(H * 0.05, H * 0.85),
        vx:      rand(3.3, 6.0),
        vy:      rand(-0.25, 0.25),
        length:  rand(40, 100),
        life: 0,
        maxLife: rand(50, 100),
        opacity: 0,
        thickness: rand(0.8, 2.0),
      }
    }

    function drawLeaf(ctx, leaf) {
      ctx.save()
      ctx.globalAlpha = leaf.opacity
      ctx.translate(leaf.x, leaf.y)
      ctx.rotate(leaf.angle)
      ctx.fillStyle = leaf.color
      const s = leaf.size
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.quadraticCurveTo( s * 0.85, -s * 0.25,  s * 0.45,  s * 0.55)
      ctx.quadraticCurveTo( 0,          s * 0.2,  -s * 0.45,  s * 0.55)
      ctx.quadraticCurveTo(-s * 0.85, -s * 0.25,  0,         -s)
      ctx.fill()
      // nervio
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.65)
      ctx.lineTo(0,  s * 0.4)
      ctx.stroke()
      ctx.restore()
    }

    function loop() {
      const S = stateRef.current
      const W = canvas.width
      const H = canvas.height
      S.time++

      ctx.clearRect(0, 0, W, H)

      /* ── Spawnear viento ── */
      if (S.time > S.nextWind) {
        // ráfaga: 3-5 líneas juntas
        const burst = Math.floor(rand(3, 6))
        for (let i = 0; i < burst; i++) {
          const w = spawnWind(W, H)
          w.y += rand(-18, 18)
          w.x  = -rand(0, 60)
          S.wind.push(w)
        }
        S.nextWind = S.time + rand(18, 45)
      }

      /* ── Dibujar viento ── */
      S.wind = S.wind.filter(p => {
        p.life++
        p.x += p.vx
        p.y += p.vy + Math.sin(p.life * 0.1) * 0.4

        const prog = p.life / p.maxLife
        p.opacity = prog < 0.15
          ? lerp(0, 0.22, prog / 0.15)
          : lerp(0.22, 0, (prog - 0.15) / 0.85)

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.strokeStyle = '#8B6340'
        ctx.lineWidth   = p.thickness
        ctx.lineCap     = 'round'
        // línea principal curva
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.quadraticCurveTo(
          p.x - p.length * 0.5, p.y + rand(-3, 3),
          p.x - p.length,        p.y + 3
        )
        ctx.stroke()
        // línea secundaria más fina
        ctx.globalAlpha = p.opacity * 0.4
        ctx.lineWidth   = p.thickness * 0.6
        ctx.beginPath()
        ctx.moveTo(p.x - 8,  p.y + 8)
        ctx.lineTo(p.x - p.length * 0.65, p.y + 11)
        ctx.stroke()
        ctx.restore()

        return p.x > -p.length - 20 && p.life < p.maxLife
      })

      /* ── Spawnear hojas ── */
      if (S.time > S.nextLeaf) {
        S.leaves.push(spawnLeaf(W, H))
        S.nextLeaf = S.time + rand(6, 18)
      }

      /* ── Dibujar hojas ── */
      S.leaves = S.leaves.filter(leaf => {
        leaf.life++
        leaf.wobble += leaf.wobbleSpeed
        leaf.x += leaf.vx + Math.sin(leaf.wobble) * 0.42
        leaf.y += leaf.vy + Math.cos(leaf.wobble * 0.7) * 0.16
        leaf.angle += leaf.spin

        const prog = leaf.life / leaf.maxLife
        leaf.opacity = prog < 0.1
          ? lerp(0, 0.92, prog / 0.1)
          : prog > 0.82
            ? lerp(0.92, 0, (prog - 0.82) / 0.18)
            : 0.92

        drawLeaf(ctx, leaf)
        return leaf.y < H + 30 && leaf.life < leaf.maxLife
      })

      /* ── Pájaros ocasionales (armonizan con el gif) ── */
      if (S.time % 380 === 0) {
        S.birdX = -30
        S.birdY = rand(H * 0.08, H * 0.28)
        S.birdPhase = 0
      }
      if (S.birdX !== undefined && S.birdX < W + 40) {
        S.birdX += 2.5
        S.birdPhase = (S.birdPhase || 0) + 0.12
        const by = S.birdY + Math.sin(S.birdPhase) * 3
        ctx.save()
        ctx.strokeStyle = 'rgba(60,40,20,0.55)'
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        // pájaro simple — dos arcos (como en el gif)
        ctx.beginPath()
        ctx.moveTo(S.birdX - 8, by)
        ctx.quadraticCurveTo(S.birdX - 4, by - 5, S.birdX, by)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(S.birdX, by)
        ctx.quadraticCurveTo(S.birdX + 4, by - 5, S.birdX + 8, by)
        ctx.stroke()
        ctx.restore()
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  )
}

/* ─── Panel izquierdo ───────────────────────────────────────── */
function ScenePanel() {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      position: 'relative',
      overflow: 'hidden',
      /* Fondo beige exacto del gif */
      background: '#C4B5A5',
    }}>

      {/* GIF de abuelitos — ocupa todo el panel */}
      <img
        src="/abuelitos_login.gif"
        alt="Abuelitos mirando el horizonte"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center bottom',
          zIndex: 1,
        }}
      />

      {/* Canvas de brisa + hojas encima del gif */}
      <WindCanvas />

      {/* Badge marca — encima de todo */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px',
        zIndex: 3,
        background: 'rgba(253,246,238,0.82)',
        backdropFilter: 'blur(8px)',
        borderRadius: '20px',
        padding: '7px 14px',
        display: 'flex', alignItems: 'center', gap: '6px',
        border: '1px solid rgba(160,82,45,0.25)',
        boxShadow: '0 2px 12px rgba(80,40,10,0.14)',
      }}>
        <House size={13} color="#C87941" />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3D28' }}>
          Asilo Virtual
        </span>
      </div>

      {/* Texto inferior con gradiente sobre el gif */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 3,
        background: 'linear-gradient(transparent, rgba(60,35,15,0.68))',
        padding: '50px 28px 24px',
      }}>
        <p style={{
          color: '#FDF6EE', fontSize: '20px', fontWeight: 700,
          margin: '0 0 5px', lineHeight: 1.3,
        }}>
          Cuidando con amor
        </p>
        <p style={{
          color: 'rgba(253,246,238,0.78)', fontSize: '13px',
          margin: 0, lineHeight: 1.6,
        }}>
          Un espacio de gestión pensado para el bienestar de nuestros residentes
        </p>
      </div>
    </div>
  )
}

/* ─── Login principal ───────────────────────────────────────── */
export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuthStore()
  const [form,         setForm]         = useState({ email: '', password: '' })
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login/', form)
      login(data.usuario, data.access, data.refresh)
      navigate('/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.detalle?.detail ||
        'Credenciales incorrectas. Verifica tu email y contraseña.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 44px',
    border: `1.5px solid ${focusedField === field ? '#C87941' : '#E8D5BF'}`,
    borderRadius: '12px',
    fontSize: '14px',
    color: '#3D1A0A',
    background: focusedField === field ? '#FFFAF5' : '#FDF6EE',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(200,121,65,0.15)' : 'none',
    boxSizing: 'border-box',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EDE0D0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>

      <div style={{
        width: '100%', maxWidth: '940px',
        borderRadius: '28px',
        overflow: 'hidden',
        display: 'flex',
        boxShadow: '0 32px 96px rgba(80,40,10,0.22), 0 4px 20px rgba(80,40,10,0.12)',
        minHeight: '580px',
      }}>

        {/* Panel izquierdo — gif + animación */}
        <div className="login-scene-panel" style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <ScenePanel />
        </div>

        {/* Panel derecho — formulario */}
        <div style={{
          width: '400px', flexShrink: 0,
          background: 'white',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 40px',
        }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #C87941, #E8A96A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(200,121,65,0.35)',
            }}>
              <House size={24} color="white" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#3D1A0A', margin: '0 0 6px' }}>
              Bienvenido
            </h1>
            <p style={{ fontSize: '14px', color: '#A0522D', margin: 0 }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#7C3D28', marginBottom: '7px' }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={focusedField === 'email' ? '#C87941' : '#C8A882'}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', pointerEvents: 'none' }} />
                <input
                  type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="correo@ejemplo.com" required
                  style={inputStyle('email')}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#7C3D28', marginBottom: '7px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={focusedField === 'password' ? '#C87941' : '#C8A882'}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', pointerEvents: 'none' }} />
                <input
                  type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••" required
                  style={inputStyle('password')}
                />
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: '#FFF0F0', border: '1px solid rgba(185,64,64,0.25)',
                borderRadius: '10px', padding: '12px 14px',
                animation: 'slideIn 0.2s ease',
              }}>
                <AlertCircle size={16} color="#B94040" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: '#8B2B2B', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                background: loading ? '#E8C4A0' : 'linear-gradient(135deg, #A0522D 0%, #C87941 100%)',
                color: 'white', fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(160,82,45,0.35)',
                marginTop: '4px',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(160,82,45,0.45)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 16px rgba(160,82,45,0.35)' }}
            >
              {loading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Ingresando...</>
                : <><LogIn size={18} /> Ingresar al sistema</>
              }
            </button>

            <Link
              to="/recuperar"
              style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#A0522D', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7C3D28'}
              onMouseLeave={e => e.currentTarget.style.color = '#A0522D'}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#C8A882', marginTop: '32px', marginBottom: 0 }}>
            v1.3 — Sistema de Gestión Asilo Virtual
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @media (max-width: 720px) { .login-scene-panel { display: none !important; } }
      `}</style>
    </div>
  )
}
