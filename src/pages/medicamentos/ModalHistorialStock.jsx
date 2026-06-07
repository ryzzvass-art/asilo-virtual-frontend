import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  X, History, ArrowDownCircle, ArrowUpCircle, RotateCcw, Package, Loader2
} from 'lucide-react'
import { medicamentosService } from '../../services/medicamentosService'

// ── Helpers de presentación por tipo de movimiento ─────────
const TIPOS = {
  entrada:    { label: 'Entrada',    Icon: ArrowDownCircle, signo: '+', cls: 'text-health-600 bg-health-100' },
  salida:     { label: 'Salida',     Icon: ArrowUpCircle,   signo: '−', cls: 'text-danger-600 bg-danger-100' },
  devolucion: { label: 'Devolución', Icon: RotateCcw,       signo: '+', cls: 'text-alert-600 bg-alert-100' },
}

function fechaLegible(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ModalHistorialStock({ medicamento, onClose }) {
  const [filtroTipo, setFiltroTipo] = useState('')   // '' = todos
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['movimientos', medicamento.id, filtroTipo, page],
    queryFn: () => medicamentosService.historialMovimientos(medicamento.id, {
      ...(filtroTipo ? { tipo: filtroTipo } : {}),
      page,
    }),
    keepPreviousData: true,
  })

  const movimientos = data?.results || []

  // Cambiar filtro reinicia a la página 1
  const cambiarFiltro = (valor) => { setFiltroTipo(valor); setPage(1) }

  return (
    <div onClick={onClose} className="fixed inset-0 bg-[rgba(60,26,10,0.45)] backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ animation: 'fadeIn 0.18s ease' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[22px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ animation: 'modalPop 0.24s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-cream-400 sticky top-0 bg-warm-50 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-600 to-warm-500 flex items-center justify-center shrink-0">
            <History size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-warm-800">Historial de movimientos</h2>
            <p className="text-sm text-warm-500">{medicamento.nombre_comercial}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-cream-200 hover:text-warm-800 flex items-center justify-center transition"><X size={16} /></button>
        </div>

        {/* Filtro por tipo */}
        <div className="px-5 pt-4 flex gap-2 flex-wrap">
          {[
            { v: '', label: 'Todos' },
            { v: 'entrada', label: 'Entradas' },
            { v: 'salida', label: 'Salidas' },
            { v: 'devolucion', label: 'Devoluciones' },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => cambiarFiltro(v)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                ${filtroTipo === v
                  ? 'bg-warm-600 text-white border-warm-600'
                  : 'bg-white text-warm-600 border-cream-400 hover:bg-warm-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Cuerpo */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-warm-500" />
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              <Package size={32} className="mx-auto mb-2 text-cream-400" />
              Sin movimientos registrados
            </div>
          ) : (
            <div className="space-y-2">
              {movimientos.map(mov => {
                const meta = TIPOS[mov.tipo] || TIPOS.salida
                const { Icon } = meta
                return (
                  <div key={mov.id} className="border border-cream-400 rounded-xl p-3 bg-white flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.cls}`}>
                      <Icon size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-warm-800 text-sm">{meta.label}</span>
                        <span className={`text-xs font-bold ${meta.signo === '+' ? 'text-health-600' : 'text-danger-600'}`}>
                          {meta.signo}{mov.cantidad}
                        </span>
                        <span className="text-xs text-warm-400">· Lote {mov.lote_nombre}</span>
                      </div>
                      <p className="text-xs text-warm-500 mt-0.5">{mov.motivo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-warm-600">{fechaLegible(mov.created_at)}</p>
                      <p className="text-xs text-warm-400">{mov.realizado_por_nombre}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Paginación */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-cream-400">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-sm font-semibold text-warm-600 disabled:opacity-40 disabled:cursor-not-allowed hover:text-warm-800 transition">
                ← Anterior
              </button>
              <span className="text-xs text-warm-500">Página {data.page} de {data.pages} · {data.total} movimientos</span>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="text-sm font-semibold text-warm-600 disabled:opacity-40 disabled:cursor-not-allowed hover:text-warm-800 transition">
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
