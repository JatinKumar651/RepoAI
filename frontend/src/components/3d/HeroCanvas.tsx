import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function StarField() {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const count = 5000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.02;
      ref.current.rotation.y -= delta * 0.03;
    }
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#a78bfa"
        size={0.12}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </points>
  );
}

function GalaxyRing() {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 25 + 10;
      const spread = (Math.random() - 0.5) * 3;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = spread;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#06b6d4"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </points>
  );
}

function FloatingOrb() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 2;
      ref.current.rotation.x = clock.elapsedTime * 0.3;
      ref.current.rotation.z = clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, -5]}>
      <icosahedronGeometry args={[3, 1]} />
      <meshStandardMaterial
        color="#7c3aed"
        wireframe
        transparent
        opacity={0.3}
        emissive="#7c3aed"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

interface HeroCanvasProps {
  className?: string;
}

export default function HeroCanvas({ className = "" }: HeroCanvasProps) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 30], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} color="#7c3aed" intensity={2} />
      <pointLight position={[-10, -10, -10]} color="#06b6d4" intensity={1} />
      <StarField />
      <GalaxyRing />
      <FloatingOrb />
    </Canvas>
  );
}
