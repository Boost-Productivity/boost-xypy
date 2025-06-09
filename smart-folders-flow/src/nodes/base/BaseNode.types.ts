import { Node, NodeProps } from '@xyflow/react';

// Base interface that all custom node data must extend
export interface BaseNodeData extends Record<string, unknown> {
    label: string;
    pythonFunction: string;
    isExecuting: boolean;
    lastOutput: string;
    streamingLogs: string;
    inputs: Record<string, {
        value: string;
        timestamp: number;
        nodeLabel: string;
        isManual?: boolean;
    }>;
    manualInput: string;
    sessionId?: string;
    // Custom node specific data
    nodeType: string;
    customData?: Record<string, any>;
}

// Base node component interface
export interface BaseNodeComponent {
    id: string;
    data: BaseNodeData;
    type: string;
}

// Node configuration for registration
export interface NodeTypeConfig {
    type: string;
    displayName: string;
    description?: string;
    component: React.ComponentType<NodeProps>;
    defaultData: Partial<BaseNodeData>;
    icon?: string;
    color?: string;
}

// Factory function type
export type NodeFactory = (position: { x: number; y: number }, customData?: any) => Node<BaseNodeData>; 