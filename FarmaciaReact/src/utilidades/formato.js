const moneda = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
})

export const formatearMoneda = (valor) => moneda.format(valor ?? 0)

export function formatearFecha(texto, conHora = false) {
  if (!texto) return '—'
  const fecha = new Date(texto.length === 10 ? `${texto}T00:00:00` : texto)
  return fecha.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(conHora && { hour: '2-digit', minute: '2-digit' }),
  })
}

export function diasHasta(texto) {
  if (!texto) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(`${texto}T00:00:00`)
  return Math.round((fecha - hoy) / 86_400_000)
}

export function calcularEdad(texto) {
  if (!texto) return null
  const nacimiento = new Date(`${texto}T00:00:00`)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad
}

export const iniciales = (nombres = '', apellidos = '') =>
  `${nombres.trim()[0] ?? ''}${apellidos.trim()[0] ?? ''}`.toUpperCase()

export function ocultar(texto) {
  if (!texto) return '—'
  if (texto.includes('@')) {
    const [usuario, dominio] = texto.split('@')
    return `${usuario[0]}•••@${dominio}`
  }
  return texto.replace(/\d(?=(?:\D*\d){4})/g, '•')
}

// Cada medicamento recibe siempre el mismo par de colores para su cápsula.
const PARES_DE_COLOR = [
  ['#0a8f6f', '#e8f5f0'],
  ['#ff5d47', '#fff1ee'],
  ['#2f6fed', '#edf3ff'],
  ['#f2b531', '#fff8e6'],
  ['#8b5cf6', '#f3efff'],
  ['#0ea5b7', '#e7f8fa'],
]

export function colorDe(id = 0) {
  return PARES_DE_COLOR[Math.abs(id) % PARES_DE_COLOR.length]
}
