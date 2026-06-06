import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTS = [
  { y: 0.0, spread: -1.4, size: [3.4, 0.9, 1.6], color: '#2B2925', metal: 0.25, rough: 0.6 }, // Korpus
  { y: 0.62, spread: -0.3, size: [3.7, 0.18, 1.8], color: '#D8D0BE', metal: 0.12, rough: 0.4 }, // Arbeitsplatte (Stein)
  { y: 1.15, spread: 0.7, size: [2.0, 0.55, 1.2], color: '#12110F', metal: 0.55, rough: 0.3 }, // Geräte
  { y: 1.85, spread: 1.7, size: [3.1, 0.08, 1.4], color: '#C9A050', metal: 0.9, rough: 0.25, emissive: '#E8C978' }, // Lichtleiste
  { y: 2.45, spread: 2.7, size: [3.3, 0.7, 0.5], color: '#F0ECE2', metal: 0.1, rough: 0.5 }, // Oberschränke
]

/** Layered kitchen island that explodes apart as the camera passes through. */
export default function ExplodingKitchen3D({ progress, z = -32 }) {
  const layers = useRef([])
  useFrame(() => {
    const p = progress.current || 0
    const e = THREE.MathUtils.clamp((p - 0.42) / 0.16, 0, 1)
    layers.current.forEach((m) => {
      if (m) m.position.y = m.userData.base + e * m.userData.spread
    })
  })
  return (
    <group position={[0, 0.1, z]}>
      {PARTS.map((pt, i) => (
        <mesh
          key={i}
          position={[0, pt.y, 0]}
          ref={(el) => {
            layers.current[i] = el
            if (el) el.userData = { base: pt.y, spread: pt.spread }
          }}
        >
          <boxGeometry args={pt.size} />
          <meshStandardMaterial
            color={pt.color}
            metalness={pt.metal}
            roughness={pt.rough}
            emissive={pt.emissive || '#000000'}
            emissiveIntensity={pt.emissive ? 0.6 : 0}
          />
        </mesh>
      ))}
    </group>
  )
}
