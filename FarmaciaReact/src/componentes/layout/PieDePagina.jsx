import { Link } from 'react-router-dom'
import { Clock, MapPin, Phone } from 'lucide-react'
import logo from '../../assets/logo.svg'

export default function PieDePagina() {
  return (
    <footer className="pie">
      <div className="contenedor pie-rejilla">
        <div className="pie-marca">
          <div className="marca">
            <img src={logo} alt="" width="34" height="34" />
            <span>
              Farmacia <strong>La Salud</strong>
            </span>
          </div>
          <p>Medicamentos, receta y seguimiento de pacientes en Santo Domingo.</p>
        </div>

        <div>
          <h4>Visítanos</h4>
          <ul className="pie-lista">
            <li><MapPin size={16} aria-hidden="true" /> Av. Abraham Lincoln #305, Santo Domingo</li>
            <li><Phone size={16} aria-hidden="true" /> 809-555-0100</li>
            <li><Clock size={16} aria-hidden="true" /> Lun–Sáb 8:00–22:00 · Dom 9:00–18:00</li>
          </ul>
        </div>

        <div>
          <h4>Secciones</h4>
          <ul className="pie-lista">
            <li><Link to="/medicamentos">Medicamentos</Link></li>
            <li><Link to="/clientes">Clientes</Link></li>
            <li><Link to="/panel">Panel de la API</Link></li>
          </ul>
        </div>

        <div>
          <h4>Equipo</h4>
          <ul className="pie-lista">
            <li>Luis Calderón · 22-1392</li>
            <li>Rafael Ureña · 22-1836</li>
          </ul>
        </div>
      </div>
      <div className="contenedor pie-legal">
        <span>© {new Date().getFullYear()} Farmacia La Salud</span>
        <span>React + Vite · ASP.NET Core 9 · MySQL 8.4</span>
      </div>
    </footer>
  )
}
