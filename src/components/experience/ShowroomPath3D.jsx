/** A corridor of golden light arches that guide the camera through the showroom zone. */
export default function ShowroomPath3D({ z = -48 }) {
  const arches = [0, 1, 2, 3, 4]
  return (
    <group position={[0, 1.3, z]}>
      {arches.map((i) => (
        <mesh key={i} position={[0, 0, -i * 4.5]}>
          <torusGeometry args={[2.7, 0.05, 16, 64]} />
          <meshStandardMaterial
            color="#C9A050"
            metalness={0.9}
            roughness={0.2}
            emissive="#E8C978"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      {/* subtle side pillars */}
      {arches.map((i) => (
        <group key={`p${i}`} position={[0, -1.1, -i * 4.5]}>
          <mesh position={[-2.7, 0, 0]}>
            <boxGeometry args={[0.18, 2.6, 0.18]} />
            <meshStandardMaterial color="#2B2925" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[2.7, 0, 0]}>
            <boxGeometry args={[0.18, 2.6, 0.18]} />
            <meshStandardMaterial color="#2B2925" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
