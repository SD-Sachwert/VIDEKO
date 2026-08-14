import { Suspense } from 'react'
import { useTexture } from '@react-three/drei'

import CameraRig from './CameraRig.jsx'
import Particles from './Particles.jsx'
import KitchenIsland3D from './KitchenIsland3D.jsx'
import WhyVideko3D from './WhyVideko3D.jsx'
import MaterialGallery3D from './MaterialGallery3D.jsx'
import ExplodingKitchen3D from './ExplodingKitchen3D.jsx'

import bp1 from '../../assets/images/experience/videko_experience_asset_pack/01_scene_backplates/exp-room-01-hero-arrival-backplate.webp'
import bp2 from '../../assets/images/experience/videko_experience_asset_pack/01_scene_backplates/exp-room-02-why-videko-backplate.webp'
import bp3 from '../../assets/images/experience/videko_experience_asset_pack/01_scene_backplates/exp-room-03-material-gallery-backplate.webp'
import bp4 from '../../assets/images/experience/videko_experience_asset_pack/01_scene_backplates/exp-room-04-planning-exploding-backplate.webp'
import bp5 from '../../assets/images/experience/videko_experience_asset_pack/01_scene_backplates/exp-room-05-showroom-panorama-backplate.webp'
import bp6 from '../../assets/images/experience/videko_experience_asset_pack/01_scene_backplates/exp-room-06-final-cta-showroom-backplate.webp'
import d1 from '../../assets/images/experience/videko_experience_asset_pack/02_detail_shots/exp-detail-01-marble-island-edge.webp'
import d2 from '../../assets/images/experience/videko_experience_asset_pack/02_detail_shots/exp-detail-02-planning-table.webp'
import d3 from '../../assets/images/experience/videko_experience_asset_pack/02_detail_shots/exp-detail-03-service-laser-measurement.webp'
import ext from '../../assets/images/experience/videko_experience_asset_pack/04_showroom_extras/exp-exterior-videko-building.webp'
import marble from '../../assets/images/experience/shared/exp-marble.webp'

// room centres (match CameraRig: camZ ≈ 10 - 132*p; section centers p=(k+0.5)/6)
const C = [-1, -23, -45, -67, -89, -111]
const Z_FROM = 12
const Z_TO = -126
const LEN = Z_FROM - Z_TO
const MID = (Z_FROM + Z_TO) / 2

/** Full-bright image surface (window / wall display / backplate) with gold frame. */
function Display({ src, position, size, rotation = [0, 0, 0] }) {
  const tex = useTexture(src)
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[size[0] + 0.3, size[1] + 0.3]} />
        <meshStandardMaterial color="#C9A050" metalness={0.92} roughness={0.22} emissive="#E8C978" emissiveIntensity={0.35} />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Portal({ z, r = 4.2, bright = false }) {
  return (
    <mesh position={[0, 1.6, z]}>
      <torusGeometry args={[r, 0.1, 16, 100]} />
      <meshStandardMaterial color={bright ? '#E8C978' : '#C9A050'} metalness={0.95} roughness={0.14} emissive="#E8C978" emissiveIntensity={bright ? 0.9 : 0.55} />
    </mesh>
  )
}

function Corridor() {
  const floorTex = useTexture(marble)
  const wall = { color: '#16150f', metalness: 0.3, roughness: 0.65 }
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, MID]} receiveShadow>
        <planeGeometry args={[20, LEN]} />
        <meshStandardMaterial map={floorTex} color="#cbc2ad" metalness={0.3} roughness={0.6} />
      </mesh>
      {[-8.5, 8.5].map((x) => (
        <mesh key={x} position={[x, 2.1, MID]}>
          <boxGeometry args={[1, 7, LEN]} />
          <meshStandardMaterial {...wall} />
        </mesh>
      ))}
      {[-7.95, 7.95].map((x) => (
        <mesh key={x} position={[x, 4.5, MID]}>
          <boxGeometry args={[0.08, 0.12, LEN]} />
          <meshStandardMaterial color="#C9A050" emissive="#E8C978" emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.1, MID]}>
        <planeGeometry args={[18, LEN]} />
        <meshStandardMaterial color="#100f0c" metalness={0.2} roughness={0.85} />
      </mesh>
      {C.map((z, i) => (
        <group key={i} position={[0, 4.4, z]}>
          <mesh>
            <boxGeometry args={[10, 0.22, 4]} />
            <meshStandardMaterial color="#D8D0BE" metalness={0.2} roughness={0.5} emissive="#E8C978" emissiveIntensity={0.12} />
          </mesh>
          <pointLight position={[0, -1.6, 0]} intensity={14} color="#ffe6ad" distance={14} />
        </group>
      ))}
      {[2, -12, -34, -56, -78, -100].map((z) => <Portal key={z} z={z} />)}
    </group>
  )
}

