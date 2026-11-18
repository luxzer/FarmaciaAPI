import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox, Sparkles } from '@react-three/drei'
import { CapsuleCollider, CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { crearMediaCapsula, crearTableta } from './geometrias'

// Posición normalizada: x e y van de -1 a 1 dentro de la pantalla; z es profundidad.
// "e" = escritorio, "m" = móvil (pantallas angostas, null = no se muestra).
const OBJETOS = [
  { tipo: 'capsula', colores: ['#ffffff', '#ff5d47'], e: [0.42, 0.18, 1.2], m: [0.3, -0.66, 1], escala: 2.2, giro: [0.4, 0.2, -0.9] },
  { tipo: 'capsula', colores: ['#ffffff', '#0a8f6f'], e: [0.84, 0.6, -1], m: [-0.62, -0.5, -1], escala: 1.5, giro: [1, 0.4, 0.5] },
  { tipo: 'capsula', colores: ['#f2b531', '#ffffff'], e: [0.8, -0.45, 0.4], m: [0.78, -0.36, -0.5], escala: 1.4, giro: [-0.3, 1, 1.2] },
  { tipo: 'capsula', colores: ['#2f6fed', '#ffffff'], e: [0.12, -0.7, -0.6], m: [-0.25, -0.88, -1.5], escala: 1.25, giro: [0.8, -0.2, 0.3] },
  { tipo: 'capsula', colores: ['#ffffff', '#ff5d47'], e: [-0.86, 0.76, -3], m: null, escala: 1.1, giro: [0.2, 0.9, -0.4] },
  { tipo: 'capsula', colores: ['#0ea5b7', '#ffffff'], e: [1.02, 0.02, -2.5], m: null, escala: 1.2, giro: [1.4, 0, 0.7] },
  { tipo: 'gel', color: '#f5a524', e: [0.2, 0.72, -0.4], m: [0.66, -0.92, 0.4], escala: 1.5, giro: [0.6, 0.2, 0.9] },
  { tipo: 'gel', color: '#f5a524', e: [-0.5, -0.82, -1.6], m: null, escala: 1.2, giro: [1.2, 0.5, -0.4] },
  { tipo: 'tableta', color: '#ffffff', e: [0.62, -0.06, 2.6], m: [-0.05, -0.45, 2], escala: 1.05, giro: [1.1, 0, 0.3] },
  { tipo: 'tableta', color: '#ffd9d3', e: [1.0, 0.34, 0.8], m: [-0.78, -0.86, 0.5], escala: 0.95, giro: [0.4, 0.6, 0] },
  { tipo: 'tableta', color: '#d7f1e8', e: [0.38, 0.8, -1.8], m: null, escala: 1.1, giro: [1.5, 0.3, 0.2] },
  { tipo: 'tableta', color: '#fff1c7', e: [0.6, -0.8, 1.4], m: null, escala: 0.85, giro: [0.2, 0, 1.1] },
  { tipo: 'cruz', color: '#0a8f6f', e: [0.08, 0.42, 0.8], m: [-0.4, -0.62, 0.8], escala: 0.9, giro: [0.3, -0.5, 0.2] },
  { tipo: 'cruz', color: '#ff5d47', e: [-0.95, -0.55, -3.5], m: null, escala: 0.8, giro: [-0.4, 0.4, 0.4] },
]

// ---------------------------------------------------------------- Formas
// Cada forma trae su dibujo y su colisionador (la forma "física" para Rapier).

function Capsula({ colores, escala }) {
  const geometria = useMemo(() => crearMediaCapsula(), [])
  return (
    <>
      <CapsuleCollider args={[0.62 * escala, 0.42 * escala]} />
      <group scale={escala}>
        <mesh geometry={geometria}>
          <meshPhysicalMaterial color={colores[0]} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} sheen={0.4} sheenColor="#ffffff" />
        </mesh>
        <mesh geometry={geometria} rotation={[Math.PI, 0, 0]}>
          <meshPhysicalMaterial color={colores[1]} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
      </group>
    </>
  )
}

// Cápsula blanda de gel: un elipsoide brillante, un poco translúcido.
function Gel({ color, escala }) {
  return (
    <>
      <CapsuleCollider args={[0.22 * escala, 0.31 * escala]} />
      <mesh scale={[0.31 * escala, 0.53 * escala, 0.31 * escala]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.02}
          transparent
          opacity={0.88}
          emissive={color}
          emissiveIntensity={0.18}
          iridescence={0.6}
          iridescenceIOR={1.3}
        />
      </mesh>
    </>
  )
}

