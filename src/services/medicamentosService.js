import api from './api'

export const medicamentosService = {
  // Catálogo
  listar:   (params)   => api.get('/medicamentos/', { params }).then(r => r.data),
  obtener:  (id)       => api.get(`/medicamentos/${id}/`).then(r => r.data),
  crear:    (data)     => api.post('/medicamentos/', data).then(r => r.data),
  editar:   (id, data) => api.patch(`/medicamentos/${id}/`, data).then(r => r.data),
  archivar: (id)       => api.patch(`/medicamentos/${id}/archivar/`).then(r => r.data),

  // Stock por lote
  listarStock:    (id)            => api.get(`/medicamentos/${id}/stock/`).then(r => r.data),
  agregarLote:    (id, data)      => api.post(`/medicamentos/${id}/stock/`, data).then(r => r.data),
  actualizarLote: (id, loteId, data) =>
    api.patch(`/medicamentos/${id}/stock/${loteId}/`, data).then(r => r.data),

  // Alertas
  alertasStock: () => api.get('/alertas/stock/').then(r => r.data),

  // Prescripciones (por residente)
  listarPrescripciones: (residenteId) =>
    api.get(`/residentes/${residenteId}/medicamentos/`, {
      params: { incluir_finalizadas: true }
    }).then(r => r.data),

  crearPrescripcion: (residenteId, data) =>
    api.post(`/residentes/${residenteId}/medicamentos/`, data).then(r => r.data),
  editarPrescripcion: (residenteId, pmId, data) =>
    api.patch(`/residentes/${residenteId}/medicamentos/${pmId}/`, data).then(r => r.data),
  finalizarPrescripcion: (residenteId, pmId) =>
    api.patch(`/residentes/${residenteId}/medicamentos/${pmId}/finalizar/`).then(r => r.data),

  // Administraciones (tomas)
  registrarToma: (data) => api.post('/administraciones/', data).then(r => r.data),
  corregirToma:  (admId, data) => api.patch(`/administraciones/${admId}/`, data).then(r => r.data),
  historialTomas: (residenteId, params) =>
    api.get(`/residentes/${residenteId}/administraciones/`, { params }).then(r => r.data),
}