/**
 * Two facing panels across the corridor the camera drives between.
 * Left = Möbelhaus (dull dark metal). Right = VIDEKO (gold-edged glass).
 * The actual comparison copy lives in the HTML overlay.
 */
export default function WhyVideko3D({ z = -23 }) {
  return (
    <group position={[0, 1.5, z]}>
      {/* Möbelhaus — dull, set slightly back */}
      <group position={[-5.6, 0, 1]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[5, 4, 0.12]} />
          <meshStandardMaterial color="#2B2925" metalness={0.5} roughness={0.6} />
        </mesh>
        <mesh>
          <boxGeometry args={[4.6, 3.6, 0.08]} />
          <meshStandardMaterial color="#3a3733" metalness={0.4} roughness={0.7} transparent opacity={0.9} />
        </mesh>
      </group>
      {/* VIDEKO — gold-edged glass, stepped forward */}
      <group position={[5.6, 0, -1]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[5, 4, 0.12]} />
          <meshStandardMaterial color="#C9A050" metalness={0.95} roughness={0.18} emissive="#E8C978" emissiveIntensity={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[4.6, 3.6, 0.08]} />
          <meshStandardMaterial color="#F0ECE2" metalness={0.2} roughness={0.3} transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  )
}
