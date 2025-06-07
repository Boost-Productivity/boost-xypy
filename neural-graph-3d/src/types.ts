export interface NodeData {
    label: string;
    pythonFunction: string;
    isExecuting: boolean;
    lastOutput: string;
    streamingLogs: string;
    manualInput: string;
    inputs: Record<string, any>;
}

export interface FlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: NodeData;
    measured?: { width: number; height: number };
    selected?: boolean;
    dragging?: boolean;
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
}

export interface FlowData {
    flow_id: string;
    saved_at: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
}

export interface SpherePosition {
    x: number;
    y: number;
    z: number;
}

export interface NeuralNode extends FlowNode {
    spherePosition: SpherePosition;
    connectionCount: number;
}