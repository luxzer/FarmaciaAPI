import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'
import logo from '../../assets/logo.svg'
import BotonIcono from '../comunes/BotonIcono'
import { diagnosticoApi } from '../../servicios/api'

const ENLACES = [
  { ruta: '/', texto: 'Inicio' },
  { ruta: '/medicamentos', texto: 'Medicamentos' },
  { ruta: '/clientes', texto: 'Clientes' },
  { ruta: '/panel', texto: 'Panel' },
]

function leerTemaGuardado() {
  try {
    return localStorage.getItem('tema') ?? 'claro'
  } catch {
    return 'claro'
  }
}

export default function Encabezado() {
  const [tema, setTema] = useState(leerTemaGuardado)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [conectada, setConectada] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'oscuro' ? 'dark' : 'light'
    try {
      localStorage.setItem('tema', tema)
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [tema])

  useEffect(() => {
    const revisar = () =>
      diagnosticoApi
        .salud()
        .then((s) => setConectada(s.baseDatos === 'conectada'))
        .catch(() => setConectada(false))
    revisar()
    const intervalo = setInterval(revisar, 30_000)
    return () => clearInterval(intervalo)
  }, [])

  const textoEstado =
    conectada === null ? 'Comprobando API…' : conectada ? 'API conectada' : 'API sin conexión'

  return (
    <header className="encabezado">
      <div className="contenedor encabezado-barra">
        <NavLink to="/" className="marca" onClick={() => setMenuAbierto(false)}>
          <img src={logo} alt="" width="34" height="34" />
          <span>
            Farmacia <strong>La Salud</strong>
          </span>
        </NavLink>

        <nav className={`navegacion ${menuAbierto ? 'abierta' : ''}`} aria-label="Principal">
          {ENLACES.map(({ ruta, texto }) => (
            <NavLink key={ruta} to={ruta} end={ruta === '/'} onClick={() => setMenuAbierto(false)}>
              {texto}
            </NavLink>
          ))}
        </nav>
        {menuAbierto &&
          createPortal(<div className="menu-fondo" onClick={() => setMenuAbierto(false)} />, document.body)}

        <div className="encabezado-acciones">
          <span
            className={`estado-api ${conectada === null ? '' : conectada ? 'ok' : 'caida'}`}
            data-ayuda={textoEstado}
            aria-label={textoEstado}
            role="status"
          >
            <span className="punto" />
            <span className="estado-api-texto">API</span>
          </span>
          <BotonIcono
            icono={tema === 'oscuro' ? Sun : Moon}
            ayuda={tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}
            onClick={() => setTema(tema === 'oscuro' ? 'claro' : 'oscuro')}
          />
          <BotonIcono
            icono={menuAbierto ? X : Menu}
            ayuda={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            variante="solo-movil"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}
          />
        </div>
      </div>
    </header>
  )
}
