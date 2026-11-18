import { useEffect } from 'react'
import { X } from 'lucide-react'
import BotonIcono from './BotonIcono'

// El contenido del modal llega como children desde el componente padre.
export default function Modal({ abierto, titulo, subtitulo, onCerrar, children, ancho = 520 }) {
  useEffect(() => {
    if (!abierto) return
    const alPresionar = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alPresionar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" style={{ maxWidth: ancho }}>
        <header className="modal-cabecera">
          <div>
            <h2 id="modal-titulo">{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <BotonIcono icono={X} ayuda="Cerrar" onClick={onCerrar} />
        </header>
        {children}
      </div>
    </div>
  )
}
