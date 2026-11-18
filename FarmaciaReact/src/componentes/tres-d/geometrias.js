import * as THREE from 'three'

// Media cápsula: un perfil (semicírculo + recta) que se hace girar
// alrededor del eje Y con LatheGeometry. Dos mitades forman la cápsula.
export function crearMediaCapsula(radio = 0.42, largo = 0.62) {
  const puntos = []
  const pasos = 16
  for (let i = 0; i <= pasos; i++) {
    const a = (i / pasos) * (Math.PI / 2)
    puntos.push(new THREE.Vector2(radio * Math.sin(a), largo + radio * Math.cos(a)))
  }
  puntos.push(new THREE.Vector2(radio, largo / 2))
  puntos.push(new THREE.Vector2(radio, 0))
  return new THREE.LatheGeometry(puntos, 48)
}

// Tableta: disco con el borde redondeado, también hecho con LatheGeometry.
export function crearTableta(radio = 0.62, alto = 0.2) {
  const borde = alto * 0.9
  const puntos = [new THREE.Vector2(0, alto)]
  puntos.push(new THREE.Vector2(radio - borde, alto))
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI / 2 - (i / 12) * Math.PI
    puntos.push(new THREE.Vector2(radio - borde + borde * Math.cos(a), alto * Math.sin(a)))
  }
  puntos.push(new THREE.Vector2(0, -alto))
  return new THREE.LatheGeometry(puntos, 48)
}
