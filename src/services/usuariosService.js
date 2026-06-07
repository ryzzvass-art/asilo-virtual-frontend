import api from './api'

export const usuariosService = {
  listar:        ()         => api.get('/usuarios/').then(r => r.data),
  crear:         (data)     => api.post('/usuarios/', data).then(r => r.data),
  editar:        (id, data) => api.patch(`/usuarios/${id}/`, data).then(r => r.data),
  cambiarEstado: (id, estado) => api.patch(`/usuarios/${id}/estado/`, { estado }).then(r => r.data),
}