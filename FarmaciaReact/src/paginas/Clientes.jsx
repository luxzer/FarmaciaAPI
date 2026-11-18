import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, Search, UserCheck, Users } from 'lucide-react'
import imagenPastillero from '../assets/img/pastillero.webp'
import CabeceraPagina from '../componentes/comunes/CabeceraPagina'
import BotonIcono from '../componentes/comunes/BotonIcono'
import ControlSegmentado from '../componentes/comunes/ControlSegmentado'
import Modal from '../componentes/comunes/Modal'
import ConfirmarEliminar from '../componentes/comunes/ConfirmarEliminar'
import { Cargando, ErrorConexion, SinResultados } from '../componentes/comunes/Estados'
import { useAvisos } from '../componentes/comunes/Avisos'
import FilaCliente from '../componentes/clientes/FilaCliente'
import FormularioCliente from '../componentes/clientes/FormularioCliente'
import { useConsulta } from '../hooks/useConsulta'
import { clientesApi } from '../servicios/api'

export default function Clientes() {
  const avisar = useAvisos()
  const [busqueda, setBusqueda] = useState('')
  const [termino, setTermino] = useState('')
  const [estado, setEstado] = useState('todos')
  const [mostrarContacto, setMostrarContacto] = useState(false)
  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTermino(busqueda), 300)
    return () => clearTimeout(t)
  }, [busqueda])

  const { datos, cargando, error, recargar } = useConsulta(() => clientesApi.listar(termino), [termino])
  const clientes = useMemo(() => datos ?? [], [datos])
  const activos = clientes.filter((c) => c.activo).length
  const visibles = clientes.filter((c) => estado === 'todos' || (estado === 'activos' ? c.activo : !c.activo))

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

  const guardar = (dto) => {
    const nombre = `${dto.nombres} ${dto.apellidos}`
    return modal.tipo === 'crear'
      ? ejecutar(() => clientesApi.crear(dto), `${nombre} registrado`)
      : ejecutar(() => clientesApi.actualizar(modal.cliente.id, dto), `${nombre} actualizado`)
  }

  const nombreModal = modal?.cliente ? `${modal.cliente.nombres} ${modal.cliente.apellidos}` : ''

  return (
    <>
      <CabeceraPagina imagen={imagenPastillero} antetitulo="Pacientes" titulo="Clientes">
        <div className="metrica-cabecera">
          <span><Users size={14} aria-hidden="true" /> Registrados</span>
          <strong>{clientes.length}</strong>
        </div>
        <div className="metrica-cabecera">
          <span><UserCheck size={14} aria-hidden="true" /> Activos</span>
          <strong>{activos}</strong>
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
              placeholder="Nombre, apellido o documento"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar clientes"
            />
          </label>
          <ControlSegmentado
            etiqueta="Estado"
            valor={estado}
            onCambiar={setEstado}
            opciones={[
              { valor: 'todos', texto: 'Todos' },
              { valor: 'activos', texto: 'Activos' },
              { valor: 'inactivos', texto: 'Inactivos' },
            ]}
          />
          <BotonIcono
            icono={mostrarContacto ? EyeOff : Eye}
            ayuda={mostrarContacto ? 'Ocultar datos de contacto' : 'Mostrar datos de contacto'}
            variante={mostrarContacto ? 'activo' : ''}
            aria-pressed={mostrarContacto}
            onClick={() => setMostrarContacto(!mostrarContacto)}
          />
        </div>

        {error ? (
          <ErrorConexion mensaje={error} onReintentar={recargar} />
        ) : cargando && !datos ? (
          <Cargando tipo="fila" />
        ) : visibles.length === 0 ? (
          <SinResultados titulo="Ningún cliente coincide" />
        ) : (
          <div className="lista-clientes">
            {visibles.map((c) => (
              <FilaCliente
                key={c.id}
                cliente={c}
                mostrarContacto={mostrarContacto}
                onEditar={() => setModal({ tipo: 'editar', cliente: c })}
                onEliminar={() => setModal({ tipo: 'eliminar', cliente: c })}
              />
            ))}
          </div>
        )}
      </section>

      <Modal
        abierto={modal?.tipo === 'crear' || modal?.tipo === 'editar'}
        titulo={modal?.tipo === 'crear' ? 'Nuevo cliente' : 'Editar cliente'}
        subtitulo={nombreModal}
        onCerrar={cerrar}
        ancho={620}
      >
        <FormularioCliente
          key={modal?.cliente?.id ?? 'nuevo'}
          inicial={modal?.cliente}
          guardando={guardando}
          onGuardar={guardar}
          onCancelar={cerrar}
        />
      </Modal>

      <ConfirmarEliminar
        abierto={modal?.tipo === 'eliminar'}
        nombre={nombreModal}
        guardando={guardando}
        onConfirmar={() => ejecutar(() => clientesApi.eliminar(modal.cliente.id), `${nombreModal} eliminado`)}
        onCerrar={cerrar}
      />
    </>
  )
}
