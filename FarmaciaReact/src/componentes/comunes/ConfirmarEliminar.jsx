import Modal from './Modal'

export default function ConfirmarEliminar({ abierto, nombre, guardando, onConfirmar, onCerrar }) {
  return (
    <Modal abierto={abierto} titulo="Eliminar registro" onCerrar={onCerrar} ancho={420}>
      <p className="modal-texto">
        Se eliminará <strong>{nombre}</strong> de la base de datos. Esta acción queda en la bitácora de auditoría y no se puede deshacer.
      </p>
      <div className="formulario-acciones">
        <button type="button" className="boton boton-secundario" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="boton boton-peligro" disabled={guardando} onClick={onConfirmar}>
          {guardando ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  )
}
