import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, Plus, Rows3, Search } from 'lucide-react'
import imagenBlisteres from '../assets/img/blisteres.webp'
import CabeceraPagina from '../componentes/comunes/CabeceraPagina'
import ControlSegmentado from '../componentes/comunes/ControlSegmentado'
import Modal from '../componentes/comunes/Modal'
import ConfirmarEliminar from '../componentes/comunes/ConfirmarEliminar'
import { Cargando, ErrorConexion, SinResultados } from '../componentes/comunes/Estados'
import { useAvisos } from '../componentes/comunes/Avisos'
import TarjetaMedicamento from '../componentes/medicamentos/TarjetaMedicamento'
import TablaMedicamentos from '../componentes/medicamentos/TablaMedicamentos'
import FormularioMedicamento from '../componentes/medicamentos/FormularioMedicamento'
import DispensarMedicamento from '../componentes/medicamentos/DispensarMedicamento'
import { estadoVencimiento } from '../componentes/medicamentos/estadoMedicamento'
import { useConsulta } from '../hooks/useConsulta'
import { diagnosticoApi, medicamentosApi } from '../servicios/api'
import { formatearMoneda } from '../utilidades/formato'

const UMBRAL_POR_DEFECTO = 50

function usarRetraso(valor, ms = 300) {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return retrasado
}

