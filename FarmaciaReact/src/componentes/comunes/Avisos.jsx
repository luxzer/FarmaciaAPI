import { createContext, useCallback, useContext, useState } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'

const ContextoAvisos = createContext(() => {})

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((texto, tipo = 'exito') => {
    const id = crypto.randomUUID()
    setAvisos((lista) => [...lista, { id, texto, tipo }])
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 4200)
  }, [])

  return (
    <ContextoAvisos.Provider value={avisar}>
      {children}
      <div className="avisos" aria-live="polite">
        {avisos.map(({ id, texto, tipo }) => (
          <div key={id} className={`aviso aviso-${tipo}`}>
            {tipo === 'error' ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
            <span>{texto}</span>
          </div>
        ))}
      </div>
    </ContextoAvisos.Provider>
  )
}

export const useAvisos = () => useContext(ContextoAvisos)
