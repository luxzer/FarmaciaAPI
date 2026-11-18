export default function BotonIcono({ icono: Icono, ayuda, variante = '', tamano = 18, ...resto }) {
  return (
    <button
      type="button"
      className={`boton-icono ${variante}`}
      aria-label={ayuda}
      data-ayuda={ayuda}
      {...resto}
    >
      <Icono size={tamano} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
