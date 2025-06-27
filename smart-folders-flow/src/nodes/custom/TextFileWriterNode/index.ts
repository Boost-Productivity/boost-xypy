import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import TextFileWriterNode from './TextFileWriterNode';
import { TextFileWriterNodeData } from './TextFileWriterNode.types';

export const textFileWriterNodeConfig: NodeTypeConfig = {
    type: 'textFileWriter',
    displayName: 'Text File Writer',
    description: 'Write text content to files',
    component: TextFileWriterNode,
    defaultData: {
        label: 'Text File Writer',
        pythonFunction: `def process(inputs):
    import os
    import datetime
    import logging
    
    logging.info(f"TextFileWriter inputs: {inputs}")
    
    # First try to get from direct upstream inputs
    text_content = inputs.get("text_content", "").strip()
    output_dir = inputs.get("output_dir", "").strip()
    if not output_dir:
        output_dir = inputs.get("output_directory", "").strip()
    
    # If no direct inputs, try parsing JSON from manual input
    if not text_content or not output_dir:
        manual_input = inputs.get("manual", "")
        if manual_input:
            try:
                import json
                data = json.loads(manual_input)
                if not text_content:
                    text_content = data.get("text_content", "").strip()
                if not output_dir:
                    output_dir = data.get("output_dir", "").strip()
            except (json.JSONDecodeError, KeyError):
                pass
    
    # Also check for any other text-like input
    if not text_content:
        for key, value in inputs.items():
            if key not in ["manual", "output_dir", "output_directory"] and value:
                text_content = str(value).strip()
                break
    
    logging.info(f"TextFileWriter resolved - text_content length: {len(text_content)}, output_dir: {output_dir}")
    
    if not text_content:
        return f"ERROR: No text content provided. Available keys: {list(inputs.keys())}"
    
    if not output_dir:
        return f"ERROR: No output directory specified. Available keys: {list(inputs.keys())}"
    
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"text_output_{timestamp}.txt"
        
        output_path = os.path.join(output_dir, output_filename)
        
        # Save text file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text_content)
        
        logging.info(f"Successfully saved text file: {output_path}")
        logging.info(f"File size: {len(text_content)} characters")
        
        # Return just the output file path for downstream nodes
        return output_path
        
    except Exception as e:
        error_msg = f"ERROR: Failed to save text file - {str(e)}"
        logging.error(error_msg)
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
            pythonFunction: textFileWriterNodeConfig.defaultData.pythonFunction,
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
    };
}; 