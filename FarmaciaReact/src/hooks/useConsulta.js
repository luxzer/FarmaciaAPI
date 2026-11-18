import { useCallback, useEffect, useState } from 'react'

// Ejecuta una función que pide datos a la API y guarda el resultado,
// si está cargando y el error. "recargar" vuelve a pedir los datos.
export function useConsulta(funcionDeCarga, dependencias = []) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargar = useCallback(funcionDeCarga, dependencias)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setDatos(await cargar())
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [cargar])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    cargar()
      .then((resultado) => !cancelado && setDatos(resultado))
      .catch((e) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setCargando(false))
    return () => {
      cancelado = true
    }
  }, [cargar])

  return { datos, cargando, error, recargar }
}
