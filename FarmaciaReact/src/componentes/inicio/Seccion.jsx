// Banda de ancho completo con título; el contenido llega como children.
export default function Seccion({ id, antetitulo, titulo, accion, tono = 'claro', children }) {
  return (
    <section id={id} className={`seccion seccion-${tono}`}>
      <div className="contenedor">
        {(titulo || accion) && (
          <header className="seccion-cabecera">
            <div>
              {antetitulo && <p className="antetitulo">{antetitulo}</p>}
              {titulo && <h2>{titulo}</h2>}
            </div>
            {accion}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