export default function Medicamentos() {
  const avisar = useAvisos()
  const [parametros, setParametros] = useSearchParams()
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState('cuadricula')
  const filtro = parametros.get('filtro') ?? 'todos'
  const [modal, setModal] = useState(null) // { tipo: 'crear' | 'editar' | 'dispensar' | 'eliminar', medicamento }
  const [guardando, setGuardando] = useState(false)

  const terminoBuscado = usarRetraso(busqueda)
  const { datos, cargando, error, recargar } = useConsulta(() => medicamentosApi.listar(terminoBuscado), [terminoBuscado])
  const { datos: salud } = useConsulta(() => diagnosticoApi.salud(), [])
  const umbral = salud?.stockMinimoConfigurado ?? UMBRAL_POR_DEFECTO

  const medicamentos = useMemo(() => datos ?? [], [datos])
  const cuentas = useMemo(
    () => ({
      todos: medicamentos.length,
      receta: medicamentos.filter((m) => m.requiereReceta).length,
      bajo: medicamentos.filter((m) => m.stock <= umbral).length,
      vence: medicamentos.filter((m) => estadoVencimiento(m.fechaVencimiento)).length,
    }),
    [medicamentos, umbral],
  )

  const visibles = useMemo(() => {
    const filtros = {
      todos: () => true,
      receta: (m) => m.requiereReceta,
      bajo: (m) => m.stock <= umbral,
      vence: (m) => estadoVencimiento(m.fechaVencimiento),
    }
    return medicamentos.filter(filtros[filtro] ?? filtros.todos)
  }, [medicamentos, filtro, umbral])

  const valorInventario = medicamentos.reduce((total, m) => total + m.precio * m.stock, 0)
  const cerrar = () => !guardando && setModal(null)

  async function ejecutar(accion, mensaje) {
    setGuardando(true)
    try {
      await accion()
      avisar(mensaje)
      setModal(null)
      recargar()
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  const guardar = (dto) =>
    modal.tipo === 'crear'
      ? ejecutar(() => medicamentosApi.crear(dto), `${dto.nombre} agregado al inventario`)
      : ejecutar(() => medicamentosApi.actualizar(modal.medicamento.id, dto), `${dto.nombre} actualizado`)

  const dispensar = (cantidad) => {
    const m = modal.medicamento
    ejecutar(
      () => medicamentosApi.actualizar(m.id, { ...m, stock: m.stock - cantidad }),
      `Dispensadas ${cantidad} u. de ${m.nombre} · ${formatearMoneda(m.precio * cantidad)}`,
    )
  }

  const eliminar = () =>
    ejecutar(() => medicamentosApi.eliminar(modal.medicamento.id), `${modal.medicamento.nombre} eliminado`)

  const acciones = (m) => ({
    onDispensar: () => setModal({ tipo: 'dispensar', medicamento: m }),
    onEditar: () => setModal({ tipo: 'editar', medicamento: m }),
    onEliminar: () => setModal({ tipo: 'eliminar', medicamento: m }),
  })

  return (
    <>
      <CabeceraPagina
        imagen={imagenBlisteres}
        antetitulo="Inventario"
        titulo="Medicamentos"
        descripcion={`Umbral de stock mínimo: ${umbral} unidades`}
      >
        <div className="metrica-cabecera">
          <span>Valor del inventario</span>
          <strong>{formatearMoneda(valorInventario)}</strong>
        </div>
        <button type="button" className="boton boton-primario" onClick={() => setModal({ tipo: 'crear' })}>
          <Plus size={18} aria-hidden="true" /> Nuevo
        </button>
      </CabeceraPagina>

      <section className="contenedor pagina-cuerpo">
        <div className="barra-herramientas">
          <label className="buscador">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar medicamentos"
            />
          </label>
          <ControlSegmentado
            etiqueta="Filtro"
            valor={filtro}
            onCambiar={(v) => setParametros(v === 'todos' ? {} : { filtro: v })}
            opciones={[
              { valor: 'todos', texto: 'Todos', cuenta: cuentas.todos },
              { valor: 'receta', texto: 'Con receta', cuenta: cuentas.receta },
              { valor: 'bajo', texto: 'Stock bajo', cuenta: cuentas.bajo },
              { valor: 'vence', texto: 'Por vencer', cuenta: cuentas.vence },
            ]}
          />
          <ControlSegmentado
            etiqueta="Vista"
            valor={vista}
            onCambiar={setVista}
            opciones={[
              { valor: 'cuadricula', icono: LayoutGrid },
              { valor: 'tabla', icono: Rows3 },
            ]}
          />
        </div>

        {error ? (
          <ErrorConexion mensaje={error} onReintentar={recargar} />
        ) : cargando && !datos ? (
          <Cargando tipo={vista === 'tabla' ? 'fila' : 'tarjeta'} />
        ) : visibles.length === 0 ? (
          <SinResultados titulo="Ningún medicamento coincide">
            <p>Prueba con otro nombre o cambia el filtro.</p>
          </SinResultados>
        ) : vista === 'tabla' ? (
          <TablaMedicamentos
            medicamentos={visibles}
            umbral={umbral}
            onDispensar={(m) => acciones(m).onDispensar()}
            onEditar={(m) => acciones(m).onEditar()}
            onEliminar={(m) => acciones(m).onEliminar()}
          />
        ) : (
          <div className="rejilla-medicamentos">
            {visibles.map((m) => (
              <TarjetaMedicamento key={m.id} medicamento={m} umbral={umbral} {...acciones(m)} />
            ))}
          </div>
        )}
      </section>

      <Modal
        abierto={modal?.tipo === 'crear' || modal?.tipo === 'editar'}
        titulo={modal?.tipo === 'crear' ? 'Nuevo medicamento' : 'Editar medicamento'}
        subtitulo={modal?.medicamento?.nombre}
        onCerrar={cerrar}
        ancho={620}
      >
        <FormularioMedicamento
          key={modal?.medicamento?.id ?? 'nuevo'}
          inicial={modal?.medicamento}
          guardando={guardando}
          onGuardar={guardar}
          onCancelar={cerrar}
        />
      </Modal>

      <Modal abierto={modal?.tipo === 'dispensar'} titulo="Dispensar" subtitulo={modal?.medicamento?.nombre} onCerrar={cerrar} ancho={460}>
        {modal?.tipo === 'dispensar' && (
          <DispensarMedicamento medicamento={modal.medicamento} guardando={guardando} onConfirmar={dispensar} onCancelar={cerrar} />
        )}
      </Modal>

      <ConfirmarEliminar
        abierto={modal?.tipo === 'eliminar'}
        nombre={modal?.medicamento?.nombre}
        guardando={guardando}
        onConfirmar={eliminar}
        onCerrar={cerrar}
      />
    </>
  )
}
