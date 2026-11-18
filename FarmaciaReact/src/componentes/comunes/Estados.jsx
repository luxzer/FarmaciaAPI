import { RotateCw, SearchX, WifiOff } from 'lucide-react'

export function Cargando({ filas = 6, tipo = 'tarjeta' }) {
  return (
    <div className={`esqueletos esqueletos-${tipo}`} aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="esqueleto" />
      ))}
    </div>
  )
}

export function ErrorConexion({ mensaje, onReintentar }) {
  return (
    <div className="estado-vacio estado-error" role="alert">
      <WifiOff size={28} aria-hidden="true" />
      <h3>Sin conexión con la API</h3>
      <p>{mensaje}</p>
      {onReintentar && (
        <button type="button" className="boton boton-secundario" onClick={onReintentar}>
          <RotateCw size={16} aria-hidden="true" /> Reintentar
        </button>
      )}
    </div>
  )
}

export function SinResultados({ titulo = 'Sin resultados', children }) {
  return (
    <div className="estado-vacio">
      <SearchX size={28} aria-hidden="true" />
      <h3>{titulo}</h3>
      {children}
    </div>
  )
}
