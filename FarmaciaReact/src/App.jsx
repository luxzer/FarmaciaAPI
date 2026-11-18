import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './componentes/layout/Layout'
import { ProveedorAvisos } from './componentes/comunes/Avisos'
import Inicio from './paginas/Inicio'
import Medicamentos from './paginas/Medicamentos'
import Clientes from './paginas/Clientes'
import Panel from './paginas/Panel'
import NoEncontrada from './paginas/NoEncontrada'

export default function App() {
  return (
    <ProveedorAvisos>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="medicamentos" element={<Medicamentos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="panel" element={<Panel />} />
            <Route path="*" element={<NoEncontrada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProveedorAvisos>
  )
}
