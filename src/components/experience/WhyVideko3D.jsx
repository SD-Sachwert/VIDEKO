/**
 * "Warum VIDEKO" midground: two clusters of panels with real depth.
 * Left = Möbelhaus (dull, set back, askew). Right = VIDEKO (gold-edged, forward).
 * The actual comparison copy lives in the HTML overlay.
 */
export default function WhyVideko3D({ z = -31 }) {
  const stack = [0, 1, 2]
  return (
    <group position={[0, 1.3, z]}>
      {stack.map((i) => (
        <mesh key={`m${i}`} position={[-4.4 - i * 0.5, 1.1 - i * 1.15, -1.2 - i * 0.9]} rotation={[0, 0.38, 0]}>
          <boxGeometry args={[3, 1.55, 0.1]} />
          <meshStandardMaterial color="#2B2925" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
      {stack.map((i) => (
        <group key={`v${i}`} position={[4.3 + i * 0.25, 1.5 - i * 1.15, 0.6 + i * 0.7]} rotation={[0, -0.38, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[3.2, 1.7, 0.06]} />
            <meshStandardMaterial color="#C9A050" metalness={0.95} roughness={0.2} emissive="#E8C978" emissiveIntensity={0.32} />
          </mesh>
          <mesh>
            <boxGeometry args={[3, 1.55, 0.1]} />
            <meshStandardMaterial color="#F0ECE2" metalness={0.25} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
