// Todas las llamadas a la Web API de ASP.NET Core pasan por aquí.
// En desarrollo, Vite redirige /api a http://localhost:5239 (ver vite.config.js).
const URL_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function solicitar(ruta, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    })
  } catch {
    throw new Error('No se pudo conectar con la API. ¿Está corriendo FarmaciaAPI?')
  }

  if (respuesta.status === 204) return null

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    throw new Error(leerMensajeDeError(datos, respuesta.status))
  }
  return datos
}

function leerMensajeDeError(datos, estado) {
  if (datos?.mensaje) return datos.mensaje
  if (datos?.errors) return Object.values(datos.errors).flat().join(' ')
  return `La API respondió con el código ${estado}.`
}

const enviar = (metodo, cuerpo) => ({ method: metodo, body: JSON.stringify(cuerpo) })

export const medicamentosApi = {
  listar: (nombre = '') =>
    solicitar(`/medicamentos${nombre ? `?nombre=${encodeURIComponent(nombre)}` : ''}`),
  stockBajo: () => solicitar('/medicamentos/stock-bajo'),
  crear: (dto) => solicitar('/medicamentos', enviar('POST', dto)),
  actualizar: (id, dto) => solicitar(`/medicamentos/${id}`, enviar('PUT', dto)),
  eliminar: (id) => solicitar(`/medicamentos/${id}`, { method: 'DELETE' }),
}

export const clientesApi = {
  listar: (buscar = '') =>
    solicitar(`/clientes${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ''}`),
  crear: (dto) => solicitar('/clientes', enviar('POST', dto)),
  actualizar: (id, dto) => solicitar(`/clientes/${id}`, enviar('PUT', dto)),
  eliminar: (id) => solicitar(`/clientes/${id}`, { method: 'DELETE' }),
}

export const diagnosticoApi = {
  // /salud responde 503 cuando la base de datos no contesta, pero el cuerpo
  // sigue trayendo la configuración; por eso no se trata como error.
  salud: async () => {
    try {
      const respuesta = await fetch(`${URL_BASE}/diagnostico/salud`)
      return await respuesta.json()
    } catch {
      throw new Error('No se pudo conectar con la API. ¿Está corriendo FarmaciaAPI?')
    }
  },
  auditoria: (cantidad = 20) => solicitar(`/diagnostico/auditoria?cantidad=${cantidad}`),
}
