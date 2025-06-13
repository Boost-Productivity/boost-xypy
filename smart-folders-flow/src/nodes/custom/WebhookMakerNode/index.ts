import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import WebhookMakerNode from './WebhookMakerNode';
import { WebhookMakerNodeData } from './WebhookMakerNode.types';

export const webhookMakerNodeConfig: NodeTypeConfig = {
    type: 'webhookMaker',
    displayName: 'Webhook Maker',
    description: 'Creates multiple Webhook nodes from form inputs or Python function',
    component: WebhookMakerNode,
    defaultData: {
        nodeType: 'webhookMaker',
        label: 'Webhook Maker',
        pythonFunction: `def process(inputs):
    # This function creates Webhooks from your input
    # Each line in the output becomes a new Webhook node positioned below
    
    manual = inputs.get("manual", "boost_vision_board_goal_created\\nboost_vision_board_goal_updated\\nboost_vision_board_goal_completed")
    
    # Process your input to generate webhook names
    lines = manual.split("\\n")
    webhook_names = []
    
    for line in lines:
        if line.strip():  # Skip empty lines
            # Clean and validate webhook name
            clean_name = line.strip().lower().replace(" ", "_")
            webhook_names.append(clean_name)
    
    # Each line returned creates a new Webhook node
    return "\\n".join(webhook_names)`,
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '',
        customData: {
            mode: 'form',
            spacing: 120,
            startOffset: 150,
            webhookWidth: 350,
            autoExecute: false,
            webhookInputs: [''],
            baseUrl: '',
        },
    },
    icon: '📨',
    color: '#3b82f6'
};

export const webhookMakerNodeFactory: NodeFactory = (position, customData) => {
    const timestamp = Date.now();
    return {
        id: `webhookMaker_${timestamp}`,
        type: 'webhookMaker',
        position: {
            x: position.x - 175,
            y: position.y - 100,
        },
        data: {
            ...webhookMakerNodeConfig.defaultData,
            label: `Webhook Maker ${timestamp}`,
            customData: {
                ...webhookMakerNodeConfig.defaultData.customData,
                ...customData
            }
        } as WebhookMakerNodeData,
    };
}; 