import { useEffect, useRef, useState } from 'react'

// Cuenta desde el valor anterior hasta el nuevo en ~1 segundo.
export default function NumeroAnimado({ valor, formato = (n) => Math.round(n).toLocaleString('es-DO') }) {
  const [mostrado, setMostrado] = useState(0)
  const desde = useRef(0)

  useEffect(() => {
    if (valor === null || valor === undefined) return
    const inicio = performance.now()
    const origen = desde.current
    let cuadro
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / 1000)
      const suave = 1 - Math.pow(1 - t, 3)
      setMostrado(origen + (valor - origen) * suave)
      if (t < 1) cuadro = requestAnimationFrame(paso)
      else desde.current = valor
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor])

  if (valor === null || valor === undefined) return <span className="numero-vacio">—</span>
  return <span>{formato(mostrado)}</span>
}
