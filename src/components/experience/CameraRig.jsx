import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()

/**
 * Scroll-driven camera flight through the 6 scenes. progress is a ref (0..1).
 * Camera glides from z≈10 down to z≈-122; gentle x/y sway keeps it cinematic.
 */
export default function CameraRig({ progress }) {
  useFrame((state) => {
    const p = progress.current || 0
    const z = 10 + p * -132
    const y = 1.5 + Math.sin(p * Math.PI * 1.5) * 0.55
    const x = Math.sin(p * Math.PI * 3) * 1.0
    _pos.set(x, y, z)
    state.camera.position.lerp(_pos, 0.06)
    _look.set(x * 0.25, 1.1, state.camera.position.z - 8)
    state.camera.lookAt(_look)
  })
  return null
}
