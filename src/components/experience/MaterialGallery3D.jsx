import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

import nat from '../../assets/images/experience/videko_experience_asset_pack/03_material_textures/exp-material-black-stone-slab.webp'
import met from '../../assets/images/experience/videko_experience_asset_pack/03_material_textures/exp-material-metal-slab.webp'
import bro from '../../assets/images/experience/videko_experience_asset_pack/03_material_textures/exp-material-bronze-metal.webp'
import ker from '../../assets/images/experience/videko_experience_asset_pack/03_material_textures/exp-material-ceramic-slab.webp'
import hol from '../../assets/images/experience/videko_experience_asset_pack/03_material_textures/exp-material-wood-slab.webp'
import gla from '../../assets/images/experience/videko_experience_asset_pack/03_material_textures/exp-material-glass-slab.webp'

const SRC = [nat, met, bro, ker, hol, gla]

/**
 * Six thick material slabs on stone plinths, three per side of the corridor,
 * staggered in depth/height, with gold edges + a gold label bar. The camera
 * drives between them. Parent wraps this in <Suspense>.
 */
export default function MaterialGallery3D({ z = -45 }) {
  const texs = useTexture(SRC)
  const refs = useRef([])

  useFrame((s) => {
    const t = s.clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (m) m.rotation.y = (i < 3 ? 0.3 : -0.3) + Math.sin(t * 0.4 + i) * 0.05
    })
  })

  return (
    <group position={[0, 0, z]}>
      {texs.map((tex, i) => {
        const side = i < 3 ? -1 : 1
        const idx = i % 3
        const x = side * 5
        const zo = -idx * 4 + (side < 0 ? 2 : 0)
        const h = 2.5 + (idx % 2) * 0.5
        return (
          <group key={i} position={[x, 0, zo]}>
            {/* plinth */}
            <mesh position={[0, -0.7, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.6, 1.0, 1.6]} />
              <meshStandardMaterial color="#2B2925" metalness={0.3} roughness={0.6} />
            </mesh>
            {/* gold label bar on the plinth */}
            <mesh position={[0, -0.18, 0.81]}>
              <boxGeometry args={[1.3, 0.12, 0.04]} />
              <meshStandardMaterial color="#C9A050" emissive="#E8C978" emissiveIntensity={0.7} toneMapped={false} />
            </mesh>
            {/* slab + gold rim */}
            <group ref={(el) => (refs.current[i] = el)} position={[0, h / 2 - 0.1, 0]}>
              <mesh position={[0, 0, -0.04]}>
                <boxGeometry args={[2.2, h + 0.18, 0.46]} />
                <meshStandardMaterial color="#C9A050" metalness={0.95} roughness={0.22} emissive="#E8C978" emissiveIntensity={0.25} />
              </mesh>
              <mesh castShadow>
                <boxGeometry args={[2.0, h, 0.44]} />
                <meshStandardMaterial map={tex} metalness={0.35} roughness={0.45} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}
