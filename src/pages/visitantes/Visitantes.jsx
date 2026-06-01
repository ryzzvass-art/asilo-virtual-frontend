// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL (CON FILTRO DE HISTORIAL OPTIMIZADO)
// ════════════════════════════════════════════════════════════
export default function Visitas() {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const esAdmin = usuario?.rol === 'administrador'

  const [tab, setTab] = useState('activas')
  const [modalNuevaVisita, setModalNuevaVisita] = useState(false)
  const [modalNuevoVisitante, setModalNuevoVisitante] = useState(false)
  const [salidaRegistrada, setSalidaRegistrada] = useState(null)

  // Estados para el filtro del historial
  const [filtroResidenteId, setFiltroResidenteId] = useState('') // Guarda el ID real para la API
  const [textoBusquedaHistorial, setTextoBusquedaHistorial] = useState('') // Guarda el texto del input
  const [filtroFecha, setFiltroFecha] = useState('')
  const [, setTick] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(intervalo)
  }, [])

  const { data: visitasActivas, isLoading: cargandoActivas } = useQuery({
    queryKey: ['visitas-activas'],
    queryFn: () => visitantesService.listarVisitas({ estado: 'en_curso' }),
    refetchInterval: 30000,
  })

  // Traemos TODOS los residentes (hasta 500) para el buscador del historial
  const { data: residentesData } = useQuery({
    queryKey: ['residentes-activos-historial'],
    queryFn: () => residentesService.listar({ 
      estado: 'activo',
      page_size: 500 
    }),
    enabled: tab === 'historial',
  })
  const residentesList = residentesData?.results || []

  // La consulta al historial reacciona inmediatamente cuando cambia el ID filtrado
  const { data: historial, isLoading: cargandoHistorial } = useQuery({
    queryKey: ['historial-visitas', filtroResidenteId],
    queryFn: () => visitantesService.listarVisitas(
      filtroResidenteId ? { residente_id: filtroResidenteId } : {}
    ),
    enabled: tab === 'historial',
  })

  const mutacionSalida = useMutation({
    mutationFn: (id) => visitantesService.registrarSalida(id),
    onSuccess: (data, id) => {
      setSalidaRegistrada(id)
      setTimeout(() => {
        queryClient.invalidateQueries(['visitas-activas'])
        queryClient.invalidateQueries(['historial-visitas'])
        setSalidaRegistrada(null)
      }, 800)
    },
  })

  const historialFiltrado = historial?.filter(v => {
    if (!filtroFecha) return true
    return v.fecha_hora_entrada?.startsWith(filtroFecha)
  })

  const tabs = [
    { key: 'activas', label: 'Visitas activas', icon: Circle, badge: visitasActivas?.length },
    { key: 'historial', label: 'Historial', icon: ClipboardList },
  ]

  const Spinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-full border-[3px] border-cream-400 border-t-warm-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ animation: 'fadeUp 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-warm-100 flex items-center justify-center">
            <CalendarHeart size={22} className="text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-warm-800 tracking-tight">Visitas</h1>
            <p className="text-warm-600 text-sm">Control de acceso de visitantes</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {esAdmin && (
            <button onClick={() => setModalNuevoVisitante(true)} className={btnSecundario + " flex items-center gap-2"}>
              <UserPlus size={15} /> Nuevo visitante
            </button>
          )}
          <button onClick={() => setModalNuevaVisita(true)}
            className="bg-gradient-to-br from-warm-600 to-warm-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
            <LogIn size={16} /> Nueva visita
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-cream-400 gap-6">
        {tabs.map(t => {
          const Icon = t.icon
          const activo = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition
                ${activo ? 'text-warm-800' : 'text-warm-400 hover:text-warm-600'}`}>
              <Icon size={16} className={t.key === 'activas' && visitasActivas?.length > 0 ? "text-health-500 fill-health-500 animate-pulse" : ""} />
              {t.label}
              {t.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-black transition
                  ${activo ? 'bg-warm-600 text-white' : 'bg-cream-300 text-warm-600'}`}>{t.badge}</span>
              )}
              {activo && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-warm-600 rounded-full" style={{ animation: 'fadeIn 0.2s ease' }} />}
            </button>
          )
        })}
      </div>

      {/* Contenido de Pestañas */}
      <div style={{ animation: 'fadeIn 0.3s ease both' }}>
        {tab === 'activas' ? (
          cargandoActivas ? <Spinner /> : !visitasActivas || visitasActivas.length === 0 ? (
            <div className="text-center py-16 bg-warm-50 rounded-2xl border border-dashed border-cream-400">
              <House size={40} className="mx-auto text-cream-400 mb-3" />
              <p className="text-warm-700 font-bold">No hay visitas activas en este momento</p>
              <p className="text-warm-400 text-xs mt-0.5">Todos los ingresos registrados han marcado su salida.</p>
            </div>
          ) : (
            <div className="bg-white border border-cream-400 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-warm-50 text-warm-700 border-b border-cream-400 font-bold">
                      <th className="p-4">Visitante</th>
                      <th className="p-4">Residente / Destino</th>
                      <th className="p-4">Ingreso</th>
                      <th className="p-4">Tiempo dentro</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 text-warm-800">
                    {visitasActivas.map(v => {
                      const finalizado = salidaRegistrada === v.id
                      return (
                        <tr key={v.id} className={`transition ${finalizado ? 'opacity-40 bg-health-50' : 'hover:bg-warm-50/50'}`}>
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{v.visitante_nombre}</div>
                            <div className="text-xs text-warm-400">C.I.: {v.visitante_dni}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{v.residente_nombre}</div>
                            <div className="text-xs text-warm-500">{RELACION_LABEL[v.relacion] || v.relacion}</div>
                          </td>
                          <td className="p-4 text-warm-600">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-warm-400" />
                              {v.fecha_hora_entrada ? new Date(v.fecha_hora_entrada).toLocaleTimeString('es-BO', {hour:'2-digit', minute:'2-digit'}) : '—'}
                            </div>
                          </td>
                          <td className="p-4 font-medium text-warm-700">
                            <span className="px-2 py-0.5 rounded-md bg-warm-100 text-warm-700 text-xs font-semibold">
                              {tiempoTranscurrido(v.fecha_hora_entrada)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => mutacionSalida.mutate(v.id)} disabled={mutacionSalida.isPending || finalizado}
                              className="ml-auto px-3 py-1.5 text-xs font-bold text-danger-700 border border-danger-200 bg-danger-50 hover:bg-danger-100 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50">
                              {finalizado ? <Check size={13} /> : <LogOut size={13} />} Registrar Salida
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* HISTORIAL */
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 bg-warm-50 border border-cream-400 p-3 rounded-2xl items-center">
              {/* BUSCADOR DE RESIDENTES AVANZADO EN EL HISTORIAL */}
              <div className="flex-1 min-w-[250px] relative">
                <input 
                  list="historial-residentes-list"
                  placeholder="🔍 Buscar residente por nombre o apellido..."
                  value={textoBusquedaHistorial}
                  onChange={(e) => {
                    const valorInput = e.target.value
                    setTextoBusquedaHistorial(valorInput)

                    // Verificamos si coincide de forma exacta con alguna opción para extraer el ID
                    const seleccionado = residentesList.find(r => {
                      const stringIdentificacion = `${r.nombre} ${r.apellido || ''} [C.I.: ${r.dni}]`.trim().toLowerCase()
                      return stringIdentificacion === valorInput.toLowerCase()
                    })

                    if (seleccionado) {
                      setFiltroResidenteId(seleccionado.id)
                    } else if (valorInput === '') {
                      // Si el usuario borra todo el campo, se limpia el filtro y muestra todo el historial de nuevo
                      setFiltroResidenteId('')
                    }
                  }}
                  className={inputCls}
                />
                <datalist id="historial-residentes-list">
                  {residentesList.map(r => {
                    const valorCompleto = `${r.nombre} ${r.apellido || ''} [C.I.: ${r.dni}]`.trim()
                    return (
                      <option key={r.id} value={valorCompleto} />
                    )
                  })}
                </datalist>
                
                {/* Botón rápido de limpieza si hay un residente seleccionado */}
                {filtroResidenteId && (
                  <button 
                    onClick={() => { setTextoBusquedaHistorial(''); setFiltroResidenteId('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-warm-400 hover:text-danger-600 transition"
                  >
                    Ver todos
                  </button>
                )}
              </div>
              
              <div className="w-48">
                <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className={inputCls} />
              </div>
            </div>

            {cargandoHistorial ? <Spinner /> : !historialFiltrado || historialFiltrado.length === 0 ? (
              <div className="text-center py-16 text-warm-400 bg-white border border-cream-400 rounded-2xl">
                <ClipboardList size={36} className="mx-auto mb-2 text-cream-300" />
                <p className="text-sm">No se encontraron registros en el historial</p>
              </div>
            ) : (
              <div className="bg-white border border-cream-400 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-warm-50 text-warm-700 border-b border-cream-400 font-bold">
                        <th className="p-4">Visitante</th>
                        <th className="p-4">Residente</th>
                        <th className="p-4">Entrada</th>
                        <th className="p-4">Salida</th>
                        <th className="p-4">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200 text-warm-800">
                      {historialFiltrado.map(h => (
                        <tr key={h.id} className="hover:bg-warm-50/50 transition">
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{h.visitante_nombre}</div>
                            <div className="text-xs text-warm-400">C.I.: {h.visitante_dni}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-warm-800">{h.residente_nombre}</div>
                            <div className="text-xs text-warm-400">{RELACION_LABEL[h.relacion] || h.relacion}</div>
                          </td>
                          <td className="p-4 text-warm-600 whitespace-nowrap">
                            {h.fecha_hora_entrada ? new Date(h.fecha_hora_entrada).toLocaleString('es-BO', {dateStyle:'short', timeStyle:'short'}) : '—'}
                          </td>
                          <td className="p-4 text-warm-600 whitespace-nowrap">
                            {h.fecha_hora_salida ? new Date(h.fecha_hora_salida).toLocaleString('es-BO', {dateStyle:'short', timeStyle:'short'}) : (
                              <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200 inline-flex items-center gap-1">
                                <Clock size={11} /> Sin salida
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-warm-500 max-w-xs truncate" title={h.observaciones}>
                            {h.observaciones || <span className="text-warm-300 italic">Ninguna</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {modalNuevaVisita && <ModalNuevaVisita onClose={() => setModalNuevaVisita(false)} onGuardado={() => queryClient.invalidateQueries(['visitas-activas'])} />}
      {modalNuevoVisitante && <ModalNuevoVisitante onClose={() => setModalNuevoVisitante(false)} onGuardado={() => queryClient.invalidateQueries(['visitas-activas'])} />}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes modalPop { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  )
}