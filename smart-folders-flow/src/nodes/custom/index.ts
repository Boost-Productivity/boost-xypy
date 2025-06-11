import nodeRegistry from '../NodeRegistry';

// Import base node
import SmartFolderNode from '../base/SmartFolderNode';
import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../base/BaseNode.types';

// Import custom nodes
import { brainDumpNodeConfig, brainDumpNodeFactory } from './BrainDumpNode';
import { labelNodeConfig, labelNodeFactory } from './LabelNode';
import { labelMakerNodeConfig, labelMakerNodeFactory } from './LabelMakerNode';
import { videoRecorderNodeConfig, videoRecorderNodeFactory } from './VideoRecorderNode';
import { loadVideoNodeConfig, loadVideoNodeFactory } from './LoadVideoNode';
import { loadAudioNodeConfig, loadAudioNodeFactory } from './LoadAudioNode';
import { anthropicNodeConfig, anthropicNodeFactory } from './AnthropicNode';
import { anthropicAdvancedNodeConfig, anthropicAdvancedNodeFactory } from './AnthropicAdvancedNode';
import { timerNodeConfig, timerNodeFactory } from './TimerNode';
import { ipWebcamNodeConfig, ipWebcamNodeFactory } from './IPWebcamNode';

// Register the base SmartFolderNode
const smartFolderNodeConfig: NodeTypeConfig = {
    type: 'smartFolder',
    displayName: 'Smart Folder',
    description: 'Base Python function processing node',
    component: SmartFolderNode,
    defaultData: {
        nodeType: 'smartFolder',
        label: 'Smart Folder',
        pythonFunction: 'def process(inputs):\n    # Access inputs with inputs.get("key", "default")\n    manual = inputs.get("manual", "")\n    return f"Processed: {manual}"',
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '',
    },
    icon: '📁',
    color: '#0066cc'
};

const smartFolderNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString(),
        type: 'smartFolder',
        position: {
            x: position.x - 150,
            y: position.y - 75,
        },
        data: {
            nodeType: 'smartFolder',
            label: `Smart Folder ${Date.now()}`,
            pythonFunction: 'def process(inputs):\n    # Access inputs with inputs.get("key", "default")\n    manual = inputs.get("manual", "")\n    return f"Processed: {manual}"',
            isExecuting: false,
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            manualInput: '',
        } as BaseNodeData,
    };
};

// Auto-register all nodes
const registerNodes = () => {
    // Register base node
    nodeRegistry.register(smartFolderNodeConfig, smartFolderNodeFactory);

    // Register custom nodes
    nodeRegistry.register(brainDumpNodeConfig, brainDumpNodeFactory);
    nodeRegistry.register(labelNodeConfig, labelNodeFactory);
    nodeRegistry.register(labelMakerNodeConfig, labelMakerNodeFactory);
    nodeRegistry.register(videoRecorderNodeConfig, videoRecorderNodeFactory);
    nodeRegistry.register(loadVideoNodeConfig, loadVideoNodeFactory);
    nodeRegistry.register(loadAudioNodeConfig, loadAudioNodeFactory);
    nodeRegistry.register(anthropicNodeConfig, anthropicNodeFactory);
    nodeRegistry.register(anthropicAdvancedNodeConfig, anthropicAdvancedNodeFactory);
    nodeRegistry.register(timerNodeConfig, timerNodeFactory);
    nodeRegistry.register(ipWebcamNodeConfig, ipWebcamNodeFactory);

    console.log(`✅ Registered ${nodeRegistry.getNodeTypes().length} node types`);
};

// Initialize registration
registerNodes();

// Export for potential external use
export {
    brainDumpNodeConfig,
    labelNodeConfig,
    labelMakerNodeConfig,
    videoRecorderNodeConfig,
    loadVideoNodeConfig,
    loadAudioNodeConfig,
    anthropicNodeConfig,
    anthropicAdvancedNodeConfig,
    timerNodeConfig,
    ipWebcamNodeConfig,
    brainDumpNodeFactory,
    labelNodeFactory,
    labelMakerNodeFactory,
    videoRecorderNodeFactory,
    loadVideoNodeFactory,
    loadAudioNodeFactory,
    anthropicNodeFactory,
    anthropicAdvancedNodeFactory,
    timerNodeFactory,
    ipWebcamNodeFactory
};

export default nodeRegistry;
export { nodeRegistry }; 