import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, FileText, HeartPulse, MapPin, PackageCheck, Stethoscope } from 'lucide-react'
import imagenFarmacia from '../assets/img/farmacia-interior.webp'
import imagenPastillas from '../assets/img/pastillas.webp'
import Seccion from '../componentes/inicio/Seccion'
import NumeroAnimado from '../componentes/inicio/NumeroAnimado'
import Interruptor from '../componentes/comunes/Interruptor'
import IconoCapsula from '../componentes/medicamentos/IconoCapsula'
import { useConsulta } from '../hooks/useConsulta'
import { clientesApi, diagnosticoApi, medicamentosApi } from '../servicios/api'
import { colorDe, formatearMoneda } from '../utilidades/formato'
import { ELEMENTOS } from '../componentes/tres-d/elementos'

// Three.js pesa bastante: las escenas se descargan aparte, solo en esta página.
const EscenaCapsulas = lazy(() => import('../componentes/tres-d/EscenaCapsulas'))
const MoleculaParacetamol = lazy(() => import('../componentes/tres-d/MoleculaParacetamol'))

const SERVICIOS = [
  { icono: FileText, titulo: 'Recetas al momento', texto: 'Validamos tu receta y preparamos el tratamiento completo mientras esperas.' },
  { icono: Stethoscope, titulo: 'Consejo farmacéutico', texto: 'Dosis, interacciones y horarios explicados por un farmacéutico colegiado.' },
  { icono: PackageCheck, titulo: 'Inventario al día', texto: 'Sabemos qué hay en estante antes de que llegues, y te avisamos si falta.' },
]

export default function Inicio() {
  const [etiquetas, setEtiquetas] = useState(true)
  const [girar, setGirar] = useState(true)

  const medicamentos = useConsulta(() => medicamentosApi.listar(), [])
  const clientes = useConsulta(() => clientesApi.listar(), [])
  const salud = useConsulta(() => diagnosticoApi.salud(), [])

  const lista = useMemo(() => medicamentos.datos ?? [], [medicamentos.datos])
  const umbral = salud.datos?.stockMinimoConfigurado ?? 50
  const destacados = useMemo(() => [...lista].sort((a, b) => b.stock - a.stock).slice(0, 5), [lista])

  const cifras = [
    { texto: 'Medicamentos en catálogo', valor: medicamentos.datos ? lista.length : null },
    { texto: 'Unidades en estante', valor: medicamentos.datos ? lista.reduce((t, m) => t + m.stock, 0) : null },
    { texto: 'Pacientes registrados', valor: clientes.datos ? clientes.datos.length : null },
    { texto: 'Con stock bajo', valor: medicamentos.datos ? lista.filter((m) => m.stock <= umbral).length : null, alerta: true },
  ]

  return (
    <>
      <section className="hero">
        <div className="hero-principal">
          <div className="hero-escena" aria-hidden="true">
            <Suspense fallback={null}>
              <EscenaCapsulas />
            </Suspense>
          </div>
          <div className="contenedor hero-contenido">
            <p className="hero-sello">
              <HeartPulse size={16} aria-hidden="true" /> {salud.datos?.ciudad ?? 'Santo Domingo'} · Abierto hasta las 22:00
            </p>
            <h1>Farmacia La Salud</h1>
            <p className="hero-texto">
              Tu tratamiento listo, explicado y a tiempo. Medicamentos con y sin receta, y un farmacéutico que conoce tu historial.
            </p>
            <div className="hero-acciones">
              <Link to="/medicamentos" className="boton boton-primario boton-grande">
                Ver medicamentos <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/clientes" className="boton boton-claro boton-grande">Pacientes</Link>
            </div>
          </div>
        </div>
        <div className="hero-cifras">
          <div className="contenedor hero-cifras-rejilla">
            {cifras.map(({ texto, valor, alerta }) => (
              <div key={texto} className={`cifra ${alerta && valor ? 'cifra-alerta' : ''}`}>
                <strong><NumeroAnimado valor={valor} /></strong>
                <span>{texto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Seccion
        antetitulo="En estante hoy"
        titulo="Lo más disponible"
        accion={
          <Link to="/medicamentos" className="enlace-flecha">
            Todo el catálogo <ArrowRight size={16} aria-hidden="true" />
          </Link>
        }
      >
        <div className="destacados">
          <img className="destacados-imagen" src={imagenPastillas} alt="Cápsulas y tabletas de varios colores" />
          <ol className="lista-destacados">
            {medicamentos.error && <li className="dato-tenue">{medicamentos.error}</li>}
            {!medicamentos.datos && !medicamentos.error &&
              Array.from({ length: 5 }, (_, i) => <li key={i} className="esqueleto esqueleto-linea" />)}
            {destacados.map((m) => (
              <li key={m.id}>
                <IconoCapsula color={colorDe(m.id)[0]} />
                <div>
                  <strong>{m.nombre}</strong>
                  <span>{m.laboratorio}{m.requiereReceta ? ' · Con receta' : ''}</span>
                </div>
                <span className="lista-destacados-precio">{formatearMoneda(m.precio)}</span>
              </li>
            ))}
          </ol>
        </div>
      </Seccion>

      <Seccion tono="menta" antetitulo="Cómo te atendemos" titulo="Más que un mostrador">
        <ul className="servicios">
          {SERVICIOS.map(({ icono: Icono, titulo, texto }) => (
            <li key={titulo}>
              <span className="servicios-icono"><Icono size={22} aria-hidden="true" /></span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion antetitulo="Paracetamol · C₈H₉NO₂" titulo="Lo que hay dentro de una tableta">
        <div className="molecula">
          <div className="molecula-lienzo">
            <Suspense fallback={<div className="esqueleto molecula-cargando" />}>
              <MoleculaParacetamol etiquetas={etiquetas} girar={girar} />
            </Suspense>
          </div>
          <div className="molecula-texto">
            <p>
              El paracetamol es el analgésico más dispensado del país. Su molécula es pequeña: un anillo de benceno con un
              grupo hidroxilo en un extremo y una acetamida en el otro. Arrástrala para verla desde cualquier ángulo.
            </p>
            <ul className="leyenda">
              {Object.entries({ C: 8, H: 9, N: 1, O: 2 }).map(([simbolo, cuenta]) => (
                <li key={simbolo}>
                  <span className="leyenda-atomo" style={{ background: ELEMENTOS[simbolo].color }} />
                  {ELEMENTOS[simbolo].nombre}
                  <span className="mono">×{cuenta}</span>
                </li>
              ))}
            </ul>
            <div className="molecula-controles">
              <Interruptor activo={etiquetas} onCambiar={setEtiquetas}>Símbolos</Interruptor>
              <Interruptor activo={girar} onCambiar={setGirar}>Rotación</Interruptor>
            </div>
          </div>
        </div>
      </Seccion>

      <section className="banda-visita">
        <img src={imagenFarmacia} alt="Interior de Farmacia La Salud con estanterías de productos" />
        <div className="contenedor banda-visita-texto">
          <p className="antetitulo">Visítanos</p>
          <h2>Av. Abraham Lincoln #305</h2>
          <ul className="pie-lista">
            <li><MapPin size={16} aria-hidden="true" /> {salud.datos?.ciudad ?? 'Santo Domingo'}, República Dominicana</li>
            <li><Clock size={16} aria-hidden="true" /> Lun–Sáb 8:00–22:00 · Dom 9:00–18:00</li>
          </ul>
        </div>
      </section>
    </>
  )
}
