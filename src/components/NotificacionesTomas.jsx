import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Pill, Clock, Wifi, WifiOff, CheckCircle2, X } from 'lucide-react'
import { useTomasPendientes } from '../hooks/useTomasPendientes.js'

const P = {
  warm800: '#7C3D28', warm600: '#A0522D', warm500: '#C87941',
  warm400: '#E8A96A', warm200: '#F7DFC0', warm100: '#FAEEE3', warm50: '#FDF6EE',
  cream400: '#E8D5BF', cream200: '#F5EBD8',
  danger600: '#B94040', danger100: '#FFF0F0',
  alert600:  '#D4742A', alert100:  '#FFF0E0',
  health600: '#4A7C59', health100: '#E8F5ED',
}

export default function NotificacionesTomas() {
  const { tomas, conectado } = useTomasPendientes()
  const [abierto, setAbierto]   = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 })
  const btnRef  = useRef(null)
  const urgentes = tomas.filter(t => t.minutos_restantes <= 30).length
  const hayTomas = tomas.length > 0

  const [pulso, setPulso] = useState(false)
  useEffect(() => {
    if (urgentes > 0) {
      setPulso(true)
      const t = setTimeout(() => setPulso(false), 1000)
      return () => clearTimeout(t)
    }
  }, [urgentes])

  /* Calcular posición absoluta del panel relativa al viewport */
  const handleOpen = () => {
    if (!abierto && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({
        top:   rect.bottom + 10,
        right: window.innerWidth - rect.right,
      })
    }
    setAbierto(v => !v)
  }

  /* Recalcular si cambia el tamaño de ventana */
  useEffect(() => {
    if (!abierto) return
    const onResize = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect()
        setPanelPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right })
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [abierto])

  /* Panel renderizado en el body via portal → escapa cualquier stacking context */
  const Panel = (
    <>
      {/* Overlay cierre */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={() => setAbierto(false)}
      />
      {/* Panel */}
      <div style={{
        position:  'fixed',
        top:       panelPos.top,
        right:     Math.max(panelPos.right, 8),
        width:     'min(340px, calc(100vw - 16px))',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 24px 64px rgba(92,40,16,0.22), 0 4px 16px rgba(92,40,16,0.12)',
        border:    `1px solid ${P.cream400}`,
        zIndex:    9999,
        overflow:  'hidden',
        animation: 'dropIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Header del panel */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: `1px solid ${P.cream400}`,
          background: P.warm50,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
            background: hayTomas ? (urgentes > 0 ? P.danger100 : P.warm100) : P.health100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Pill size={16} color={hayTomas ? (urgentes > 0 ? P.danger600 : P.warm600) : P.health600} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: P.warm800, margin: '0 0 2px' }}>
              Tomas próximas
            </p>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Próximas 2 horas</p>
          </div>

          {/* Indicador WebSocket */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 8px', borderRadius: '20px',
            background: conectado ? P.health100 : '#F3F4F6',
            border: `1px solid ${conectado ? '#c6e8d0' : '#E5E7EB'}`,
          }}>
            {conectado
              ? <Wifi    size={11} color={P.health600} />
              : <WifiOff size={11} color="#9CA3AF"    />
            }
            <span style={{ fontSize: '10px', fontWeight: 600, color: conectado ? P.health600 : '#9CA3AF' }}>
              {conectado ? 'En vivo' : 'Offline'}
            </span>
          </div>

          <button onClick={() => setAbierto(false)} style={{
            width: '28px', height: '28px', borderRadius: '8px',
            border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9CA3AF', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = P.cream200; e.currentTarget.style.color = P.warm800 }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Banner urgentes */}
        {urgentes > 0 && (
          <div style={{
            margin: '10px 12px 0',
            padding: '10px 14px',
            background: P.danger100,
            border: `1px solid ${P.danger600}30`,
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Clock size={14} color={P.danger600} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: P.danger600 }}>
              {urgentes} toma{urgentes > 1 ? 's' : ''} urgente{urgentes > 1 ? 's' : ''} — menos de 30 min
            </span>
          </div>
        )}

        {/* Lista */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px 0' }}>
          {tomas.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', gap: '10px' }}>
              <CheckCircle2 size={32} color={P.health600} />
              <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0, textAlign: 'center' }}>
                Sin tomas próximas
              </p>
            </div>
          ) : (
            tomas.map((t, i) => {
              const esUrgente = t.minutos_restantes <= 30
              return (
                <div key={`${t.prescripcion_id}-${t.hora_programada}-${i}`}
                  style={{
                    padding: '10px 16px',
                    borderBottom: i < tomas.length - 1 ? `1px solid ${P.warm50}` : 'none',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
                    transition: 'background 0.15s', cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = P.warm50}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '3px', borderRadius: '3px', alignSelf: 'stretch', flexShrink: 0,
                    background: esUrgente ? P.danger600 : P.warm400, minHeight: '32px',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: P.warm800, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.residente}
                    </p>
                    <p style={{ fontSize: '12px', color: P.warm600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.medicamento} · {t.dosis}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: P.warm800, margin: '0 0 3px' }}>
                      {t.hora_programada}
                    </p>
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      padding: '2px 7px', borderRadius: '10px',
                      background: esUrgente ? P.danger100 : P.warm100,
                      color: esUrgente ? P.danger600 : P.warm600,
                      border: `1px solid ${esUrgente ? P.danger600 : P.warm400}30`,
                    }}>
                      en {t.minutos_restantes} min
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes bellShake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-12deg)} 40%{transform:rotate(12deg)} 60%{transform:rotate(-8deg)} 80%{transform:rotate(8deg)} }
        @keyframes badgePop  { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }
        @keyframes ringPulse { 0%{opacity:.8;transform:scale(1)} 100%{opacity:0;transform:scale(1.5)} }
        @keyframes dropIn    { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </>
  )

  return (
    <div style={{ position: 'relative' }}>
      {/* Botón campana */}
      <button ref={btnRef} onClick={handleOpen} title="Tomas próximas"
        style={{
          position: 'relative',
          width: '40px', height: '40px', borderRadius: '12px',
          border: `1.5px solid ${abierto ? P.warm400 : P.cream400}`,
          background: abierto ? P.warm100 : 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.18s ease',
          boxShadow: abierto ? `0 0 0 3px ${P.warm200}` : 'none',
        }}
        onMouseEnter={e => { if (!abierto) { e.currentTarget.style.background = P.warm50; e.currentTarget.style.borderColor = P.warm400 }}}
        onMouseLeave={e => { if (!abierto) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = P.cream400 }}}
      >
        <Bell size={18} color={hayTomas ? P.warm600 : '#9CA3AF'}
          style={urgentes > 0 ? { animation: 'bellShake 0.5s ease' } : {}} />

        {hayTomas && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            minWidth: '18px', height: '18px',
            background: urgentes > 0 ? P.danger600 : P.warm500,
            color: 'white', borderRadius: '9px',
            fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid white',
            animation: pulso ? 'badgePop 0.4s ease' : 'none',
          }}>
            {tomas.length}
          </span>
        )}

        {urgentes > 0 && (
          <span style={{
            position: 'absolute', inset: '-4px', borderRadius: '16px',
            border: `2px solid ${P.danger600}`,
            animation: 'ringPulse 1.5s ease-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </button>

      {/* Portal → renderiza fuera del header, sobre todo */}
      {abierto && createPortal(Panel, document.body)}
    </div>
  )
}
