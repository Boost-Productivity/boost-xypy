import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import TextFileWriterNode from './TextFileWriterNode';
import { TextFileWriterNodeData } from './TextFileWriterNode.types';

export const textFileWriterNodeConfig: NodeTypeConfig = {
    type: 'textFileWriter',
    displayName: 'Text File Writer',
    description: 'Write text content to a file in specified directory',
    component: TextFileWriterNode,
    defaultData: {
        label: 'Text File Writer',
        pythonFunction: `# Text file writer
# Saves text content to a text file in the specified directory
def process(inputs):
    import os
    import datetime
    from pathlib import Path
    
    # Get inputs
    text_content = inputs.get("text_content", "")
    output_dir = inputs.get("output_dir", "")
    custom_filename = inputs.get("filename", "")
    
    if not text_content:
        return "Error: text_content is required"
    
    if not output_dir:
        return "Error: output_dir is required"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Generate filename
        if custom_filename:
            output_filename = f"{custom_filename}.txt"
        else:
            # Use timestamp for automatic naming
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"text_output_{timestamp}.txt"
        
        output_path = os.path.join(output_dir, output_filename)
        
        # Save text file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text_content)
        
        log_progress(f"Successfully saved text file: {output_path}")
        log_progress(f"File size: {len(text_content)} characters")
        
        return output_path
        
    except Exception as e:
        error_msg = f"Error saving text file: {str(e)}"
        log_progress(error_msg)
        return error_msg`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'textFileWriter' as const,
        customData: {
            textContent: '',
            outputDirectory: '',
            filename: 'output',
            overwriteExisting: true,
        }
    } as TextFileWriterNodeData,
    icon: '📝',
    color: '#2196f3'
};

export const textFileWriterNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_textFileWriter',
        type: 'textFileWriter',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        data: {
            label: `Text Writer ${Date.now()}`,
            pythonFunction: `# Text file writer
# Saves text content to a text file in the specified directory
def process(inputs):
    import os
    import datetime
    from pathlib import Path
    
    # Get inputs
    text_content = inputs.get("text_content", "")
    output_dir = inputs.get("output_dir", "")
    custom_filename = inputs.get("filename", "")
    
    if not text_content:
        return "Error: text_content is required"
    
    if not output_dir:
        return "Error: output_dir is required"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Generate filename
        if custom_filename:
            output_filename = f"{custom_filename}.txt"
        else:
            # Use timestamp for automatic naming
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"text_output_{timestamp}.txt"
        
        output_path = os.path.join(output_dir, output_filename)
        
        # Save text file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text_content)
        
        log_progress(f"Successfully saved text file: {output_path}")
        log_progress(f"File size: {len(text_content)} characters")
        
        return output_path
        
    except Exception as e:
        error_msg = f"Error saving text file: {str(e)}"
        log_progress(error_msg)
        return error_msg`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'textFileWriter',
            customData: {
                textContent: '',
                outputDirectory: '',
                filename: 'output',
                overwriteExisting: true,
            }
        } as BaseNodeData,
    };
}; 