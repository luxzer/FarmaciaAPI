import { Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react'
import BotonIcono from '../comunes/BotonIcono'
import { calcularEdad, colorDe, formatearFecha, iniciales, ocultar } from '../../utilidades/formato'

export default function FilaCliente({ cliente, mostrarContacto, onEditar, onEliminar }) {
  const { id, nombres, apellidos, documento, telefono, email, direccion, fechaNacimiento, activo, fechaRegistro } = cliente
  const [color, fondo] = colorDe(id + 2)
  const edad = calcularEdad(fechaNacimiento)
  const mostrar = (texto) => (mostrarContacto ? texto || '—' : ocultar(texto))

  return (
    <article className={`fila-cliente ${activo ? '' : 'inactiva'}`}>
      <span className="avatar" style={{ background: fondo, color }}>{iniciales(nombres, apellidos)}</span>

      <div className="fila-cliente-nombre">
        <h3>{nombres} {apellidos}</h3>
        <p>
          <span className="mono">{documento}</span>
          {edad !== null && <span> · {edad} años</span>}
        </p>
      </div>

      <ul className="fila-cliente-contacto">
        <li><Phone size={14} aria-hidden="true" /><span>{mostrar(telefono)}</span></li>
        <li><Mail size={14} aria-hidden="true" /><span>{mostrar(email)}</span></li>
        {mostrarContacto && direccion && (
          <li className="fila-cliente-direccion"><MapPin size={14} aria-hidden="true" /><span>{direccion}</span></li>
        )}
      </ul>

      <div className="fila-cliente-meta">
        <span className={`insignia ${activo ? 'insignia-normal' : ''}`}>{activo ? 'Activo' : 'Inactivo'}</span>
        <span className="dato-tenue">Desde {formatearFecha(fechaRegistro)}</span>
      </div>

      <div className="acciones">
        <BotonIcono icono={Pencil} ayuda="Editar" onClick={onEditar} />
        <BotonIcono icono={Trash2} ayuda="Eliminar" variante="peligro" onClick={onEliminar} />
      </div>
    </article>
  )
}
