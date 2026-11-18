import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SinResultados } from '../componentes/comunes/Estados'

export default function NoEncontrada() {
  return (
    <section className="contenedor pagina-cuerpo pagina-404">
      <SinResultados titulo="Esta página no existe">
        <Link to="/" className="boton boton-secundario">
          <ArrowLeft size={16} aria-hidden="true" /> Volver al inicio
        </Link>
      </SinResultados>
    </section>
  )
}
