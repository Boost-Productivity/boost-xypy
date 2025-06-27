import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import TextFileLoaderNode from './TextFileLoaderNode';
import { TextFileLoaderNodeData } from './TextFileLoaderNode.types';

export const textFileLoaderNodeConfig: NodeTypeConfig = {
    type: 'textFileLoader',
    displayName: 'Text File Loader',
    description: 'Load and preview text files from directory path',
    component: TextFileLoaderNode,
    defaultData: {
        label: 'Text File Loader',
        pythonFunction: `# Text file loader
# Passes the selected text file content for downstream processing
def process(inputs):
    # Check multiple sources for the file content
    file_content = inputs.get("manual", "").strip()
    
    # If manual input is empty, check fileContent from customData
    if not file_content:
        file_content = inputs.get("fileContent", "").strip()
    
    if not file_content:
        return "ERROR: No text file content loaded"
    
    log_progress(f"📄 Text file loaded: {len(file_content)} characters")
    
    # Return the file content
    return file_content`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'textFileLoader' as const,
        customData: {
            inputPath: '',
            selectedTextFile: '',
            availableTextFiles: [],
            fileContent: '',
            showFullContent: false,
            maxPreviewLength: 500,
        }
    } as TextFileLoaderNodeData,
    icon: '📄',
    color: '#4caf50'
};

export const textFileLoaderNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_textFileLoader',
        type: 'textFileLoader',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        draggable: true,
        data: {
            label: `Text Loader ${Date.now()}`,
            pythonFunction: `# Text file loader
# Passes the selected text file content for downstream processing
def process(inputs):
    # Check multiple sources for the file content
    file_content = inputs.get("manual", "").strip()
    
    # If manual input is empty, check fileContent from customData
    if not file_content:
        file_content = inputs.get("fileContent", "").strip()
    
    if not file_content:
        return "ERROR: No text file content loaded"
    
    log_progress(f"📄 Text file loaded: {len(file_content)} characters")
    
    # Return the file content
    return file_content`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'textFileLoader',
            customData: {
                inputPath: '',
                selectedTextFile: '',
                availableTextFiles: [],
                fileContent: '',
                showFullContent: false,
                maxPreviewLength: 500,
            }
        } as BaseNodeData,
    };
}; 