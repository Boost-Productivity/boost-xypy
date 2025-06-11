import { FlowNode, FlowEdge, NeuralNode, SpherePosition } from '../types';

/**
 * Calculate connection density for each node
 */
export function calculateConnectionDensity(nodes: FlowNode[], edges: FlowEdge[]): Map<string, number> {
    const connectionCount = new Map<string, number>();

    nodes.forEach(node => connectionCount.set(node.id, 0));

    edges.forEach(edge => {
        connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
        connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
    });

    return connectionCount;
}

/**
 * Convert spherical coordinates to cartesian
 */
export function sphericalToCartesian(longitude: number, latitude: number, radius: number = 5): SpherePosition {
    const phi = latitude * Math.PI / 180;
    const theta = longitude * Math.PI / 180;

    return {
        x: radius * Math.cos(phi) * Math.cos(theta),
        y: radius * Math.sin(phi),
        z: radius * Math.cos(phi) * Math.sin(theta)
    };
}

/**
 * Create sphere layout by mapping existing 2D x,y positions onto sphere surface
 */
export function createSphereLayout(nodes: FlowNode[], edges: FlowEdge[], radius: number = 5): NeuralNode[] {
    const connectionDensity = calculateConnectionDensity(nodes, edges);

    // Find the bounds of existing x,y coordinates
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
        const x = node.position.x;
        const y = node.position.y;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    });

    console.log(`X range: ${minX} to ${maxX}, Y range: ${minY} to ${maxY}`);

    // Map x,y coordinates to longitude,latitude
    const mapToSphere = (x: number, y: number) => {
        // Normalize x,y to [0,1] range
        const normalizedX = (x - minX) / (maxX - minX);
        const normalizedY = (y - minY) / (maxY - minY);

        // Map to longitude (-180 to 180) and latitude (-90 to 90)
        // X maps to longitude (west to east flow maintained)
        const longitude = (normalizedX * 360) - 180;

        // Y maps to latitude (flip Y since screen Y increases downward but latitude increases upward)
        const latitude = ((1 - normalizedY) * 180) - 90;

        return { longitude, latitude };
    };

    // Convert to neural nodes using existing positions
    const neuralNodes: NeuralNode[] = nodes.map(node => {
        const { longitude, latitude } = mapToSphere(node.position.x, node.position.y);
        const spherePosition = sphericalToCartesian(longitude, latitude, radius);

        return {
            ...node,
            spherePosition,
            connectionCount: connectionDensity.get(node.id) || 0
        };
    });

    return neuralNodes;
}