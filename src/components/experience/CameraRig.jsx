import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()

/**
 * Scroll-driven camera flight through the 6 architectural rooms.
 * progress is a ref (0..1). Camera glides from z≈10 down to z≈-122 along the
 * centre of the corridor with a gentle sway.
 */
export default function CameraRig({ progress }) {
  useFrame((state) => {
    const p = progress.current || 0
    const z = 10 + p * -132
    const y = 1.55 + Math.sin(p * Math.PI * 1.6) * 0.42
    const x = Math.sin(p * Math.PI * 2.4) * 0.7
    _pos.set(x, y, z)
    state.camera.position.lerp(_pos, 0.06)
    _look.set(x * 0.2, 1.25, state.camera.position.z - 8)
    state.camera.lookAt(_look)
  })
  return null
}