function Tableta({ color, escala }) {
  const geometria = useMemo(() => crearTableta(), [])
  return (
    <>
      <CylinderCollider args={[0.2 * escala, 0.62 * escala]} />
      <group scale={escala}>
        <mesh geometry={geometria}>
          <meshPhysicalMaterial color={color} roughness={0.5} clearcoat={0.35} sheen={0.6} sheenColor="#ffffff" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.95, 0.03, 0.05]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.08} />
        </mesh>
      </group>
    </>
  )
}

function Cruz({ color, escala }) {
  return (
    <>
      <CuboidCollider args={[0.21 * escala, 0.625 * escala, 0.21 * escala]} />
      <CuboidCollider args={[0.625 * escala, 0.21 * escala, 0.21 * escala]} />
      <group scale={escala}>
        <RoundedBox args={[0.42, 1.25, 0.42]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} />
        </RoundedBox>
        <RoundedBox args={[1.25, 0.42, 0.42]} radius={0.1} smoothness={4}>
          <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} />
        </RoundedBox>
      </group>
    </>
  )
}

const FORMAS = { capsula: Capsula, gel: Gel, tableta: Tableta, cruz: Cruz }

// ---------------------------------------------------------------- Piezas
// Cada pieza es un cuerpo rígido sin gravedad. En cada cuadro recibe un
// impulso tipo resorte hacia su "hogar", así vuelve a su sitio después de
// chocar, y Rapier se encarga de que nunca se atraviesen.
function Pieza({ datos, hogar, escala, indice, factorScroll }) {
  const cuerpo = useRef()
  const fase = indice * 1.7
  const inicio = useMemo(() => [hogar[0] * 0.6, hogar[1] - 8 - indice * 0.35, hogar[2]], []) // eslint-disable-line react-hooks/exhaustive-deps
  const Forma = FORMAS[datos.tipo]

  useFrame(({ clock }, delta) => {
    const c = cuerpo.current
    if (!c) return
    const t = clock.elapsedTime
    const subida = Math.min(window.scrollY, 1200) * factorScroll
    const objetivo = {
      x: hogar[0] + Math.sin(t * 0.5 + fase) * 0.18,
      y: hogar[1] + Math.sin(t * 0.7 + fase) * 0.28 + subida,
      z: hogar[2] + Math.cos(t * 0.4 + fase) * 0.2,
    }
    const p = c.translation()
    const m = c.mass()
    const k = 6 * m * Math.min(delta, 0.05)
    c.applyImpulse({ x: (objetivo.x - p.x) * k, y: (objetivo.y - p.y) * k, z: (objetivo.z - p.z) * k }, true)

    const w = c.angvel()
    if (Math.hypot(w.x, w.y, w.z) < 0.35) c.applyTorqueImpulse({ x: 0.002 * m, y: 0.004 * m, z: 0.001 * m }, true)
  })

  const empujar = (fuerza) => {
    const c = cuerpo.current
    if (!c) return
    const m = c.mass()
    c.applyImpulse({ x: (Math.random() - 0.5) * fuerza * m, y: fuerza * 0.6 * m, z: -fuerza * m }, true)
    c.applyTorqueImpulse({ x: fuerza * 0.06 * m, y: fuerza * 0.1 * m, z: (Math.random() - 0.5) * fuerza * 0.1 * m }, true)
  }

  return (
    <RigidBody
      ref={cuerpo}
      colliders={false}
      position={inicio}
      rotation={datos.giro}
      linearDamping={3}
      angularDamping={0.8}
      restitution={0.55}
      friction={0.2}
    >
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'grab'
          const c = cuerpo.current
          if (c) c.applyTorqueImpulse({ x: 0, y: 0.08 * c.mass(), z: 0.04 * c.mass() }, true)
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          empujar(4)
        }}
      >
        <Forma {...datos} escala={escala} />
      </group>
    </RigidBody>
  )
}

