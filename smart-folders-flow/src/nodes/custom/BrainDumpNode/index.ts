import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { BrainDumpNodeData } from './BrainDumpNode.types';
import BrainDumpNode from './BrainDumpNode';

export const brainDumpNodeConfig: NodeTypeConfig = {
    type: 'brainDump',
    displayName: 'Brain Dump Timer',
    description: 'A circular timer node for brain dump sessions',
    component: BrainDumpNode,
    defaultData: {
        nodeType: 'brainDump',
        label: 'Brain Dump',
        pythonFunction: 'def process(inputs):\n    # Brain dump processing function\n    manual = inputs.get("manual", "")\n    return f"Brain dump complete: {len(manual)} characters captured"',
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '',
        customData: {
            countdownSeconds: 300, // 5 minutes default
            isCountingDown: false,
        }
    },
    icon: '🧠',
    color: '#1976d2'
};

export const brainDumpNodeFactory: NodeFactory = (position, customData) => {
    return {
        id: Date.now().toString(),
        type: 'brainDump',
        position: {
            x: position.x - 100, // Center the circular node
            y: position.y - 100,
        },
        data: {
            ...brainDumpNodeConfig.defaultData,
            label: `Brain Dump ${Date.now()}`, // Unique label
            customData: {
                ...brainDumpNodeConfig.defaultData.customData,
                ...customData
            }
        } as BrainDumpNodeData,
    };
};

export default BrainDumpNode; 