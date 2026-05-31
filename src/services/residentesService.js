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
}