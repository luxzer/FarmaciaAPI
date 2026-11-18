import { Minus, Plus } from 'lucide-react'
import BotonIcono from './BotonIcono'

// Contador controlado: el padre guarda el valor y lo recibe de vuelta en onCambiar.
export default function Contador({ valor, onCambiar, minimo = 0, maximo = Infinity, paso = 1, etiqueta }) {
  const limitar = (n) => Math.min(maximo, Math.max(minimo, n))

  return (
    <div className="contador" role="group" aria-label={etiqueta}>
      <BotonIcono
        icono={Minus}
        ayuda="Restar"
        onClick={() => onCambiar(limitar(valor - paso))}
        disabled={valor <= minimo}
      />
      <input
        className="contador-valor"
        type="number"
        inputMode="numeric"
        value={valor}
        min={minimo}
        max={Number.isFinite(maximo) ? maximo : undefined}
        aria-label={etiqueta}
        onChange={(e) => onCambiar(limitar(Number(e.target.value) || 0))}
      />
      <BotonIcono
        icono={Plus}
        ayuda="Sumar"
        onClick={() => onCambiar(limitar(valor + paso))}
        disabled={valor >= maximo}
      />
    </div>
  )
}