// El mouse es un cilindro invisible (cinemático) que empuja las piezas.
// Si el mouse se queda quieto 2 s, el cilindro se aparta de la escena.
function Puntero() {
  const ref = useRef()
  const ultimo = useRef({ x: 0, y: 0, t: -10, activo: false })
  const { viewport, camera } = useThree()

  useFrame(({ pointer, clock }) => {
    const c = ref.current
    if (!c) return
    const u = ultimo.current
    if (pointer.x !== u.x || pointer.y !== u.y) {
      u.x = pointer.x
      u.y = pointer.y
      u.t = clock.elapsedTime
    }
    const activo = clock.elapsedTime - u.t < 2
    const v = viewport.getCurrentViewport(camera, [0, 0, 0])
    const destino = activo ? { x: (pointer.x * v.width) / 2, y: (pointer.y * v.height) / 2, z: 0 } : { x: 0, y: 0, z: 60 }
    if (activo !== u.activo) c.setTranslation(destino, true)
    else c.setNextKinematicTranslation(destino)
    u.activo = activo
  })

  return (
    <RigidBody ref={ref} type="kinematicPosition" colliders={false} position={[0, 0, 60]}>
      <CylinderCollider args={[5, 0.7]} rotation={[Math.PI / 2, 0, 0]} />
    </RigidBody>
  )
}

// La cámara se inclina un poco hacia donde está el mouse.
function CamaraParalaje() {
  useFrame(({ camera, pointer }, delta) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.9, 2.5, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.6, 2.5, delta)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Escenario() {
  const { size, viewport, camera } = useThree()
  const angosta = size.width < 760 || size.width / size.height < 0.9

  const piezas = useMemo(() => {
    // Se calcula con la cámara en su posición inicial, sin el paralaje del mouse.
    const camaraFija = camera.clone()
    camaraFija.position.set(0, 0, 12)
    return OBJETOS.filter((d) => (angosta ? d.m : d.e)).map((datos) => {
      const [nx, ny, z] = angosta ? datos.m : datos.e
      const vista = viewport.getCurrentViewport(camaraFija, [0, 0, z])
      return {
        datos,
        hogar: [(nx * vista.width) / 2, (ny * vista.height) / 2, z],
        escala: datos.escala * (angosta ? 0.5 : 1),
      }
    })
  }, [angosta, size.width, size.height]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Rapier carga su motor (WebAssembly) en segundo plano: Suspense espera sin reiniciar el lienzo. */}
      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]}>
          {piezas.map(({ datos, hogar, escala }, i) => (
            <Pieza
              key={`${angosta ? 'm' : 'e'}-${i}`}
              datos={datos}
              hogar={hogar}
              escala={escala}
              indice={i}
              factorScroll={angosta ? 0.003 : 0.006}
            />
          ))}
          <Puntero />
        </Physics>
      </Suspense>
      <Sparkles count={angosta ? 30 : 60} scale={[18, 10, 6]} size={3} speed={0.35} opacity={0.55} color="#3cc9a3" />
      {!angosta && <CamaraParalaje />}
    </>
  )
}

// Lee el color de fondo del hero (cambia con el modo oscuro) para la niebla.
function useColorFondo() {
  const [color, setColor] = useState('#e7f3ef')
  useEffect(() => {
    const leer = () =>
      setColor(getComputedStyle(document.documentElement).getPropertyValue('--hero-fondo').trim() || '#e7f3ef')
    leer()
    const observador = new MutationObserver(leer)
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observador.disconnect()
  }, [])
  return color
}

export default function EscenaCapsulas() {
  const contenedor = useRef()
  const [visible, setVisible] = useState(true)
  const colorFondo = useColorFondo()

  // Cuando el hero sale de la pantalla se deja de dibujar (ahorra batería).
  useEffect(() => {
    const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting))
    if (contenedor.current) observador.observe(contenedor.current)
    return () => observador.disconnect()
  }, [])

  return (
    <div ref={contenedor} className="escena-capsulas">
      <Canvas
        dpr={[1, 2]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 0, 12], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <fog key={colorFondo} attach="fog" args={[colorFondo, 12.5, 19]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 6]} intensity={1.7} />
        <directionalLight position={[-6, -2, 4]} intensity={0.5} color="#bfe9dc" />
        <pointLight position={[-4, 3, 5]} intensity={18} color="#ff9a8a" distance={14} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[0, 6, -6]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
          <Lightformer form="ring" intensity={2.5} color="#d8fff1" position={[6, 2, 4]} scale={3} />
          <Lightformer form="rect" intensity={1.2} color="#ffd2c9" position={[0, -5, 3]} rotation-x={-Math.PI / 2} scale={[10, 3, 1]} />
        </Environment>
        <Escenario />
      </Canvas>
    </div>
  )
}
