import { useState } from 'react'
import Contador from '../comunes/Contador'
import Interruptor from '../comunes/Interruptor'

const VACIO = {
  nombre: '',
  laboratorio: '',
  descripcion: '',
  precio: '',
  stock: 0,
  requiereReceta: false,
  fechaVencimiento: '',
  activo: true,
}

export default function FormularioMedicamento({ inicial, guardando, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(() => ({ ...VACIO, ...inicial }))
  const cambiar = (campo) => (valor) => setValores((v) => ({ ...v, [campo]: valor }))
  const alEscribir = (campo) => (e) => cambiar(campo)(e.target.value)

  const alEnviar = (e) => {
    e.preventDefault()
    onGuardar({
      ...valores,
      precio: Number(valores.precio),
      descripcion: valores.descripcion || null,
      fechaVencimiento: valores.fechaVencimiento || null,
    })
  }

  return (
    <form className="formulario" onSubmit={alEnviar}>
      <div className="campo campo-ancho">
        <label htmlFor="m-nombre">Nombre</label>
        <input id="m-nombre" required minLength={3} maxLength={150} value={valores.nombre} onChange={alEscribir('nombre')} placeholder="Paracetamol 500mg" autoFocus />
      </div>
      <div className="campo">
        <label htmlFor="m-lab">Laboratorio</label>
        <input id="m-lab" required maxLength={100} value={valores.laboratorio} onChange={alEscribir('laboratorio')} />
      </div>
      <div className="campo">
        <label htmlFor="m-precio">Precio (RD$)</label>
        <input id="m-precio" type="number" required min="0" step="0.01" value={valores.precio} onChange={alEscribir('precio')} />
      </div>
      <div className="campo campo-ancho">
        <label htmlFor="m-desc">Descripción</label>
        <textarea id="m-desc" rows={2} maxLength={1000} value={valores.descripcion ?? ''} onChange={alEscribir('descripcion')} />
      </div>
      <div className="campo">
        <span className="etiqueta">Stock</span>
        <Contador valor={valores.stock} onCambiar={cambiar('stock')} minimo={0} paso={10} etiqueta="Stock" />
      </div>
      <div className="campo">
        <label htmlFor="m-vence">Vencimiento</label>
        <input id="m-vence" type="date" value={valores.fechaVencimiento ?? ''} onChange={alEscribir('fechaVencimiento')} />
      </div>
      <div className="campo campo-ancho campo-interruptores">
        <Interruptor activo={valores.requiereReceta} onCambiar={cambiar('requiereReceta')}>Requiere receta</Interruptor>
        <Interruptor activo={valores.activo} onCambiar={cambiar('activo')}>Activo en catálogo</Interruptor>
      </div>
      <div className="formulario-acciones">
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
