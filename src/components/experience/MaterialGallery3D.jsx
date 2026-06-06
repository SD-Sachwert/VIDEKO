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
 * Floating material plates with the real material imagery, each with a gold
 * rim. Gentle rotation, scale-up on hover. Parent wraps this in <Suspense>.
 */
export default function MaterialGallery3D({ z = -16 }) {
  const texs = useTexture(SRC)
  const refs = useRef([])

  useFrame((s) => {
    const t = s.clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (m) m.rotation.y = Math.sin(t * 0.3 + i) * 0.22
    })
  })

  return (
    <group position={[0, 1.2, z]}>
      {texs.map((tex, i) => {
        const col = (i % 3) - 1
        const row = i < 3 ? 1.0 : -1.0
        return (
          <group
            key={i}
            ref={(el) => (refs.current[i] = el)}
            position={[col * 3.4, row, (i % 2) * -1.4]}
            onPointerOver={(e) => { e.stopPropagation(); e.object.parent.scale.setScalar(1.1) }}
            onPointerOut={(e) => { e.object.parent.scale.setScalar(1) }}
          >
            {/* gold rim */}
            <mesh position={[0, 0, -0.09]}>
              <boxGeometry args={[2.5, 2.5, 0.08]} />
              <meshStandardMaterial color="#C9A050" metalness={0.95} roughness={0.22} emissive="#E8C978" emissiveIntensity={0.22} />
            </mesh>
            {/* material plate */}
            <mesh>
              <boxGeometry args={[2.3, 2.3, 0.12]} />
              <meshStandardMaterial map={tex} metalness={0.3} roughness={0.5} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
