// src/pages/nutricion/components/nutricionShared.js
// Constantes y clases CSS compartidas entre todos los componentes de nutrición

export const inputCls = "w-full px-3 py-2 border border-cream-400 rounded-xl text-sm bg-warm-50 text-warm-800 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:border-warm-500 transition"
export const btnPrimario = "px-4 py-2 bg-gradient-to-br from-warm-600 to-warm-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2"
export const btnSecundario = "px-4 py-2 border border-cream-400 rounded-xl text-warm-600 hover:bg-warm-50 text-sm font-semibold transition"

export const TIPOS_DIETA = [
  { value: 'blanda',       label: 'Blanda' },
  { value: 'hipocalorica', label: 'Hipocalórica' },
  { value: 'normal',       label: 'Normal' },
  { value: 'diabetica',    label: 'Diabética' },
  { value: 'hiposodica',   label: 'Hiposódica' },
  { value: 'otro',         label: 'Otro' },
]

export const TIPOS_COMIDA = ['desayuno', 'almuerzo', 'merienda', 'cena']

export const TIPO_COMIDA_ICON = {
  desayuno: '☕',
  almuerzo: '🍽️',
  merienda: '🥪',
  cena:     '🍷',
}

export const GRUPOS_ALIMENTARIOS = [
  'Lácteo', 'Cereal', 'Fruta', 'Verdura',
  'Proteína animal', 'Legumbre', 'Grasa', 'Bebida', 'Postre',
  'Panes y Masas', 'Sopas y Caldos', 'Segundos y Platos Fuertes', 'Otro',
]

// ── Helper: extrae un mensaje de error legible de una respuesta de error ──
// Maneja los formatos que devuelve Django REST Framework:
//   - { error: "texto" }
//   - { detalle: "texto" }
//   - { detail: "texto" }
//   - { campo: ["mensaje1", "mensaje2"] }  (errores de validación por campo)
//   - { non_field_errors: ["..."] }
//   - "texto plano"
export function extraerError(err, fallback = 'Ocurrió un error inesperado.') {
  const data = err?.response?.data

  if (!data) {
    // Sin respuesta del servidor (red caída, timeout, etc.)
    if (err?.message) return `No se pudo conectar con el servidor (${err.message}).`
    return fallback
  }

  if (typeof data === 'string') return data

  // Claves de error de nivel superior más comunes
  if (typeof data.error === 'string')   return data.error
  if (typeof data.detalle === 'string') return data.detalle
  if (typeof data.detail === 'string')  return data.detail

  // non_field_errors (errores generales del serializer)
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return data.non_field_errors.join(' ')
  }

  // Errores por campo: { nombre: ["Ya existe..."], fecha_menu: ["..."] }
  const partes = []
  for (const [campo, valor] of Object.entries(data)) {
    const texto = Array.isArray(valor) ? valor.join(' ') : String(valor)
    // Si el campo es genérico no lo nombramos, si es específico sí
    if (campo === 'error' || campo === 'detalle' || campo === 'detail') {
      partes.push(texto)
    } else {
      partes.push(texto)
    }
  }
  if (partes.length) return partes.join(' ')

  return fallback
}
