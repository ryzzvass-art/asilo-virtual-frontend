import { create } from 'zustand'

const useAuthStore = create((set) => ({
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  token: localStorage.getItem('access_token') || null,

  login: (usuario, access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    set({ usuario, token: access })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('usuario')
    set({ usuario: null, token: null })
  },

  esAdmin: () => {
    const state = useAuthStore.getState()
    return state.usuario?.rol === 'administrador'
  },
}))

export default useAuthStore