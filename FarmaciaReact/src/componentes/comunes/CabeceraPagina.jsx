// Banda superior de cada página interna. Lo que va a la derecha
// (botones, contadores) llega como children.
export default function CabeceraPagina({ imagen, antetitulo, titulo, descripcion, children }) {
  return (
    <section className="cabecera-pagina">
      <img className="cabecera-pagina-imagen" src={imagen} alt="" />
      <div className="contenedor cabecera-pagina-contenido">
        <div>
          <p className="antetitulo">{antetitulo}</p>
          <h1>{titulo}</h1>
          {descripcion && <p className="cabecera-pagina-descripcion">{descripcion}</p>}
        </div>
        {children && <div className="cabecera-pagina-acciones">{children}</div>}
      </div>
    </section>
  )
}
