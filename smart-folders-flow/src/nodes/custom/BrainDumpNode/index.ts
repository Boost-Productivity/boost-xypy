import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import { BrainDumpNodeData } from './BrainDumpNode.types';
import BrainDumpNode from './BrainDumpNode';

export const brainDumpNodeConfig: NodeTypeConfig = {
    type: 'brainDump',
    displayName: 'Brain Dump Timer',
    description: 'A timer-based brain dump node that saves thoughts to text files',
    component: BrainDumpNode,
    defaultData: {
        nodeType: 'brainDump',
        label: 'Brain Dump',
        pythonFunction: `def process(inputs):
    """
    Save brain dump text to a file in the specified output directory.
    
    Expected inputs:
    - brainDumpText: The text content to save
    - outputDirectory: Directory to save the file
    """
    import os
    import uuid
    from datetime import datetime
    
    log_progress("🧠 Starting brain dump save...")
    
    # Get the brain dump text and output directory from customData
    brain_dump_text = inputs.get("brainDumpText", "")
    output_dir = inputs.get("outputDirectory", "/tmp/brain_dumps")
    
    if not brain_dump_text.strip():
        return "ERROR: No brain dump text provided"
    
    if not output_dir.strip():
        return "ERROR: No output directory specified"
    
    try:
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            log_progress(f"📁 Created directory: {output_dir}")
        
        # Generate filename with timestamp and UUID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"brain_dump_{timestamp}_{unique_id}.txt"
        file_path = os.path.join(output_dir, filename)
        
        # Write the brain dump to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"Brain Dump - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\\n")
            f.write("=" * 50 + "\\n\\n")
            f.write(brain_dump_text)
            f.write("\\n\\n" + "=" * 50 + "\\n")
            f.write(f"Character count: {len(brain_dump_text)}\\n")
            f.write(f"Word count: {len(brain_dump_text.split())}\\n")
        
        log_progress(f"💾 Saved brain dump to: {filename}")
        log_progress(f"📊 Content: {len(brain_dump_text)} characters, {len(brain_dump_text.split())} words")
        
        return file_path
        
    except Exception as e:
        log_progress(f"❌ Error saving brain dump: {str(e)}")
        return f"ERROR: Failed to save brain dump: {str(e)}"`,
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        manualInput: '',
        customData: {
            countdownSeconds: 300, // 5 minutes default
            isCountingDown: false,
            brainDumpText: '',
            outputDirectory: '/tmp/brain_dumps',
            lastSavedFile: '',
            lastSaveTime: undefined
        }
    },
    icon: '🧠',
    color: '#9c27b0'
};

export const brainDumpNodeFactory: NodeFactory = (position, customData) => {
    return {
        id: Date.now().toString(),
        type: 'brainDump',
        position: {
            x: position.x - 175, // Center the wider node
            y: position.y - 150,
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