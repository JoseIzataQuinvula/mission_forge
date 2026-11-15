import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '../store/missionStore';
import { COMPONENTS_BY_ID } from '../data/spacecraftComponents';

interface DragState {
  active: boolean;
  lastX: number;
  lastY: number;
  rotY: number;
  rotX: number;
}

function LunarSurface() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(70, 70, 90, 90);
    const position = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const ridge =
        Math.sin(x * 0.18) * 0.22 +
        Math.cos(y * 0.22) * 0.18 +
        Math.sin((x + y) * 0.42) * 0.08;
      const crater = Math.max(0, Math.sin(x * 0.6) * Math.cos(y * 0.5)) * 0.12;
      position.setZ(i, ridge + crater - 0.2);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const rocks = useMemo(
    () => [
      { position: [-1.9, 0.05, -1.4], scale: 0.22 },
      { position: [2.1, 0.02, -1.1], scale: 0.16 },
      { position: [-2.6, 0.02, 0.9], scale: 0.14 },
      { position: [1.6, 0.03, 1.7], scale: 0.1 },
      { position: [0.3, 0.02, -2.3], scale: 0.12 },
    ],
    [],
  );

  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#2a3444" roughness={1} metalness={0} />
      </mesh>
      {rocks.map((rock, index) => (
        <mesh key={index} position={rock.position as [number, number, number]} scale={rock.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#3b4657" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Stars() {
  const positions = useMemo(() => {
    const count = 700;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const theta = i * 2.399963;
      const radius = 30 + ((i * 37) % 50);
      const y = Math.sin(i * 1.7) * 22;
      array[i * 3] = Math.cos(theta) * radius;
      array[i * 3 + 1] = Math.abs(y) + 4;
      array[i * 3 + 2] = Math.sin(theta) * radius;
    }
    return array;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#94A3B8" size={0.07} sizeAttenuation />
    </points>
  );
}

function SolarPanel({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * 1.35, 0.18, 0]} rotation={[0, 0, side * -0.08]}>
      <mesh>
        <boxGeometry args={[1.5, 0.04, 0.85]} />
        <meshStandardMaterial color="#12324c" metalness={0.6} roughness={0.35} />
      </mesh>
      {[-0.45, 0, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.03, 0]}>
          <boxGeometry args={[0.02, 0.01, 0.82]} />
          <meshStandardMaterial color="#39BDF8" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[-side * 0.78, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Lander({ rotation }: { rotation: React.MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  const componentIds = useMissionStore((state) => state.config.componentIds);

  const has = (id: string) => componentIds.includes(id);
  const categoryHas = (category: string) =>
    componentIds.some((id) => COMPONENTS_BY_ID[id]?.category === category);

  const solar = has('pwr-solar-array') || has('pwr-solar-battery');
  const rtg = has('pwr-rtg') || has('pwr-rtg-battery');
  const dish = categoryHas('communication') && !has('comm-omni');
  const omni = has('comm-omni');
  const instruments = componentIds.filter(
    (id) => COMPONENTS_BY_ID[id]?.category === 'instruments',
  );

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = rotation.current;
    group.current.rotation.y += delta * 0.18;
    group.current.rotation.y += (target.y - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (target.x - group.current.rotation.x) * 0.05;
  });

  return (
    <group ref={group} position={[0, 0.62, 0]}>
      {/* bus */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.45, 0.95, 1.15]} />
        <meshStandardMaterial color="#c7d3e1" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.35, 0.59]}>
        <boxGeometry args={[1.1, 0.55, 0.03]} />
        <meshStandardMaterial color="#111B2A" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.35, 0.61]}>
        <boxGeometry args={[0.9, 0.05, 0.01]} />
        <meshStandardMaterial color="#39BDF8" emissive="#39BDF8" emissiveIntensity={1.2} />
      </mesh>

      {/* legs */}
      {[
        [0.72, 0.6],
        [-0.72, 0.6],
        [0.72, -0.6],
        [-0.72, -0.6],
      ].map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, -0.02, 0]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
            <cylinderGeometry args={[0.035, 0.035, 0.85, 8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[x > 0 ? 0.18 : -0.18, -0.42, 0]}>
            <cylinderGeometry args={[0.16, 0.19, 0.06, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* engine bell */}
      <mesh position={[0, -0.18, 0]}>
        <coneGeometry args={[0.24, 0.4, 16, 1, true]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>

      {solar && <SolarPanel side={1} />}
      {solar && <SolarPanel side={-1} />}

      {rtg && (
        <group position={[0, 0.95, -0.35]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.2, 0.42, 10]} />
            <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.03, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      )}

      {dish && (
        <group position={[0, 1.05, 0.15]} rotation={[-0.5, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.42, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.36, 6]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {omni && (
        <mesh position={[0, 1.02, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 6]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
      )}

      {/* instrument deck */}
      {instruments.slice(0, 3).map((id, index) => (
        <mesh key={id} position={[-0.35 + index * 0.35, 0.88, 0.28]}>
          <boxGeometry args={[0.22, 0.16, 0.22]} />
          <meshStandardMaterial
            color={index === 0 ? '#22C55E' : index === 1 ? '#39BDF8' : '#F59E0B'}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* thermal blanket hint */}
      <mesh position={[0, 0.35, -0.585]}>
        <boxGeometry args={[1.3, 0.8, 0.02]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function SpacecraftScene() {
  const rotation = useRef({ x: 0, y: 0 });
  const drag = useRef<DragState>({ active: false, lastX: 0, lastY: 0, rotY: 0, rotX: 0 });
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`scene-canvas ${dragging ? 'is-dragging' : ''}`}
      onPointerDown={(event) => {
        drag.current.active = true;
        drag.current.lastX = event.clientX;
        drag.current.lastY = event.clientY;
        drag.current.rotY = rotation.current.y;
        drag.current.rotX = rotation.current.x;
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current.active) return;
        const dx = event.clientX - drag.current.lastX;
        const dy = event.clientY - drag.current.lastY;
        rotation.current.y = drag.current.rotY + dx * 0.008;
        rotation.current.x = Math.max(
          -0.35,
          Math.min(0.35, drag.current.rotX + dy * 0.004),
        );
      }}
      onPointerUp={() => {
        drag.current.active = false;
        setDragging(false);
      }}
      onPointerLeave={() => {
        drag.current.active = false;
        setDragging(false);
      }}
    >
      <Canvas
        camera={{ position: [4.6, 2.9, 5.6], fov: 38 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#080D16']} />
        <fog attach="fog" args={['#080D16', 16, 44]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[6, 9, 4]} intensity={2.1} color="#f8fafc" />
        <directionalLight position={[-5, 3, -4]} intensity={0.55} color="#39BDF8" />
        <Stars />
        <LunarSurface />
        <Lander rotation={rotation} />
        <mesh position={[-7, 8, -22]}>
          <sphereGeometry args={[1.5, 24, 24]} />
          <meshStandardMaterial
            color="#1d4ed8"
            emissive="#0f2a52"
            emissiveIntensity={0.4}
            roughness={0.8}
          />
          <mesh position={[0.4, 0.3, 0.4]}>
            <sphereGeometry args={[0.55, 16, 16]} />
            <meshStandardMaterial color="#22C55E" roughness={0.9} />
          </mesh>
        </mesh>
      </Canvas>
    </div>
  );
}
