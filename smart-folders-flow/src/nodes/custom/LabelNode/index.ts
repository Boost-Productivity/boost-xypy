import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { LabelNodeData } from './LabelNode.types';
import LabelNode from './LabelNode';

export const labelNodeConfig: NodeTypeConfig = {
    type: 'label',
    displayName: 'Label/Function Node',
    description: 'A node that can toggle between large text label and function modes',
    component: LabelNode,
    defaultData: {
        nodeType: 'label',
        label: 'My Label',
        pythonFunction: 'def process(inputs):\n    # Label processing function\n    manual = inputs.get("manual", "")\n    return f"Label: {manual}"',
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '',
        customData: {
            mode: 'label',
            fontSize: 24,
            textColor: '#333333',
            backgroundColor: '#ffffff'
        }
    },
    icon: '🏷️',
    color: '#28a745'
};

export const labelNodeFactory: NodeFactory = (position, customData) => {
    return {
        id: Date.now().toString(),
        type: 'label',
        position: {
            x: position.x - 100, // Center the node
            y: position.y - 50,
        },
        data: {
            ...labelNodeConfig.defaultData,
            label: `Label ${Date.now()}`, // Unique label
            customData: {
                ...labelNodeConfig.defaultData.customData,
                ...customData
            }
        } as LabelNodeData,
    };
};

export default LabelNode; 