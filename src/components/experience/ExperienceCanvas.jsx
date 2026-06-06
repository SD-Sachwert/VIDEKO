import { Canvas } from '@react-three/fiber'
import ExperienceScene from './ExperienceScene.jsx'

/** Fixed full-screen 3D canvas that sits behind the scrolling HTML overlay. */
export default function ExperienceCanvas({ progress }) {
  return (
    <div className="xp__canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.4, 9], fov: 42 }}
      >
        <color attach="background" args={['#F0ECE2']} />
        <fog attach="fog" args={['#E6DCC7', 16, 52]} />
        <ExperienceScene progress={progress} />
      </Canvas>
    </div>
  )
}
