import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Database, PackageMinus, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react'
import imagenCapsulas from '../assets/img/capsulas.webp'
import CabeceraPagina from '../componentes/comunes/CabeceraPagina'
import BotonIcono from '../componentes/comunes/BotonIcono'
import Contador from '../componentes/comunes/Contador'
import ControlSegmentado from '../componentes/comunes/ControlSegmentado'
import Interruptor from '../componentes/comunes/Interruptor'
import { Cargando, ErrorConexion, SinResultados } from '../componentes/comunes/Estados'
import { estadoStock, porcentajeStock } from '../componentes/medicamentos/estadoMedicamento'
import { useConsulta } from '../hooks/useConsulta'
import { diagnosticoApi, medicamentosApi } from '../servicios/api'
import { formatearFecha } from '../utilidades/formato'

const ICONOS_OPERACION = { CREATE: Plus, UPDATE: Pencil, DELETE: Trash2 }
const TEXTO_OPERACION = { CREATE: 'Alta', UPDATE: 'Cambio', DELETE: 'Baja' }

export default function Panel() {
  const [autoActualizar, setAutoActualizar] = useState(true)
  const [cantidad, setCantidad] = useState(15)
  const [entidad, setEntidad] = useState('todas')

  const salud = useConsulta(() => diagnosticoApi.salud(), [])
  const stockBajo = useConsulta(() => medicamentosApi.stockBajo(), [])
  const auditoria = useConsulta(() => diagnosticoApi.auditoria(cantidad), [cantidad])

  const recargarTodo = () => {
    salud.recargar()
    stockBajo.recargar()
    auditoria.recargar()
  }

  useEffect(() => {
    if (!autoActualizar) return
    const intervalo = setInterval(recargarTodo, 15_000)
    return () => clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoActualizar, salud.recargar, stockBajo.recargar, auditoria.recargar])

  const s = salud.datos
  const conectada = s?.baseDatos === 'conectada'
  const registros = (auditoria.datos ?? []).filter((r) => entidad === 'todas' || r.entidad === entidad)

  return (
    <>
      <CabeceraPagina imagen={imagenCapsulas} antetitulo="Diagnóstico" titulo="Panel de la API">
        <Interruptor activo={autoActualizar} onCambiar={setAutoActualizar}>
          Actualizar cada 15 s
        </Interruptor>
        <BotonIcono icono={RotateCw} ayuda="Actualizar ahora" onClick={recargarTodo} />
      </CabeceraPagina>

      <section className="contenedor pagina-cuerpo panel-rejilla">
        <div className="panel-bloque panel-salud">
          <h2><Activity size={18} aria-hidden="true" /> Estado del servicio</h2>
          {salud.error ? (
            <ErrorConexion mensaje={salud.error} onReintentar={salud.recargar} />
          ) : !s ? (
            <Cargando filas={3} tipo="fila" />
          ) : (
            <>
              <div className={`pulso ${conectada ? 'ok' : 'caida'}`}>
                <span className="pulso-punto" />
                <div>
                  <strong>{conectada ? 'Operativa' : 'Base de datos sin conexión'}</strong>
                  <span>Última respuesta {formatearFecha(s.fechaServidor, true)}</span>
                </div>
              </div>
              <dl className="lista-config">
                <div><dt>Farmacia</dt><dd>{s.farmacia}</dd></div>
                <div><dt>RNC</dt><dd className="mono">{s.rnc ?? '—'}</dd></div>
                <div><dt>Ciudad</dt><dd>{s.ciudad}</dd></div>
                <div><dt>Stock mínimo</dt><dd>{s.stockMinimoConfigurado} u.</dd></div>
                <div><dt>Auditoría</dt><dd>{s.auditoriaHabilitada ? 'Habilitada' : 'Deshabilitada'}</dd></div>
                <div><dt><Database size={14} aria-hidden="true" /> Motor</dt><dd>{s.motorBaseDatos}</dd></div>
              </dl>
            </>
          )}
        </div>

        <div className="panel-bloque">
          <div className="panel-bloque-cabeza">
            <h2><PackageMinus size={18} aria-hidden="true" /> Stock bajo</h2>
            {stockBajo.datos && <span className="insignia insignia-alerta">{stockBajo.datos.total} de umbral {stockBajo.datos.umbral}</span>}
          </div>
          {stockBajo.error ? (
            <ErrorConexion mensaje={stockBajo.error} />
          ) : !stockBajo.datos ? (
            <Cargando filas={4} tipo="fila" />
          ) : stockBajo.datos.total === 0 ? (
            <SinResultados titulo="Todo el inventario está sobre el mínimo" />
          ) : (
            <ul className="lista-stock">
              {stockBajo.datos.medicamentos.map((m) => {
                const info = estadoStock(m.stock, stockBajo.datos.umbral)
                return (
                  <li key={m.id}>
                    <div className="stock-fila">
                      <span>{m.nombre}</span>
                      <span className={`stock-estado ${info.clase}`}>{m.stock} u.</span>
                    </div>
                    <div className="barra" aria-hidden="true">
                      <span className={`barra-relleno ${info.clase}`} style={{ width: `${porcentajeStock(m.stock, stockBajo.datos.umbral / 3)}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <Link to="/medicamentos?filtro=bajo" className="enlace-flecha">
            Reabastecer en inventario <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="panel-bloque panel-auditoria">
          <div className="panel-bloque-cabeza">
            <h2>Bitácora de auditoría</h2>
            <div className="panel-controles">
              <ControlSegmentado
                etiqueta="Entidad"
                valor={entidad}
                onCambiar={setEntidad}
                opciones={[
                  { valor: 'todas', texto: 'Todas' },
                  { valor: 'medicamentos', texto: 'Medicamentos' },
                  { valor: 'clientes', texto: 'Clientes' },
                ]}
              />
              <Contador valor={cantidad} onCambiar={setCantidad} minimo={5} maximo={200} paso={5} etiqueta="Registros a mostrar" />
            </div>
          </div>
          {auditoria.error ? (
            <ErrorConexion mensaje={auditoria.error} onReintentar={auditoria.recargar} />
          ) : !auditoria.datos ? (
            <Cargando filas={5} tipo="fila" />
          ) : registros.length === 0 ? (
            <SinResultados titulo="Sin movimientos" />
          ) : (
            <ol className="linea-tiempo">
              {registros.map((r) => {
                const Icono = ICONOS_OPERACION[r.operacion] ?? Pencil
                return (
                  <li key={r.id} className={`op-${r.operacion.toLowerCase()}`}>
                    <span className="linea-tiempo-icono"><Icono size={14} aria-hidden="true" /></span>
                    <div className="linea-tiempo-cuerpo">
                      <p>{r.detalle}</p>
                      <span className="dato-tenue">
                        {TEXTO_OPERACION[r.operacion] ?? r.operacion} · {r.entidad} #{r.idRegistro} · {r.usuario}
                      </span>
                    </div>
                    <time className="dato-tenue">{formatearFecha(r.fecha, true)}</time>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </section>
    </>
  )
}