export default function ExperienceScene({ progress }) {
  return (
    <>
      <CameraRig progress={progress} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 12, 6]} intensity={0.5} color="#fff3d8" />
      <pointLight position={[0, 2.5, -8]} intensity={18} color="#ffdca0" distance={20} />
      <pointLight position={[0, 2.5, -45]} intensity={16} color="#E8C978" distance={22} />
      <pointLight position={[0, 3, -89]} intensity={42} color="#fff2da" distance={42} />
      <pointLight position={[0, 3, -118]} intensity={48} color="#fff4e0" distance={46} />

      <Particles />

      <Suspense fallback={null}>
        <Corridor />

        {/* 1 — HERO ARRIVAL */}
        <KitchenIsland3D position={[0, 0, C[0] - 7]} />
        <Display src={bp1} position={[-7.9, 1.6, C[0] - 7]} size={[7.4, 4.2]} rotation={[0, Math.PI / 2, 0]} />

        {/* 2 — WHY VIDEKO */}
        <WhyVideko3D z={C[1]} />
        <Display src={bp2} position={[7.9, 1.6, C[1]]} size={[7, 4]} rotation={[0, -Math.PI / 2, 0]} />

        {/* 3 — MATERIAL GALLERY */}
        <MaterialGallery3D z={C[2]} />
        <Display src={bp3} position={[0, 1.7, C[2] - 14]} size={[16, 9]} />

        {/* 4 — PLANNING / EXPLODING */}
        <ExplodingKitchen3D progress={progress} z={C[3] - 2} />
        <Display src={bp4} position={[7.9, 1.7, C[3]]} size={[7.2, 4.2]} rotation={[0, -Math.PI / 2, 0]} />
        {/* detail inserts on the left wall */}
        {[[d1, C[3] + 3], [d2, C[3] - 1], [d3, C[3] - 5]].map(([src, z], i) => (
          <Display key={i} src={src} position={[-7.9, 1.6, z]} size={[3, 1.9]} rotation={[0, Math.PI / 2, 0]} />
        ))}
        {[[-1.8, 2.6, 1], [1.6, 3.2, 0.6], [0.4, 1.4, 1.4]].map((h, i) => (
          <mesh key={`hs${i}`} position={[h[0], h[1], C[3] - 2 + h[2]]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#E8C978" emissive="#E8C978" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ))}

        {/* 5 — SHOWROOM PANORAMA */}
        <Display src={bp5} position={[-7.9, 1.6, C[4]]} size={[8, 4.4]} rotation={[0, Math.PI / 2, 0]} />
        <mesh position={[3, -0.4, C[4] + 1]} castShadow>
          <boxGeometry args={[2.8, 1.1, 1.1]} />
          <meshStandardMaterial color="#D8D0BE" metalness={0.2} roughness={0.45} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[7.9, 1.4, C[4] - 3 - i * 1.4]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[1.2, 2.4, 0.12]} />
            <meshStandardMaterial color={['#9a9488', '#C9A050', '#D8D0BE'][i]} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* exterior / standort display */}
        <Display src={ext} position={[3.2, 1.5, C[4] - 4]} size={[3.4, 2]} rotation={[0, -0.5, 0]} />

        {/* 6 — FINAL CTA (bright) */}
        <Display src={bp6} position={[0, 1.8, C[5] - 14]} size={[18, 10]} />
        <Portal z={C[5] - 12} r={4.4} bright />
      </Suspense>
    </>
  )
}
