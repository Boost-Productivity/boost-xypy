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
 * Create mesh flow layout where subscribers are one timezone west of publishers (left to right flow)
 */
export function createSphereLayout(nodes: FlowNode[], edges: FlowEdge[], radius: number = 5): NeuralNode[] {
    const connectionDensity = calculateConnectionDensity(nodes, edges);

    // Build adjacency lists
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();

    nodes.forEach(node => {
        outgoing.set(node.id, []);
        incoming.set(node.id, []);
    });

    edges.forEach(edge => {
        outgoing.get(edge.source)?.push(edge.target);
        incoming.get(edge.target)?.push(edge.source);
    });

    // Find source nodes (no incoming edges)
    const sourceNodes = nodes.filter(node =>
        (incoming.get(node.id) || []).length === 0
    );

    console.log('Source nodes:', sourceNodes.map(n => n.data.label));

    // Position tracking
    const nodePositions = new Map<string, { longitude: number, latitude: number }>();
    const visited = new Set<string>();

    // Position source nodes at the front of the globe (0° longitude) so they're visible
    const startLongitude = -225; // Front of the globe where camera is looking

    // Step 1: Position source nodes at front longitude
    sourceNodes.forEach((node, index) => {
        // Cluster in middle latitudes like Earth's land masses (-30 to +50)
        const latitudeRange = 80; // -30 to +50
        const startLatitude = -30;
        const latitudeStep = sourceNodes.length > 1 ? latitudeRange / (sourceNodes.length - 1) : 0;
        const latitude = startLatitude + (index * latitudeStep);

        nodePositions.set(node.id, {
            longitude: startLongitude, // Start at front of globe
            latitude: latitude
        });
    });

    // Step 2: Use BFS to position subscribers relative to their publishers
    const queue = [...sourceNodes.map(n => n.id)];

    while (queue.length > 0) {
        const publisherId = queue.shift()!;

        if (visited.has(publisherId)) continue;
        visited.add(publisherId);

        const publisherPos = nodePositions.get(publisherId);
        if (!publisherPos) continue;

        const subscribers = outgoing.get(publisherId) || [];

        if (subscribers.length > 0) {
            console.log(`Publisher "${publisherId}" at longitude ${publisherPos.longitude}° has ${subscribers.length} subscribers`);

            // Position subscribers one timezone WEST (-10° longitude) for left-to-right flow
            const subscriberLongitude = publisherPos.longitude - 10;
            const publisherLatitude = publisherPos.latitude;

            subscribers.forEach((subscriberId, index) => {
                // Skip if already positioned (first publisher wins)
                if (nodePositions.has(subscriberId)) return;

                // Spread subscribers around publisher's latitude
                let subscriberLatitude;
                if (subscribers.length === 1) {
                    // Single subscriber stays at same latitude
                    subscriberLatitude = publisherLatitude;
                } else {
                    // Multiple subscribers spread around publisher latitude
                    const spreadRange = 8; // ±4 degrees around publisher
                    const step = subscribers.length > 1 ? spreadRange / (subscribers.length - 1) : 0;
                    subscriberLatitude = publisherLatitude - (spreadRange / 2) + (index * step);
                }

                // Clamp to valid range
                subscriberLatitude = Math.max(-30, Math.min(50, subscriberLatitude));

                nodePositions.set(subscriberId, {
                    longitude: subscriberLongitude,
                    latitude: subscriberLatitude
                });

                // Add to queue for further processing
                queue.push(subscriberId);
            });
        }
    }

    // Handle any unpositioned nodes (disconnected)
    nodes.forEach(node => {
        if (!nodePositions.has(node.id)) {
            nodePositions.set(node.id, {
                longitude: startLongitude,
                latitude: Math.random() * 80 - 30 // Random latitude in middle range (-30 to +50)
            });
        }
    });

    console.log('Final positions:', Array.from(nodePositions.entries()));

    // Convert to neural nodes
    const neuralNodes: NeuralNode[] = nodes.map(node => {
        const pos = nodePositions.get(node.id)!;
        const spherePosition = sphericalToCartesian(pos.longitude, pos.latitude, radius);

        return {
            ...node,
            spherePosition,
            connectionCount: connectionDensity.get(node.id) || 0
        };
    });

    return neuralNodes;
}