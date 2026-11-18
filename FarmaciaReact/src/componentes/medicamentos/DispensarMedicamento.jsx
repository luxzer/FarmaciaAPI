import { useState } from 'react'
import { FileText } from 'lucide-react'
import Contador from '../comunes/Contador'
import Interruptor from '../comunes/Interruptor'
import { formatearMoneda } from '../../utilidades/formato'

export default function DispensarMedicamento({ medicamento, guardando, onConfirmar, onCancelar }) {
  const [cantidad, setCantidad] = useState(1)
  const [recetaVerificada, setRecetaVerificada] = useState(false)
  const { precio, stock, requiereReceta } = medicamento
  const bloqueado = requiereReceta && !recetaVerificada

  return (
    <div className="dispensar">
      <div className="dispensar-fila">
        <div>
          <span className="etiqueta">Cantidad</span>
          <p className="dato-tenue">{stock} unidades en inventario</p>
        </div>
        <Contador valor={cantidad} onCambiar={setCantidad} minimo={1} maximo={stock} etiqueta="Cantidad a dispensar" />
      </div>

      {requiereReceta && (
        <div className="dispensar-receta">
          <FileText size={18} aria-hidden="true" />
          <Interruptor activo={recetaVerificada} onCambiar={setRecetaVerificada}>
            Receta médica verificada
          </Interruptor>
        </div>
      )}

      <dl className="dispensar-resumen">
        <div><dt>Precio unitario</dt><dd>{formatearMoneda(precio)}</dd></div>
        <div><dt>Quedarán</dt><dd>{stock - cantidad} u.</dd></div>
        <div className="total"><dt>Total</dt><dd>{formatearMoneda(precio * cantidad)}</dd></div>
      </dl>

      <div className="formulario-acciones">
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="button" className="boton boton-primario" disabled={bloqueado || guardando} onClick={() => onConfirmar(cantidad)}>
          {guardando ? 'Registrando…' : `Dispensar ${cantidad}`}
        </button>
      </div>
    </div>
  )
}
