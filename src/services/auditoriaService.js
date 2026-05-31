import api from './api'

export const auditoriaService = {
  listarLog: (params) => api.get('/audit-log/', { params }).then(r => r.data),
  obtenerLog: (id) => api.get(`/audit-log/${id}/`).then(r => r.data),
  dashboard: () => api.get('/dashboard/').then(r => r.data),
}