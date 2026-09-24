import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import styles from './NetworkGraph3D.module.css';

/* ------------ helpers ------------ */
function generateNodes(count) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const radius = 3 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    nodes.push({
      id: i,
      position: [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ],
      color: ['#00ffa3', '#00d4ff', '#a855f7', '#ff2d92'][i % 4],
      pulseSpeed: 0.5 + Math.random() * 1.5,
      size: 0.08 + Math.random() * 0.08,
    });
  }
  return nodes;
}

function buildLinks(nodes, maxDistance = 3.2) {
  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = new THREE.Vector3(...nodes[i].position);
      const b = new THREE.Vector3(...nodes[j].position);
      if (a.distanceTo(b) < maxDistance) {
        links.push({ id: `${i}-${j}`, a: nodes[i], b: nodes[j] });
      }
    }
  }
  return links;
}

/* ------------ sub-components ------------ */
function Node({ node }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * node.pulseSpeed) * 0.25;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={node.position}>
      <sphereGeometry args={[node.size, 12, 12]} />
      <meshStandardMaterial
        color={node.color}
        emissive={node.color}
        emissiveIntensity={2.5}
        toneMapped={false}
      />
    </mesh>
  );
}

function Link({ link }) {
  const points = useMemo(
    () => [new THREE.Vector3(...link.a.position), new THREE.Vector3(...link.b.position)],
    [link]
  );
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color={link.a.color}
        transparent
        opacity={0.18}
      />
    </line>
  );
}

function Pulse({ link, speed = 0.35, offset = 0 }) {
  const ref = useRef();
  const start = useMemo(() => new THREE.Vector3(...link.a.position), [link]);
  const end = useMemo(() => new THREE.Vector3(...link.b.position), [link]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() * speed + offset) % 1;
    ref.current.position.lerpVectors(start, end, t);
    const op = Math.sin(t * Math.PI);
    ref.current.material.opacity = op * 0.9;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshBasicMaterial color={link.b.color} transparent />
    </mesh>
  );
}

function Scene({ nodeCount, showPulses }) {
  const groupRef = useRef();
  const nodes = useMemo(() => generateNodes(nodeCount), [nodeCount]);
  const links = useMemo(() => buildLinks(nodes), [nodes]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.06;
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[8, 8, 8]} intensity={1.2} color="#00ffa3" />
      <pointLight position={[-8, -6, -8]} intensity={0.9} color="#a855f7" />

      <group ref={groupRef}>
        {nodes.map((n) => (
          <Node key={n.id} node={n} />
        ))}
        {links.map((l) => (
          <Link key={l.id} link={l} />
        ))}
        {showPulses &&
          links.slice(0, 24).map((l, i) => (
            <Pulse key={`p-${l.id}`} link={l} offset={i * 0.13} />
          ))}
      </group>
    </>
  );
}

/* ------------ main component ------------ */
export default function NetworkGraph3D({
  nodeCount = 22,
  height = '100%',
  showPulses = true,
  interactive = true,
}) {
  return (
    <div className={styles.wrapper} style={{ height }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene nodeCount={nodeCount} showPulses={showPulses} />
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate={false}
            rotateSpeed={0.4}
          />
        )}
      </Canvas>
    </div>
  );
}