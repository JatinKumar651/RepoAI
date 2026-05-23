import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 2000, color = "#7c3aed" }: { count?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.01;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.005) * 0.1;
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
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color={color}
        size={0.07}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.5}
      />
    </points>
  );
}

interface ParticleFieldProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function ParticleField({
  className = "",
  primaryColor = "#7c3aed",
  secondaryColor = "#06b6d4",
}: ParticleFieldProps) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 20], fov: 70 }}
      gl={{ antialias: false, alpha: true }}
    >
      <Particles count={1500} color={primaryColor} />
      <Particles count={800} color={secondaryColor} />
    </Canvas>
  );
}
