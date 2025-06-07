import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NeuralNode, FlowEdge } from '../types';

interface NeuralConnectionProps {
    edge: FlowEdge;
    sourceNode: NeuralNode;
    targetNode: NeuralNode;
    isHighlighted: boolean;
}

export const NeuralConnection: React.FC<NeuralConnectionProps> = ({
    edge,
    sourceNode,
    targetNode,
    isHighlighted
}) => {
    const lineRef = useRef<THREE.Line>(null);
    const particleRefs = useRef<THREE.Mesh[]>([]);

    // Create curved line geometry and particles
    const { geometry, material, curve, particleCount } = useMemo(() => {
        const sourcePos = new THREE.Vector3(
            sourceNode.spherePosition.x,
            sourceNode.spherePosition.y,
            sourceNode.spherePosition.z
        );

        const targetPos = new THREE.Vector3(
            targetNode.spherePosition.x,
            targetNode.spherePosition.y,
            targetNode.spherePosition.z
        );

        // Create control point for curved line (bent towards center)
        const midPoint = new THREE.Vector3()
            .addVectors(sourcePos, targetPos)
            .multiplyScalar(0.5);

        // Bend the curve inward toward sphere center
        const bendFactor = 0.3;
        const controlPoint = midPoint.clone().multiplyScalar(1 - bendFactor);

        // Create curved line using QuadraticBezierCurve3
        const curve = new THREE.QuadraticBezierCurve3(sourcePos, controlPoint, targetPos);
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Create animated material with enhanced glow
        const material = new THREE.LineBasicMaterial({
            color: isHighlighted ? '#ffffff' : '#4dabf7',
            transparent: true,
            opacity: isHighlighted ? 0.9 : 0.6,
            linewidth: isHighlighted ? 3 : 2
        });

        const particleCount = 3; // Number of flowing particles per connection

        return { geometry, material, curve, particleCount };
    }, [sourceNode, targetNode, isHighlighted]);

    // Animate the connection with flowing particles
    useFrame((state) => {
        if (lineRef.current && material) {
            // Enhanced pulsing effect
            const time = state.clock.elapsedTime;
            const pulse = (Math.sin(time * 4) + 1) * 0.5;
            material.opacity = isHighlighted ? 0.7 + pulse * 0.3 : 0.4 + pulse * 0.2;

            // Animate flowing particles
            particleRefs.current.forEach((particle, index) => {
                if (particle) {
                    // Stagger particles along the curve
                    const offset = index / particleCount;
                    const speed = 0.5; // Adjust speed as needed
                    const t = ((time * speed + offset) % 1);

                    // Get position along the curve
                    const position = curve.getPoint(t);
                    particle.position.copy(position);

                    // Fade particles at start and end
                    const fadeDistance = 0.1;
                    let opacity = 1;
                    if (t < fadeDistance) {
                        opacity = t / fadeDistance;
                    } else if (t > 1 - fadeDistance) {
                        opacity = (1 - t) / fadeDistance;
                    }

                    (particle.material as THREE.MeshBasicMaterial).opacity = opacity * (isHighlighted ? 0.8 : 0.5);
                }
            });
        }
    });

    return (
        <group>
            {/* Main connection line */}
            <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />

            {/* Flowing particles */}
            {Array.from({ length: particleCount }).map((_, index) => (
                <mesh
                    key={index}
                    ref={(ref) => {
                        if (ref) particleRefs.current[index] = ref;
                    }}
                >
                    <sphereGeometry args={[0.015, 8, 8]} />
                    <meshBasicMaterial
                        color={isHighlighted ? '#ffffff' : '#00d8ff'}
                        transparent
                        opacity={0.8}
                    />
                </mesh>
            ))}
        </group>
    );
}; 