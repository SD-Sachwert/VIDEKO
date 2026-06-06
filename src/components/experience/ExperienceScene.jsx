import { Suspense } from 'react'
import { useTexture } from '@react-three/drei'

import CameraRig from './CameraRig.jsx'
import Particles from './Particles.jsx'
import WhyVideko3D from './WhyVideko3D.jsx'
import StilfinderGallery3D from './StilfinderGallery3D.jsx'
import MaterialGallery3D from './MaterialGallery3D.jsx'
import ExplodingKitchen3D from './ExplodingKitchen3D.jsx'
import ShowroomPath3D from './ShowroomPath3D.jsx'

import heroImg from '../../assets/images/experience/hero/exp-hero-kitchen.png'
import whyBg from '../../assets/images/experience/why-videko/exp-why-bg.png'
import planBg from '../../assets/images/experience/planning/exp-planning-bg.png'
import explodeImg from '../../assets/images/experience/planning/exp-exploding-kitchen.png'
import showMain from '../../assets/images/experience/showroom/exp-showroom-main.png'
import show1 from '../../assets/images/experience/showroom/exp-showroom-01.png'
import show2 from '../../assets/images/experience/showroom/exp-showroom-02.png'
import show3 from '../../assets/images/experience/showroom/exp-showroom-03.png'
import finalImg from '../../assets/images/experience/showroom/exp-final-cta.jpg'
import marble from '../../assets/images/experience/shared/exp-marble.jpg'

// scene anchor Z (matches CameraRig: camZ ≈ 10 - 132*p, section centers)
const A = [-1, -23, -45, -67, -89, -111]

/** Full-bright cinematic image panel with optional gold rim. */
function ImagePanel({ src, position, size, rotation = [0, 0, 0], frame = false }) {
  const tex = useTexture(src)
  return (
    <group position={position} rotation={rotation}>
      {frame && (
        <mesh position={[0, 0, -0.07]}>
          <planeGeometry args={[size[0] + 0.25, size[1] + 0.25]} />
          <meshStandardMaterial color="#C9A050" metalness={0.92} roughness={0.22} emissive="#E8C978" emissiveIntensity={0.3} />
        </mesh>
      )}
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Portal({ z, r = 3.5, bright = false }) {
  return (
    <mesh position={[0, 1.5, z]}>
      <torusGeometry args={[r, 0.09, 16, 90]} />
      <meshStandardMaterial color={bright ? '#E8C978' : '#C9A050'} metalness={0.95} roughness={0.14} emissive="#E8C978" emissiveIntensity={bright ? 0.85 : 0.6} />
    </mesh>
  )
}

/** Thin emissive gold rails along both sides — corridor orientation / depth. */
function SideRails() {
  const zs = [-12, -34, -56, -78, -100, -120]
  return (
    <group>
      {zs.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          {[-7.5, 7.5].map((x) => (
            <mesh key={x} position={[x, 1.2, 0]}>
              <boxGeometry args={[0.05, 5.5, 0.05]} />
              <meshStandardMaterial color="#C9A050" emissive="#E8C978" emissiveIntensity={0.7} metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

export default function ExperienceScene({ progress }) {
  return (
    <>
      <CameraRig progress={progress} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 14, 8]} intensity={1.0} color="#fff3d8" />
      <pointLight position={[-5, 4, -10]} intensity={40} color="#E8C978" distance={42} />
      <pointLight position={[5, 4, -45]} intensity={45} color="#C9A050" distance={48} />
      <pointLight position={[-5, 4, -89]} intensity={45} color="#E8C978" distance={48} />
      <pointLight position={[5, 4, -118]} intensity={50} color="#E8C978" distance={50} />

      {/* floor */}
      <Suspense fallback={null}>
        <FloorPlane />
      </Suspense>

      <SideRails />
      <Particles />

      <Suspense fallback={null}>
        {/* 1 — HERO */}
        <ImagePanel src={heroImg} position={[0, 2.1, A[0] - 14]} size={[20, 11]} />
        <mesh position={[0, -0.2, A[0] - 8]}>
          <boxGeometry args={[4.6, 1, 2]} />
          <meshStandardMaterial color="#12110F" metalness={0.45} roughness={0.4} />
        </mesh>
        <Portal z={A[0] - 2} r={3.7} />

        {/* 2 — WARUM VIDEKO */}
        <ImagePanel src={whyBg} position={[0, 2.1, A[1] - 14]} size={[20, 11]} />
        <WhyVideko3D z={A[1] - 8} />
        <Portal z={A[1] - 2} />

        {/* 3 — STILFINDER */}
        <mesh position={[0, 1.6, A[2] - 14]}>
          <planeGeometry args={[26, 14]} />
          <meshStandardMaterial color="#1b1916" metalness={0.3} roughness={0.8} />
        </mesh>
        <StilfinderGallery3D z={A[2] - 8} />
        <Portal z={A[2] - 2} />

        {/* 4 — MATERIALIEN */}
        <ImagePanel src={marble} position={[0, 2.0, A[3] - 14]} size={[26, 14]} />
        <MaterialGallery3D z={A[3] - 8} />
        <Portal z={A[3] - 2} />

        {/* 5 — PLANUNG / EXPLODING */}
        <ImagePanel src={planBg} position={[0, 2.1, A[4] - 14]} size={[20, 11]} />
        <ImagePanel src={explodeImg} position={[0, 2.0, A[4] - 10]} size={[11, 6.5]} frame />
        <ExplodingKitchen3D progress={progress} z={A[4] - 7} />
        <Portal z={A[4] - 2} />

        {/* 6 — SHOWROOM / FINAL */}
        <ImagePanel src={showMain} position={[0, 2.1, A[5] - 16]} size={[22, 12]} />
        <ImagePanel src={show1} position={[-5.4, 1.5, A[5] - 5]} size={[5.6, 3.4]} rotation={[0, 0.5, 0]} frame />
        <ImagePanel src={show2} position={[5.4, 1.6, A[5] - 9]} size={[5.6, 3.4]} rotation={[0, -0.5, 0]} frame />
        <ImagePanel src={show3} position={[-5.4, 1.5, A[5] - 13]} size={[5.6, 3.4]} rotation={[0, 0.5, 0]} frame />
        <ShowroomPath3D z={A[5] - 4} />
        <ImagePanel src={finalImg} position={[0, 2.1, A[5] - 21]} size={[22, 12]} />
        <Portal z={A[5] - 19} r={4} bright />
        <mesh position={[0, -0.2, A[5] - 13]}>
          <boxGeometry args={[5, 1, 2.2]} />
          <meshStandardMaterial color="#D8D0BE" metalness={0.2} roughness={0.5} />
        </mesh>
      </Suspense>
    </>
  )
}

function FloorPlane() {
  const tex = useTexture(marble)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, -55]}>
      <planeGeometry args={[52, 220]} />
      <meshStandardMaterial map={tex} color="#E6DCC7" metalness={0.25} roughness={0.7} />
    </mesh>
  )
}
