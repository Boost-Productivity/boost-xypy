import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import LabelMakerNode from './LabelMakerNode';
import { LabelMakerNodeData } from './LabelMakerNode.types';

export const labelMakerNodeConfig: NodeTypeConfig = {
    type: 'labelMaker',
    displayName: 'Label Maker',
    description: 'Creates multiple Label nodes from form inputs or Python function',
    component: LabelMakerNode,
    defaultData: {
        nodeType: 'labelMaker',
        label: 'Label Maker',
        pythonFunction: `def process(inputs):
    # This function creates Labels from your input
    # Each line in the output becomes a new Label node positioned below
    
    manual = inputs.get("manual", "Task 1\\nTask 2\\nTask 3")
    
    # Process your input to generate labels
    lines = manual.split("\\n")
    labels = []
    
    for line in lines:
        if line.strip():  # Skip empty lines
            # You can modify each label here
            processed_label = line.strip()
            labels.append(processed_label)
    
    # Each line returned creates a new Label node
    return "\\n".join(labels)`,
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: 'Buy groceries\nCall dentist\nFinish project\nReview meeting notes',
        customData: {
            mode: 'form',
            spacing: 80,
            startOffset: 150,
            labelWidth: 300,
            autoExecute: false,
            labelInputs: [''],
            labelFontSize: 24,
            labelTextColor: '#333333',
            labelBackgroundColor: '#ffffff',
            labelMaxWidth: 300,
        },
    },
    icon: '🏷️',
    color: '#667eea'
};

export const labelMakerNodeFactory: NodeFactory = (position, customData) => {
    const timestamp = Date.now();
    return {
        id: `labelMaker_${timestamp}`,
        type: 'labelMaker',
        position: {
            x: position.x - 150,
            y: position.y - 100,
        },
        data: {
            ...labelMakerNodeConfig.defaultData,
            label: `Label Maker ${timestamp}`,
            customData: {
                ...labelMakerNodeConfig.defaultData.customData,
                ...customData
            }
        } as LabelMakerNodeData,
    };
}; 