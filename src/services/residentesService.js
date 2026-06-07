import api from './api'

export const residentesService = {
  listar:  (params) => api.get('/residentes/', { params }).then(r => r.data),
  obtener: (id)     => api.get(`/residentes/${id}/`).then(r => r.data),
  crear:   (data)   => api.post('/residentes/', data).then(r => r.data),
  editar:  (id, data) => api.patch(`/residentes/${id}/`, data).then(r => r.data),
  cambiarEstado: (id, estado) => api.patch(`/residentes/${id}/estado/`, { estado }).then(r => r.data),

  // Historial médico
  obtenerHistorial: (id)      => api.get(`/residentes/${id}/historial/`).then(r => r.data),
  editarHistorial:  (id, data) => api.patch(`/residentes/${id}/historial/`, data).then(r => r.data),

  // Contactos
  listarContactos: (id)       => api.get(`/residentes/${id}/contactos/`).then(r => r.data),
  crearContacto:   (id, data) => api.post(`/residentes/${id}/contactos/`, data).then(r => r.data),
  editarContacto:  (id, cid, data) => api.patch(`/residentes/${id}/contactos/${cid}/`, data).then(r => r.data),
  // ── Observaciones diarias ──
  // params: { page, page_size, fecha, buscar }
  listarObservaciones: (id, params) =>
    api.get(`/residentes/${id}/observaciones/`, { params }).then(r => r.data),
  crearObservacion: (id, data) =>
    api.post(`/residentes/${id}/observaciones/`, data).then(r => r.data),
  editarObservacion: (id, obsId, data) =>
    api.patch(`/residentes/${id}/observaciones/${obsId}/`, data).then(r => r.data),

  // ── Turnos médicos ──
  // params: { page, page_size, tipo_consulta, fecha_desde, fecha_hasta, buscar }
  listarTurnos: (id, params) =>
    api.get(`/residentes/${id}/turnos/`, { params }).then(r => r.data),
  crearTurno: (id, data) =>
    api.post(`/residentes/${id}/turnos/`, data).then(r => r.data),
  editarTurno: (id, turnoId, data) =>
    api.patch(`/residentes/${id}/turnos/${turnoId}/`, data).then(r => r.data),
}