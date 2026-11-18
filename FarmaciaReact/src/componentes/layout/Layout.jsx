import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Encabezado from './Encabezado'
import PieDePagina from './PieDePagina'

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <Encabezado />
      <main>
        <Outlet />
      </main>
      <PieDePagina />
    </>
  )
}
