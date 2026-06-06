import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

import nat from '../../assets/images/experience/materials/exp-material-naturstein.png'
import met from '../../assets/images/experience/materials/exp-material-metall.png'
import bro from '../../assets/images/experience/materials/exp-material-bronze.png'
import ker from '../../assets/images/experience/materials/exp-material-keramik.png'
import hol from '../../assets/images/experience/materials/exp-material-holz.png'
import gla from '../../assets/images/experience/materials/exp-material-glas.png'

const SRC = [nat, met, bro, ker, hol, gla]

/**
 * Six thick material slabs on stone plinths, three per side of the corridor,
 * staggered in depth/height, with gold edges. The camera drives between them.
 */
export default function MaterialGallery3D({ z = -45 }) {
  const texs = useTexture(SRC)
  const refs = useRef([])

  useFrame((s) => {
    const t = s.clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (m) m.rotation.y = (i < 3 ? 0.32 : -0.32) + Math.sin(t * 0.4 + i) * 0.06
    })
  })

  return (
    <group position={[0, 0, z]}>
      {texs.map((tex, i) => {
        const side = i < 3 ? -1 : 1
        const idx = i % 3
        const x = side * 5
        const zo = -idx * 4 + (side < 0 ? 2 : 0)
        const h = 2.4 + (idx % 2) * 0.5
        return (
          <group key={i} position={[x, 0, zo]}>
            {/* plinth */}
            <mesh position={[0, -0.7, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.5, 1.0, 1.5]} />
              <meshStandardMaterial color="#2B2925" metalness={0.3} roughness={0.6} />
            </mesh>
            {/* slab + gold rim */}
            <group ref={(el) => (refs.current[i] = el)} position={[0, h / 2 - 0.1, 0]}>
              <mesh position={[0, 0, -0.04]}>
                <boxGeometry args={[2.2, h + 0.18, 0.42]} />
                <meshStandardMaterial color="#C9A050" metalness={0.95} roughness={0.22} emissive="#E8C978" emissiveIntensity={0.25} />
              </mesh>
              <mesh castShadow>
                <boxGeometry args={[2.0, h, 0.4]} />
                <meshStandardMaterial map={tex} metalness={0.3} roughness={0.5} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}
