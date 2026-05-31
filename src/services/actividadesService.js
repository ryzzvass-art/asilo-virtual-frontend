import api from './api'

export const actividadesService = {
  listar:   (params) => api.get('/actividades/', { params }).then(r => r.data),
  obtener:  (id)     => api.get(`/actividades/${id}/`).then(r => r.data),
  crear:    (data)   => api.post('/actividades/', data).then(r => r.data),
  editar:   (id, data) => api.patch(`/actividades/${id}/`, data).then(r => r.data),
  cancelar: (id)     => api.patch(`/actividades/${id}/cancelar/`).then(r => r.data),
  hoy:      ()       => api.get('/actividades/hoy/').then(r => r.data),
  marcarRealizada: (id) => api.patch(`/actividades/${id}/realizada/`).then(r => r.data),

  // Participantes
  listarParticipantes: (id)           => api.get(`/actividades/${id}/residentes/`).then(r => r.data),
  asignarResidente:    (id, residente_id) => api.post(`/actividades/${id}/residentes/`, { residente_id }).then(r => r.data),
  desasignarResidente: (id, residente_id) => api.delete(`/actividades/${id}/residentes/${residente_id}/`).then(r => r.data),
}