import { Node } from '@xyflow/react';
import { NodeTypeConfig, BaseNodeData, NodeFactory } from './base/BaseNode.types';

class NodeRegistry {
    private nodeTypes: Map<string, NodeTypeConfig> = new Map();
    private factories: Map<string, NodeFactory> = new Map();

    // Register a new node type
    register(config: NodeTypeConfig, factory: NodeFactory) {
        this.nodeTypes.set(config.type, config);
        this.factories.set(config.type, factory);
        console.log(`📦 Registered node type: ${config.type} (${config.displayName})`);
    }

    // Get all registered node types
    getNodeTypes(): NodeTypeConfig[] {
        return Array.from(this.nodeTypes.values());
    }

    // Get node type configuration
    getNodeType(type: string): NodeTypeConfig | undefined {
        return this.nodeTypes.get(type);
    }

    // Get all node components for React Flow
    getNodeComponents(): Record<string, React.ComponentType<any>> {
        const components: Record<string, React.ComponentType<any>> = {};
        this.nodeTypes.forEach((config, type) => {
            components[type] = config.component;
        });
        return components;
    }

    // Create a new node instance
    createNode(type: string, position: { x: number; y: number }, customData?: any): Node<BaseNodeData> | null {
        const factory = this.factories.get(type);
        if (!factory) {
            console.error(`❌ No factory found for node type: ${type}`);
            return null;
        }

        return factory(position, customData);
    }

    // Check if node type exists
    hasNodeType(type: string): boolean {
        return this.nodeTypes.has(type);
    }

    // Get default data for a node type
    getDefaultData(type: string): Partial<BaseNodeData> | null {
        const config = this.nodeTypes.get(type);
        return config ? config.defaultData : null;
    }
}

// Export singleton instance
export const nodeRegistry = new NodeRegistry();
export default nodeRegistry; 