import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ELEMENTOS } from './elementos'


// Paracetamol (C8H9NO2): anillo de benceno con un grupo -OH abajo
// y un grupo acetamida (-NH-CO-CH3) arriba.
function construirMolecula() {
  const anillo = Array.from({ length: 6 }, (_, k) => {
    const a = Math.PI / 2 + (k * Math.PI) / 3
    return [1.4 * Math.cos(a), 1.4 * Math.sin(a), 0]
  })
  const hAnillo = [1, 2, 4, 5].map((k) => {
    const a = Math.PI / 2 + (k * Math.PI) / 3
    return [2.45 * Math.cos(a), 2.45 * Math.sin(a), 0]
  })

  const atomos = [
    ...anillo.map((p) => ['C', p]), // 0-5
    ['N', [0, 2.85, 0]], // 6
    ['C', [1.25, 3.6, 0]], // 7 carbonilo
    ['O', [2.4, 3.05, 0]], // 8 =O
    ['C', [1.15, 5.1, 0]], // 9 metilo
    ['O', [0, -2.85, 0]], // 10 -OH
    ['H', [-0.95, 3.35, 0]], // 11 H del N
    ['H', [0.9, -3.4, 0]], // 12 H del OH
    ['H', [2.1, 5.55, 0.3]], // 13-15 H del metilo
    ['H', [0.55, 5.45, 0.85]],
    ['H', [0.75, 5.4, -0.95]],
    ...hAnillo.map((p) => ['H', p]), // 16-19
  ]

  const enlaces = [
    [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2],
    [0, 6, 1], [6, 7, 1], [7, 8, 2], [7, 9, 1], [3, 10, 1],
    [6, 11, 1], [10, 12, 1], [9, 13, 1], [9, 14, 1], [9, 15, 1],
    [1, 16, 1], [2, 17, 1], [4, 18, 1], [5, 19, 1],
  ]

  const centro = new THREE.Vector3(0.3, 1.1, 0)
  return {
    atomos: atomos.map(([e, p]) => [e, new THREE.Vector3(...p).sub(centro)]),
    enlaces,
  }
}

function Enlace({ desde, hasta, desfase }) {
  const { posicion, cuaternion, largo } = useMemo(() => {
    const direccion = new THREE.Vector3().subVectors(hasta, desde)
    const perpendicular = new THREE.Vector3(-direccion.y, direccion.x, 0).normalize().multiplyScalar(desfase)
    return {
      posicion: desde.clone().add(hasta).multiplyScalar(0.5).add(perpendicular),
      cuaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direccion.clone().normalize()),
      largo: direccion.length(),
    }
  }, [desde, hasta, desfase])

  return (
    <mesh position={posicion} quaternion={cuaternion}>
      <cylinderGeometry args={[0.08, 0.08, largo, 16]} />
      <meshStandardMaterial color="#9fb3b0" roughness={0.4} />
    </mesh>
  )
}

function Molecula({ etiquetas }) {
  const { atomos, enlaces } = useMemo(construirMolecula, [])

  return (
    <group rotation={[0, 0, -0.35]}>
      {atomos.map(([elemento, posicion], i) => {
        const { color, radio } = ELEMENTOS[elemento]
        return (
          <mesh key={i} position={posicion}>
            <sphereGeometry args={[radio, 32, 32]} />
            <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={0.8} />
            {etiquetas && elemento !== 'H' && (
              <Html center distanceFactor={9} className="etiqueta-atomo">
                {elemento}
              </Html>
            )}
          </mesh>
        )
      })}
      {enlaces.flatMap(([a, b, orden]) => {
        const desde = atomos[a][1]
        const hasta = atomos[b][1]
        const desfases = orden === 2 ? [-0.11, 0.11] : [0]
        return desfases.map((d) => <Enlace key={`${a}-${b}-${d}`} desde={desde} hasta={hasta} desfase={d} />)
      })}
    </group>
  )
}

export default function MoleculaParacetamol({ etiquetas, girar }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 14], fov: 42 }} className="escena-molecula">
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 8]} intensity={1.8} />
      <directionalLight position={[-6, -4, -2]} intensity={0.5} color="#bfe9dc" />
      <Molecula etiquetas={etiquetas} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={girar} autoRotateSpeed={1.6} />
    </Canvas>
  )
}
