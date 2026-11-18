export default function ControlSegmentado({ opciones, valor, onCambiar, etiqueta }) {
  return (
    <div className="segmentado" role="radiogroup" aria-label={etiqueta}>
      {opciones.map(({ valor: v, texto, icono: Icono, cuenta }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valor === v}
          aria-label={Icono && !texto ? v : undefined}
          data-ayuda={Icono && !texto ? v : undefined}
          className={valor === v ? 'activo' : ''}
          onClick={() => onCambiar(v)}
        >
          {Icono && <Icono size={16} aria-hidden="true" />}
          {texto && <span>{texto}</span>}
          {cuenta !== undefined && <span className="segmentado-cuenta">{cuenta}</span>}
        </button>
      ))}
    </div>
  )
}
