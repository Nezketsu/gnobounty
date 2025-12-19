"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Plane, Stars } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Shader material for the terrain to give it a glowing grid effect
const TerrainMaterial = {
    uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color("#22d3ee") }
    },
    vertexShader: `
    varying vec2 vUv;
    varying float vElevation;
    uniform float time;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float elevation = sin(pos.x * 0.5 + time) * 0.5 + sin(pos.y * 0.3 + time * 0.8) * 0.5;
      pos.z += elevation;
      vElevation = elevation;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
    fragmentShader: `
    varying vec2 vUv;
    varying float vElevation;
    uniform vec3 color;
    void main() {
      float gridX = step(0.98, fract(vUv.x * 40.0));
      float gridY = step(0.98, fract(vUv.y * 40.0));
      float grid = max(gridX, gridY);
      float alpha = (1.0 - length(vUv - 0.5) * 2.0);
      alpha = clamp(alpha, 0.0, 1.0);
      vec3 finalColor = mix(color * 0.5, color, vElevation * 0.5 + 0.5);
      gl_FragColor = vec4(finalColor, grid * alpha * 0.8);
    }
  `
};

function DigitalTerrain() {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.getElapsedTime() * 0.5;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -2, -5]}>
            <planeGeometry args={[40, 40, 128, 128]} />
            <shaderMaterial
                ref={materialRef}
                args={[TerrainMaterial]}
                transparent
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

function FloatingParticles() {
    const count = 100;
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const x = (Math.random() - 0.5) * 30;
            const y = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 10;
            temp.push({ t, factor, speed, x, y, z, mx: 0, my: 0 });
        }
        return temp;
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!meshRef.current) return;

        particles.forEach((particle, i) => {
            let { t, factor, speed, x, y, z } = particle;
            t = particle.t += speed / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);

            dummy.position.set(
                x + Math.cos(t / 10) * i / 20, // Add some wave motion
                y + Math.sin(t / 10) * i / 20,
                z + (s * 2) // Bob up and down
            );
            dummy.scale.set(s, s, s);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();

            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.6} />
        </instancedMesh>
    );
}

export default function Hero3D() {
    return (
        <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden bg-[#050510]">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={60} />
                <fog attach="fog" args={['#050510', 5, 25]} />

                <DigitalTerrain />
                <FloatingParticles />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <ambientLight intensity={0.5} />
            </Canvas>

            {/* Gradient Overlay for seamless blending */}
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#050510] to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#050510] to-transparent pointer-events-none" />
        </div>
    );
}
