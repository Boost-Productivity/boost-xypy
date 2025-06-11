import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import FileUploaderNode from './FileUploaderNode';
import { FileUploaderNodeData } from './FileUploaderNode.types';

export const fileUploaderNodeConfig: NodeTypeConfig = {
    type: 'fileUploader',
    displayName: 'File Uploader',
    description: 'Upload files to a target directory with filtering and validation',
    component: FileUploaderNode,
    defaultData: {
        label: 'File Uploader',
        pythonFunction: `def process(inputs):
    import os
    import json
    
    # Parse JSON from manual input - now contains upload results
    manual_input = inputs.get("manual", "")
    if manual_input:
        try:
            data = json.loads(manual_input)
            uploaded_files = data.get("uploadedFiles", [])
            target_directory = data.get("targetDirectory", "")
            total_files = data.get("totalFiles", 0)
            total_size = data.get("totalSize", 0)
            timestamp = data.get("timestamp", 0)
        except (json.JSONDecodeError, KeyError):
            return "ERROR: Invalid upload result format"
    else:
        return "ERROR: No upload results provided"
    
    if not uploaded_files:
        return "ERROR: No files were uploaded"
    
    try:
        # Process the uploaded files
        result_lines = [
            "Files uploaded successfully!",
            "Target directory: " + target_directory,
            "Files uploaded: " + str(total_files),
            "Total size: " + str(round(total_size / (1024 * 1024), 2)) + " MB",
            "",
            "Uploaded files:"
        ]
        
        for file_path in uploaded_files:
            filename = os.path.basename(file_path)
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                result_lines.append("  ✅ " + filename + " (" + str(round(file_size / 1024, 1)) + " KB)")
            else:
                result_lines.append("  ❌ " + filename + " (file not found)")
        
        result_lines.extend([
            "",
            "All files are ready for downstream processing.",
            "",
            "--- UPLOADED FILES ---"
        ])
        
        # Add file paths for downstream nodes
        for file_path in uploaded_files:
            result_lines.append(file_path)
        
        return "\\n".join(result_lines)
        
    except Exception as e:
        return "ERROR: " + str(e)`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'fileUploader' as const,
        customData: {
            targetDirectory: '',
            allowedExtensions: [],
            maxFileSize: 5000,
            uploadedFiles: [],
            overwriteExisting: false,
        }
    } as FileUploaderNodeData,
    icon: '📁',
    color: '#2196f3'
};

export const fileUploaderNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_fileUploader',
        type: 'fileUploader',
        position: {
            x: position.x - 175,
            y: position.y - 150,
        },
        data: {
            label: 'File Uploader ' + Date.now(),
            pythonFunction: `def process(inputs):
    import os
    import json
    
    # Parse JSON from manual input - now contains upload results
    manual_input = inputs.get("manual", "")
    if manual_input:
        try:
            data = json.loads(manual_input)
            uploaded_files = data.get("uploadedFiles", [])
            target_directory = data.get("targetDirectory", "")
            total_files = data.get("totalFiles", 0)
            total_size = data.get("totalSize", 0)
            timestamp = data.get("timestamp", 0)
        except (json.JSONDecodeError, KeyError):
            return "ERROR: Invalid upload result format"
    else:
        return "ERROR: No upload results provided"
    
    if not uploaded_files:
        return "ERROR: No files were uploaded"
    
    try:
        # Process the uploaded files
        result_lines = [
            "Files uploaded successfully!",
            "Target directory: " + target_directory,
            "Files uploaded: " + str(total_files),
            "Total size: " + str(round(total_size / (1024 * 1024), 2)) + " MB",
            "",
            "Uploaded files:"
        ]
        
        for file_path in uploaded_files:
            filename = os.path.basename(file_path)
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                result_lines.append("  ✅ " + filename + " (" + str(round(file_size / 1024, 1)) + " KB)")
            else:
                result_lines.append("  ❌ " + filename + " (file not found)")
        
        result_lines.extend([
            "",
            "All files are ready for downstream processing.",
            "",
            "--- UPLOADED FILES ---"
        ])
        
        # Add file paths for downstream nodes
        for file_path in uploaded_files:
            result_lines.append(file_path)
        
        return "\\n".join(result_lines)
        
    except Exception as e:
        return "ERROR: " + str(e)`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'fileUploader',
            customData: {
                targetDirectory: '',
                allowedExtensions: [],
                maxFileSize: 5000,
                uploadedFiles: [],
                overwriteExisting: false,
            }
        } as BaseNodeData,
    };
}; 