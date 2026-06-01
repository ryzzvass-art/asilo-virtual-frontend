import { useState, useEffect, useRef } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/tomas/'

export function useTomasPendientes() {
  const [tomas, setTomas] = useState([])
  const [conectado, setConectado] = useState(false)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

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
    }, 60000)

    return () => {
      cerrarManual = true
      clearInterval(intervalo)
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [])

  return { tomas, conectado }
}