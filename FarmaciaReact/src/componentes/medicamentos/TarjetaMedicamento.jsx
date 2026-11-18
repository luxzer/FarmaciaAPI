import { FileText, Pencil, ShoppingBag, Trash2 } from 'lucide-react'
import BotonIcono from '../comunes/BotonIcono'
import IconoCapsula from './IconoCapsula'
import { colorDe, formatearFecha, formatearMoneda } from '../../utilidades/formato'
import { estadoStock, estadoVencimiento, porcentajeStock } from './estadoMedicamento'

export default function TarjetaMedicamento({ medicamento, umbral, onDispensar, onEditar, onEliminar }) {
  const { id, nombre, laboratorio, descripcion, precio, stock, requiereReceta, fechaVencimiento, activo } = medicamento
  const stockInfo = estadoStock(stock, umbral)
  const vence = estadoVencimiento(fechaVencimiento)
  const [color, fondo] = colorDe(id)

  return (
    <article className={`tarjeta-medicamento ${activo ? '' : 'inactiva'}`}>
      <div className="tarjeta-medicamento-cabeza">
        <span className="icono-cuadro" style={{ background: fondo, color }}>
          <IconoCapsula color={color} />
        </span>
        <div className="tarjeta-medicamento-titulo">
          <h3>{nombre}</h3>
          <p>{laboratorio}</p>
        </div>
        <strong className="precio">{formatearMoneda(precio)}</strong>
      </div>

      {descripcion && <p className="tarjeta-medicamento-descripcion">{descripcion}</p>}

      <div className="insignias">
        {requiereReceta && (
          <span className="insignia insignia-receta">
            <FileText size={13} aria-hidden="true" /> Receta
          </span>
        )}
        {vence && <span className={`insignia insignia-${vence.clase}`}>{vence.texto}</span>}
        {!activo && <span className="insignia">Inactivo</span>}
      </div>

      <div className="stock">
        <div className="stock-fila">
          <span className={`stock-estado ${stockInfo.clase}`}>{stockInfo.texto}</span>
          <span className="stock-numero">{stock} u.</span>
        </div>
        <div className="barra" aria-hidden="true">
          <span className={`barra-relleno ${stockInfo.clase}`} style={{ width: `${porcentajeStock(stock, umbral)}%` }} />
          <span className="barra-umbral" style={{ left: `${porcentajeStock(umbral, umbral)}%` }} />
        </div>
      </div>

      <footer className="tarjeta-medicamento-pie">
        <span className="dato-tenue">Vence {formatearFecha(fechaVencimiento)}</span>
        <div className="acciones">
          <BotonIcono icono={ShoppingBag} ayuda="Dispensar" variante="primario" onClick={onDispensar} disabled={stock <= 0 || !activo} />
          <BotonIcono icono={Pencil} ayuda="Editar" onClick={onEditar} />
          <BotonIcono icono={Trash2} ayuda="Eliminar" variante="peligro" onClick={onEliminar} />
        </div>
      </footer>
    </article>
  )
}
