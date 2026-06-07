import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/tomas/'

// Nombre del evento global que dispara un refresco inmediato de las tomas.
// Lo emite cualquier parte de la app tras registrar/corregir una toma.
export const EVENTO_REFRESCAR_TOMAS = 'tomas:refrescar'

export function useTomasPendientes() {
  const [tomas, setTomas] = useState([])
  const [conectado, setConectado] = useState(false)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  // Pide al backend la lista actualizada (el consumer entiende 'actualizar').
  // Es seguro llamarla aunque el socket aún no esté abierto: simplemente no hace nada.
  const refrescar = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ accion: 'actualizar' }))
    }
  }, [])

  useEffect(() => {
    let cerrarManual = false

    function conectar() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => setConectado(true)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.tipo === 'tomas_pendientes') {
            setTomas(data.tomas || [])
          }
        } catch { /* ignorar mensajes no-JSON */ }
      }

      ws.onclose = () => {
        setConectado(false)
        // Reconectar a los 5s si no fue cierre manual
        if (!cerrarManual) {
          reconnectRef.current = setTimeout(conectar, 5000)
        }
      }

      ws.onerror = () => ws.close()
    }

    conectar()

    // Pedir actualización cada 60s
    const intervalo = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ accion: 'actualizar' }))
      }
    }, 15000)

    // Refresco inmediato: cuando otra parte de la app avisa que se registró
    // o corrigió una toma, pedimos la lista actualizada al instante.
    const onRefrescar = () => refrescar()
    window.addEventListener(EVENTO_REFRESCAR_TOMAS, onRefrescar)

    return () => {
      cerrarManual = true
      clearInterval(intervalo)
      clearTimeout(reconnectRef.current)
      window.removeEventListener(EVENTO_REFRESCAR_TOMAS, onRefrescar)
      wsRef.current?.close()
    }
  }, [refrescar])

  return { tomas, conectado, refrescar }
}

// Helper para disparar el refresco desde cualquier componente sin necesitar
// la instancia del hook. Úsalo tras registrar/corregir una toma.
export function dispararRefrescoTomas() {
  window.dispatchEvent(new Event(EVENTO_REFRESCAR_TOMAS))
}
