import { FileText, Pencil, ShoppingBag, Trash2 } from 'lucide-react'
import BotonIcono from '../comunes/BotonIcono'
import IconoCapsula from './IconoCapsula'
import { colorDe, formatearFecha, formatearMoneda } from '../../utilidades/formato'
import { estadoStock, estadoVencimiento } from './estadoMedicamento'

export default function TablaMedicamentos({ medicamentos, umbral, onDispensar, onEditar, onEliminar }) {
  return (
    <div className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Laboratorio</th>
            <th className="num">Precio</th>
            <th className="num">Stock</th>
            <th>Vencimiento</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {medicamentos.map((m) => {
            const stockInfo = estadoStock(m.stock, umbral)
            const vence = estadoVencimiento(m.fechaVencimiento)
            return (
              <tr key={m.id} className={m.activo ? '' : 'inactiva'}>
                <td>
                  <div className="celda-principal">
                    <IconoCapsula color={colorDe(m.id)[0]} tamano={18} />
                    <span>{m.nombre}</span>
                    {m.requiereReceta && (
                      <FileText size={14} className="icono-receta" aria-label="Requiere receta" />
                    )}
                  </div>
                </td>
                <td className="dato-tenue">{m.laboratorio}</td>
                <td className="num">{formatearMoneda(m.precio)}</td>
                <td className="num">
                  <span className={`stock-estado ${stockInfo.clase}`}>{m.stock}</span>
                </td>
                <td>
                  {vence ? (
                    <span className={`insignia insignia-${vence.clase}`}>{vence.texto}</span>
                  ) : (
                    <span className="dato-tenue">{formatearFecha(m.fechaVencimiento)}</span>
                  )}
                </td>
                <td>
                  <div className="acciones">
                    <BotonIcono icono={ShoppingBag} ayuda="Dispensar" variante="primario" onClick={() => onDispensar(m)} disabled={m.stock <= 0 || !m.activo} />
                    <BotonIcono icono={Pencil} ayuda="Editar" onClick={() => onEditar(m)} />
                    <BotonIcono icono={Trash2} ayuda="Eliminar" variante="peligro" onClick={() => onEliminar(m)} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
