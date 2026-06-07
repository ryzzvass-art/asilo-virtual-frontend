import api from './api'

export const visitantesService = {
  // ── Visitantes ──────────────────────────────────────────
  // Listado general. Acepta { busqueda } (nombre O C.I.), o { nombre } / { dni }.
  listar: (params) => api.get('/visitantes/', { params }).then(r => r.data),

  // Búsqueda unificada: una sola request que filtra por nombre O C.I.
  buscar: (texto) =>
    api.get('/visitantes/', { params: { busqueda: texto } }).then(r => r.data),

  crear:  (data)   => api.post('/visitantes/', data).then(r => r.data),
  obtener:    (id)       => api.get(`/visitantes/${id}/`).then(r => r.data),
  actualizar: (id, data) => api.patch(`/visitantes/${id}/`, data).then(r => r.data),

  // ── Autorizaciones ──────────────────────────────────────
  listarAutorizaciones:          (visitanteId) =>
    api.get(`/visitantes/${visitanteId}/autorizaciones/`).then(r => r.data),
  listarAutorizacionesResidente: (residenteId) =>
    api.get(`/residentes/${residenteId}/autorizaciones/`).then(r => r.data),
  autorizar: (visitanteId, residenteId, data) =>
    api.post(`/visitantes/${visitanteId}/autorizar/${residenteId}/`, data).then(r => r.data),
  suspender: (visitanteId, residenteId) =>
    api.patch(`/visitantes/${visitanteId}/autorizar/${residenteId}/suspender/`).then(r => r.data),

  // ── Visitas ─────────────────────────────────────────────
  registrarIngreso: (data)   => api.post('/visitas/', data).then(r => r.data),
  registrarSalida:  (id)     => api.patch(`/visitas/${id}/salida/`).then(r => r.data),
  // Acepta { estado, residente_id, fecha_desde, fecha_hasta }
  listarVisitas:    (params) => api.get('/visitas/', { params }).then(r => r.data),
}
