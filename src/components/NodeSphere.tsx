import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function fibonacciSphere(count: number, radius: number) {
  const points: [number, number, number][] = []
  const offset = 2 / count
  const increment = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const phi = i * increment
    const x = Math.cos(phi) * r
    const z = Math.sin(phi) * r
    points.push([x * radius, y * radius, z * radius])
  }
  return points
}

function WalletGraph() {
  const group = useRef<THREE.Group>(null)
  const nodes = useMemo(() => fibonacciSphere(64, 2.1), [])

  const edges = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = []
    nodes.forEach((p, i) => {
      const a = new THREE.Vector3(...p)
      // connect each node to its 2 nearest neighbours for a "network" feel
      const distances = nodes
        .map((q, j) => ({ j, d: a.distanceTo(new THREE.Vector3(...q)) }))
        .filter((e) => e.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2)
      distances.forEach(({ j }) => {
        lines.push([a, new THREE.Vector3(...nodes[j])])
      })
    })
    return lines
  }, [nodes])

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08
      group.current.rotation.x += delta * 0.012
    }
  })

  const lineGeom = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6)
    })
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [edges])

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#6c8eff" transparent opacity={0.18} />
      </lineSegments>
      {nodes.map((p, i) => {
        // a handful of "whale" nodes glow amber, rest are muted data-blue
        const isSignal = i % 11 === 0
        return (
          <mesh key={i} position={p}>
            <sphereGeometry args={[isSignal ? 0.045 : 0.024, 8, 8]} />
            <meshBasicMaterial color={isSignal ? '#ffb454' : '#4fd8c4'} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function NodeSphere() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <WalletGraph />
    </Canvas>
  )
}
