import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { NeuralNode } from '../types';

interface NeuronNodeProps {
    node: NeuralNode;
    isSelected: boolean;
    onSelect: (nodeId: string) => void;
}

export const NeuronNode: React.FC<NeuronNodeProps> = ({ node, isSelected, onSelect }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Animate the node with subtle pulsing based on connection count
    useFrame((state) => {
        if (meshRef.current) {
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
            const connectionScale = Math.max(0.8, node.connectionCount * 0.1);
            meshRef.current.scale.setScalar(connectionScale * pulse * (hovered ? 1.2 : 1));
        }
    });

    // Color based on connection density and execution state
    const getNodeColor = () => {
        if (node.data.isExecuting) return '#ff4757'; // Bright red-orange for executing
        if (node.data.lastOutput) return '#2ed573'; // Bright green for completed

        // Vibrant colors based on connection count that show well on dark background
        const connectionCount = node.connectionCount;

        if (connectionCount === 0) return '#ffa502'; // Bright orange for isolated nodes
        if (connectionCount <= 2) return '#3742fa'; // Electric blue for low connections
        if (connectionCount <= 4) return '#2f3542'; // Dark blue-gray for medium connections
        if (connectionCount <= 6) return '#ff6348'; // Coral for high connections
        return '#ff3838'; // Hot pink for very high connections
    };

    const nodeSize = Math.max(0.03, Math.min(0.08, node.connectionCount * 0.01 + 0.05));

    return (
        <group position={[node.spherePosition.x, node.spherePosition.y, node.spherePosition.z]}>
            {/* Main neuron sphere */}
            <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node.id);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                <sphereGeometry args={[nodeSize, 12, 12]} />
                <meshStandardMaterial
                    color={getNodeColor()}
                    emissive={isSelected ? '#ffffff' : getNodeColor()}
                    emissiveIntensity={isSelected ? 0.4 : 0.2}
                    metalness={0.1}
                    roughness={0.3}
                    transparent
                    opacity={hovered ? 1.0 : 0.9}
                />
            </mesh>

            {/* Connection count indicators - small orbiting spheres */}
            {Array.from({ length: Math.min(node.connectionCount, 6) }).map((_, i) => {
                const angle = (i / Math.min(node.connectionCount, 6)) * Math.PI * 2;
                const orbitRadius = nodeSize + 0.05;
                const x = Math.cos(angle) * orbitRadius;
                const z = Math.sin(angle) * orbitRadius;

                return (
                    <mesh key={i} position={[x, 0, z]}>
                        <sphereGeometry args={[0.01, 6, 6]} />
                        <meshBasicMaterial color="#00d8ff" transparent opacity={0.6} />
                    </mesh>
                );
            })}

            {/* Node label - always visible */}
            <Billboard>
                <Text
                    position={[0, nodeSize + 0.08, 0]}
                    fontSize={0.06}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {node.data.label}
                </Text>
            </Billboard>

            {/* Connection count badge - always visible */}
            {node.connectionCount > 0 && (
                <Billboard>
                    <Text
                        position={[0, -nodeSize - 0.05, 0]}
                        fontSize={0.04}
                        color="#00d8ff"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {node.connectionCount}
                    </Text>
                </Billboard>
            )}
        </group>
    );
}; 