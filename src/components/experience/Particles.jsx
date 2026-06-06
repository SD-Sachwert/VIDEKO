import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/** Subtle drifting golden dust for depth/atmosphere across the whole corridor. */
export default function Particles({ count = 260, depth = 140 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 32
      a[i * 3 + 1] = Math.random() * 11 - 1.5
      a[i * 3 + 2] = 8 - Math.random() * depth
    }
    return a
  }, [count, depth])

  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.02) * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#E8C978" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  )
}
