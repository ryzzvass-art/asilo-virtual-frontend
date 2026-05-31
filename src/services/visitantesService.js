import api from './api'

export const visitantesService = {
  // Visitantes
  listar: (params) => api.get('/visitantes/', { params }).then(r => r.data),
  crear:  (data)   => api.post('/visitantes/', data).then(r => r.data),

  // Autorizaciones
  listarAutorizaciones:          (visitanteId) =>
    api.get(`/visitantes/${visitanteId}/autorizaciones/`).then(r => r.data),
  listarAutorizacionesResidente: (residenteId) =>
    api.get(`/residentes/${residenteId}/autorizaciones/`).then(r => r.data),
  autorizar: (visitanteId, residenteId, data) =>
    api.post(`/visitantes/${visitanteId}/autorizar/${residenteId}/`, data).then(r => r.data),
  suspender: (visitanteId, residenteId) =>
    api.patch(`/visitantes/${visitanteId}/autorizar/${residenteId}/suspender/`).then(r => r.data),

  // Visitas
  registrarIngreso: (data)  => api.post('/visitas/', data).then(r => r.data),
  registrarSalida:  (id)    => api.patch(`/visitas/${id}/salida/`).then(r => r.data),
  listarVisitas:    (params) => api.get('/visitas/', { params }).then(r => r.data),
}