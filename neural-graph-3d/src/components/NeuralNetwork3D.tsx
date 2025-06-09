import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { NeuronNode } from './NeuronNode';
import { NeuralConnection } from './NeuralConnection';
import { createSphereLayout } from '../utils/sphereLayout';
import { FlowData, NeuralNode } from '../types';

interface NeuralNetwork3DProps {
    data: FlowData;
}

export const NeuralNetwork3D: React.FC<NeuralNetwork3DProps> = ({ data }) => {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Create the spherical layout
    const neuralNodes: NeuralNode[] = useMemo(() => {
        return createSphereLayout(data.nodes, data.edges, 5);
    }, [data.nodes, data.edges]);

    // Create node lookup map
    const nodeMap = useMemo(() => {
        const map = new Map<string, NeuralNode>();
        neuralNodes.forEach(node => map.set(node.id, node));
        return map;
    }, [neuralNodes]);

    // Filter valid edges (both nodes exist)
    const validEdges = useMemo(() => {
        return data.edges.filter(edge =>
            nodeMap.has(edge.source) && nodeMap.has(edge.target)
        );
    }, [data.edges, nodeMap]);

    const handleNodeSelect = (nodeId: string) => {
        setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
    };

    // Determine which edges should be highlighted
    const getHighlightedEdges = () => {
        if (!selectedNodeId) return new Set<string>();

        const highlightedEdges = new Set<string>();
        validEdges.forEach(edge => {
            if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
                highlightedEdges.add(edge.id);
            }
        });
        return highlightedEdges;
    };

    const highlightedEdges = getHighlightedEdges();

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0f0f0f' }}>
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 12]} />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    enableDamping={true}
                    dampingFactor={0.05}
                    rotateSpeed={0.5}
                    zoomSpeed={0.2}
                    panSpeed={0.8}
                    autoRotate={false}
                    minDistance={5}
                    maxDistance={15}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={3 * Math.PI / 4}
                />

                {/* Ambient lighting */}
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={0.8} />
                <pointLight position={[-10, -10, -10]} intensity={0.4} />

                {/* Stars background */}
                <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0}
                    fade={true}
                />

                {/* Semi-transparent sphere wireframe to show the structure */}
                <mesh>
                    <sphereGeometry args={[5.1, 32, 32]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.05}
                        wireframe
                    />
                </mesh>

                {/* Render neural connections */}
                {validEdges.map(edge => {
                    const sourceNode = nodeMap.get(edge.source);
                    const targetNode = nodeMap.get(edge.target);

                    if (!sourceNode || !targetNode) return null;

                    return (
                        <NeuralConnection
                            key={edge.id}
                            edge={edge}
                            sourceNode={sourceNode}
                            targetNode={targetNode}
                            isHighlighted={highlightedEdges.has(edge.id)}
                        />
                    );
                })}

                {/* Render neural nodes */}
                {neuralNodes.map(node => (
                    <NeuronNode
                        key={node.id}
                        node={node}
                        isSelected={node.id === selectedNodeId}
                        onSelect={handleNodeSelect}
                    />
                ))}
            </Canvas>

            {/* Info panel */}
            {selectedNodeId && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    maxWidth: '300px',
                    zIndex: 1000
                }}>
                    {(() => {
                        const selectedNode = nodeMap.get(selectedNodeId);
                        if (!selectedNode) return null;

                        return (
                            <>
                                <h3 style={{ margin: '0 0 8px 0', color: '#4dabf7' }}>
                                    {selectedNode.data.label}
                                </h3>
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                    <strong>Connections:</strong> {selectedNode.connectionCount}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                    <strong>Status:</strong> {
                                        selectedNode.data.isExecuting ? 'Executing' :
                                            selectedNode.data.lastOutput ? 'Completed' : 'Idle'
                                    }
                                </p>
                                {selectedNode.data.lastOutput && (
                                    <div style={{ marginTop: '8px' }}>
                                        <strong style={{ fontSize: '12px' }}>Last Output:</strong>
                                        <pre style={{
                                            fontSize: '11px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            margin: '4px 0',
                                            maxHeight: '100px',
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {selectedNode.data.lastOutput.substring(0, 200)}
                                            {selectedNode.data.lastOutput.length > 200 ? '...' : ''}
                                        </pre>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Controls info */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                zIndex: 1000
            }}>
                <div>🖱️ Click & drag to spin globe</div>
                <div>🔍 Scroll to zoom</div>
                <div>💫 Click nodes to inspect</div>
            </div>
        </div>
    );
};