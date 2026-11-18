// Interruptor de encendido/apagado. El estado lo guarda el componente padre.
export default function Interruptor({ activo, onCambiar, etiqueta, children }) {
  return (
    <label className="interruptor">
      <input
        type="checkbox"
        role="switch"
        checked={activo}
        onChange={(e) => onCambiar(e.target.checked)}
        aria-label={etiqueta}
      />
      <span className="interruptor-pista" aria-hidden="true">
        <span className="interruptor-perilla" />
      </span>
      {children && <span className="interruptor-texto">{children}</span>}
    </label>
  )
}
