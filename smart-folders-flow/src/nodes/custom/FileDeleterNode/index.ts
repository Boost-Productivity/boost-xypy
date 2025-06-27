import FileDeleterNode from './FileDeleterNode';
import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { FileDeleterNodeData } from './FileDeleterNode.types';

export const fileDeleterNodeConfig: NodeTypeConfig = {
    type: 'fileDeleter',
    displayName: 'File Deleter',
    description: 'Delete files from the filesystem',
    component: FileDeleterNode,
    defaultData: {
        nodeType: 'fileDeleter',
        label: 'File Deleter',
        pythonFunction: `def process(inputs):
    import os
    import logging
    
    # Get file path
    file_path = inputs.get('file_path', '')
    
    # Also check for inputs from upstream nodes
    if not file_path:
        file_path = inputs.get('manual', '')
    if not file_path:
        file_path = inputs.get('output_file_path', '')
    if not file_path:
        file_path = inputs.get('video_path', '')
    
    logging.info(f"File Deleter inputs: {inputs}")
    logging.info(f"Attempting to delete: {file_path}")
    
    if not file_path:
        raise ValueError("File path is required. Available keys: " + str(list(inputs.keys())))
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Check if it's actually a file (not a directory)
    if not os.path.isfile(file_path):
        raise ValueError(f"Path is not a file: {file_path}")
    
    try:
        # Delete the file
        os.remove(file_path)
        logging.info(f"Successfully deleted: {file_path}")
        
        # Verify deletion
        if os.path.exists(file_path):
            raise RuntimeError(f"File still exists after deletion: {file_path}")
        
        return f"SUCCESS: Deleted {os.path.basename(file_path)}"
        
    except PermissionError:
        raise PermissionError(f"Permission denied: Cannot delete {file_path}")
    except Exception as e:
        logging.error(f"Delete error: {str(e)}")
        raise RuntimeError(f"Failed to delete file: {str(e)}")`,
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '',
        customData: {
            filePath: '',
        },
    } as FileDeleterNodeData,
    icon: '🗑️',
    color: '#f44336'
};

export const fileDeleterNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString(),
        type: 'fileDeleter',
        position: {
            x: position.x - 160,
            y: position.y - 100,
        },
        data: {
            nodeType: 'fileDeleter',
            label: `File Deleter ${Date.now()}`,
            pythonFunction: fileDeleterNodeConfig.defaultData.pythonFunction,
            isExecuting: false,
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            manualInput: '',
            customData: {
                filePath: '',
            },
        } as FileDeleterNodeData,
    };
}; 