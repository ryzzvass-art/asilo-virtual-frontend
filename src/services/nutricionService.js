import api from './api'

export const nutricionService = {
  // ── Restricciones (catálogo) ──
  listarRestricciones: (params) => api.get('/restricciones/', { params }).then(r => r.data),
  crearRestriccion:    (data)   => api.post('/restricciones/', data).then(r => r.data),
  editarRestriccion:   (id, data) => api.patch(`/restricciones/${id}/`, data).then(r => r.data),
  archivarRestriccion: (id)     => api.patch(`/restricciones/${id}/archivar/`).then(r => r.data),

  // ── Alimentos (catálogo) ──
  listarAlimentos: (params) => api.get('/alimentos/', { params }).then(r => r.data),
  crearAlimento:   (data)   => api.post('/alimentos/', data).then(r => r.data),
  editarAlimento:  (id, data) => api.patch(`/alimentos/${id}/`, data).then(r => r.data),
  activarAlimento: (id)     => api.patch(`/alimentos/${id}/activar/`).then(r => r.data),
  archivarAlimento: (id) => api.patch(`/alimentos/${id}/archivar/`).then(r => r.data),
  // Vinculación alimento-restricción
  listarRestriccionesAlimento: (id) => api.get(`/alimentos/${id}/restricciones/`).then(r => r.data),
  vincularRestriccion:   (id, restriccion_id) =>
    api.post(`/alimentos/${id}/restricciones/`, { restriccion_id }).then(r => r.data),
  desvincularRestriccion: (id, rid) =>
    api.delete(`/alimentos/${id}/restricciones/${rid}/`).then(r => r.data),

  // ── Restricciones del residente ──
  listarRestriccionesResidente: (id) => api.get(`/residentes/${id}/restricciones/`).then(r => r.data),
  activarRestriccionResidente:  (id, data) =>
    api.post(`/residentes/${id}/restricciones/`, data).then(r => r.data),
  revocarRestriccionResidente:  (id, rrId) =>
    api.patch(`/residentes/${id}/restricciones/${rrId}/revocar/`).then(r => r.data),
  activarRestriccion: (id) => api.patch(`/restricciones/${id}/activar/`).then(r => r.data),

  // ── Planes nutricionales (por residente) ──
  listarPlanes: (id)       => api.get(`/residentes/${id}/planes/`).then(r => r.data),
  obtenerPlan:  (planId)   => api.get(`/planes/${planId}/`).then(r => r.data),

  // ── Comidas / menús ──
  listarComidas: (planId, params) => api.get(`/planes/${planId}/comidas/`, { params }).then(r => r.data),
  crearComida:   (planId, data)   => api.post(`/planes/${planId}/comidas/`, data).then(r => r.data),
  eliminarComida: (comidaId) => api.delete(`/comidas/${comidaId}/`).then(r => r.data),

  // ── Plantillas ──
  listarPlantillas: (params) => api.get('/plantillas/', { params }).then(r => r.data),
  editarPlantilla: (id, data) => api.patch(`/plantillas/${id}/editar/`, data).then(r => r.data),
  crearPlantilla:   (data)   => api.post('/plantillas/', data).then(r => r.data),
  obtenerPlantilla: (id)     => api.get(`/plantillas/${id}/`).then(r => r.data),
  aprobarPlantilla: (id)     => api.patch(`/plantillas/${id}/aprobar/`).then(r => r.data),
  rechazarPlantilla:(id, data) => api.patch(`/plantillas/${id}/rechazar/`, data).then(r => r.data),
  asignarPlantilla: (residenteId, data) =>
    api.post(`/residentes/${residenteId}/planes/asignar/`, data).then(r => r.data),
  asignadosPlantilla: (id) => api.get(`/plantillas/${id}/asignados/`).then(r => r.data),

  // ── Resumen para Dashboard ──
  resumenDashboard: () => api.get('/nutricion/resumen-dashboard/').then(r => r.data),
}