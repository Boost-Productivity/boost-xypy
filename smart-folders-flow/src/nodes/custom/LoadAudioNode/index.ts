import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import LoadAudioNode from './LoadAudioNode';
import { LoadAudioNodeData } from './LoadAudioNode.types';

export const loadAudioNodeConfig: NodeTypeConfig = {
    type: 'loadAudio',
    displayName: 'Load Audio',
    description: 'Load and play audio files from directory path',
    component: LoadAudioNode,
    defaultData: {
        label: 'Load Audio',
        pythonFunction: `def process(inputs):
    import os
    
    # Get the selected audio file path from manual input first
    audio_path = inputs.get("manual", "").strip()
    
    # If no manual input, check for selectedAudioFile from customData  
    if not audio_path:
        audio_path = inputs.get("selectedAudioFile", "").strip()
    
    if not audio_path:
        return "ERROR: No audio file selected"
    
    try:
        # Validate the audio file exists
        if not os.path.exists(audio_path):
            return "ERROR: Audio file not found: " + audio_path
        
        if not os.path.isfile(audio_path):
            return "ERROR: Path is not a file: " + audio_path
        
        # Return just the file path for downstream processing
        return audio_path
        
    except Exception as e:
        return "ERROR: " + str(e)`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'loadAudio' as const,
        customData: {
            inputPath: '',
            selectedAudioFile: '',
            availableAudios: [],
            autoPlay: false,
            volume: 0.8,
            showControls: true,
            loop: false,
        }
    } as LoadAudioNodeData,
    icon: '🎵',
    color: '#ff5722'
};

export const loadAudioNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_loadAudio',
        type: 'loadAudio',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        data: {
            label: `Load Audio ${Date.now()}`,
            pythonFunction: `def process(inputs):
    import os
    
    # Get the selected audio file path from manual input first
    audio_path = inputs.get("manual", "").strip()
    
    # If no manual input, check for selectedAudioFile from customData  
    if not audio_path:
        audio_path = inputs.get("selectedAudioFile", "").strip()
    
    if not audio_path:
        return "ERROR: No audio file selected"
    
    try:
        # Validate the audio file exists
        if not os.path.exists(audio_path):
            return "ERROR: Audio file not found: " + audio_path
        
        if not os.path.isfile(audio_path):
            return "ERROR: Path is not a file: " + audio_path
        
        # Return just the file path for downstream processing
        return audio_path
        
    except Exception as e:
        return "ERROR: " + str(e)`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'loadAudio',
            customData: {
                inputPath: '',
                selectedAudioFile: '',
                availableAudios: [],
                autoPlay: false,
                volume: 0.8,
                showControls: true,
                loop: false,
            }
        } as BaseNodeData,
    };
}; 