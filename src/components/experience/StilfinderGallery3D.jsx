import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

import zeitlos from '../../assets/images/experience/stylefinder/exp-style-zeitlos.webp'
import modern from '../../assets/images/experience/stylefinder/exp-style-modern-warm.webp'
import dunkel from '../../assets/images/experience/stylefinder/exp-style-dunkel.webp'
import natuerlich from '../../assets/images/experience/stylefinder/exp-style-natuerlich.webp'
import industrial from '../../assets/images/experience/stylefinder/exp-style-industrial.webp'

const SRC = [zeitlos, modern, dunkel, natuerlich, industrial]

/**
 * Five style cards as floating exhibits in a shallow arc. The centre card steps
 * forward with a gold rim; the others sit back — depth instead of flat posters.
 */
export default function StilfinderGallery3D({ z = -53 }) {
  const texs = useTexture(SRC)
  const refs = useRef([])

  useFrame((s) => {
    const t = s.clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (m) m.position.y = Math.sin(t * 0.5 + i * 0.7) * 0.12
    })
  })

  return (
    <group position={[0, 1.4, z]}>
      {texs.map((tex, i) => {
        const off = i - 2
        const active = i === 2
        const zo = -Math.abs(off) * 1.4 + (active ? 1.2 : 0)
        return (
          <group key={i} position={[off * 2.7, 0, zo]} rotation={[0, -off * 0.18, 0]}>
            <mesh ref={(el) => (refs.current[i] = el)}>
              {/* gold rim for the active card */}
              {active && (
                <mesh position={[0, 0, -0.06]}>
                  <planeGeometry args={[2.6, 3.4]} />
                  <meshStandardMaterial color="#C9A050" metalness={0.95} roughness={0.2} emissive="#E8C978" emissiveIntensity={0.4} />
                </mesh>
              )}
              <planeGeometry args={[2.4, 3.2]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
