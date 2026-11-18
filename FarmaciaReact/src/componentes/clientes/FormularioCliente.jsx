import { useState } from 'react'
import Interruptor from '../comunes/Interruptor'

const VACIO = {
  nombres: '',
  apellidos: '',
  documento: '',
  telefono: '',
  email: '',
  direccion: '',
  fechaNacimiento: '',
  activo: true,
}

const sinVacios = (valores) =>
  Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, v === '' ? null : v]))

export default function FormularioCliente({ inicial, guardando, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(() => ({ ...VACIO, ...sinNulos(inicial) }))
  const alEscribir = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  return (
    <form
      className="formulario"
      onSubmit={(e) => {
        e.preventDefault()
        onGuardar(sinVacios(valores))
      }}
    >
      <div className="campo">
        <label htmlFor="c-nombres">Nombres</label>
        <input id="c-nombres" required minLength={2} maxLength={100} value={valores.nombres} onChange={alEscribir('nombres')} autoFocus />
      </div>
      <div className="campo">
        <label htmlFor="c-apellidos">Apellidos</label>
        <input id="c-apellidos" required minLength={2} maxLength={100} value={valores.apellidos} onChange={alEscribir('apellidos')} />
      </div>
      <div className="campo">
        <label htmlFor="c-doc">Cédula / documento</label>
        <input id="c-doc" required minLength={5} maxLength={20} value={valores.documento} onChange={alEscribir('documento')} placeholder="001-1234567-8" />
      </div>
      <div className="campo">
        <label htmlFor="c-nac">Fecha de nacimiento</label>
        <input id="c-nac" type="date" value={valores.fechaNacimiento} onChange={alEscribir('fechaNacimiento')} />
      </div>
      <div className="campo">
        <label htmlFor="c-tel">Teléfono</label>
        <input id="c-tel" type="tel" maxLength={20} value={valores.telefono} onChange={alEscribir('telefono')} placeholder="809-555-0000" />
      </div>
      <div className="campo">
        <label htmlFor="c-email">Correo</label>
        <input id="c-email" type="email" maxLength={150} value={valores.email} onChange={alEscribir('email')} />
      </div>
      <div className="campo campo-ancho">
        <label htmlFor="c-dir">Dirección</label>
        <input id="c-dir" maxLength={250} value={valores.direccion} onChange={alEscribir('direccion')} />
      </div>
      <div className="campo campo-ancho campo-interruptores">
        <Interruptor activo={valores.activo} onCambiar={(activo) => setValores((v) => ({ ...v, activo }))}>
          Cliente activo
        </Interruptor>
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

function sinNulos(objeto = {}) {
  return Object.fromEntries(Object.entries(objeto ?? {}).map(([k, v]) => [k, v ?? '']))
}
