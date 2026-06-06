/**
 * A real 3D kitchen island built from geometry: dark base cabinet, light stone
 * worktop with a thin emissive under-counter light, a tall backsplash panel and
 * two glowing pendant lights. Used as the hero room centrepiece.
 */
export default function KitchenIsland3D({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* base cabinet (dark stone) */}
      <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 1.5, 2.1]} />
        <meshStandardMaterial color="#1b1916" metalness={0.35} roughness={0.4} />
      </mesh>
      {/* emissive under-counter light strip */}
      <mesh position={[0, 0.52, 1.02]}>
        <boxGeometry args={[4.4, 0.05, 0.06]} />
        <meshStandardMaterial color="#E8C978" emissive="#E8C978" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      {/* worktop (light stone) */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[4.9, 0.14, 2.3]} />
        <meshStandardMaterial color="#D8D0BE" metalness={0.15} roughness={0.35} />
      </mesh>
      {/* tall backsplash / cabinet block behind */}
      <mesh position={[0, 1.0, -1.8]} castShadow>
        <boxGeometry args={[5, 3, 0.4]} />
        <meshStandardMaterial color="#2B2925" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* gold accent line on the backsplash */}
      <mesh position={[0, 1.7, -1.58]}>
        <boxGeometry args={[4.4, 0.05, 0.04]} />
        <meshStandardMaterial color="#C9A050" emissive="#E8C978" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      {/* two pendant lights */}
      {[-1.3, 1.3].map((x) => (
        <group key={x} position={[x, 2.1, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1, 6]} />
            <meshStandardMaterial color="#2B2925" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color="#E8C978" emissive="#E8C978" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          <pointLight position={[0, -0.2, 0]} intensity={6} color="#ffe6ad" distance={6} />
        </group>
      ))}
    </group>
  )
}
