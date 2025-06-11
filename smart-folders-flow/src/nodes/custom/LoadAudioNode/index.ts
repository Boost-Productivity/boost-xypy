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
        pythonFunction: `# Audio file loader
# Passes the selected audio file path for downstream processing
def process(inputs):
    audio_path = inputs.get("manual", "").strip()
    
    if not audio_path:
        return "No audio file selected"
    
    # Return the audio file path for further processing
    return f"Audio loaded: {audio_path}"`,
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
            pythonFunction: `# Audio file loader
# Passes the selected audio file path for downstream processing
def process(inputs):
    audio_path = inputs.get("manual", "").strip()
    
    if not audio_path:
        return "No audio file selected"
    
    # Return the audio file path for further processing
    return f"Audio loaded: {audio_path}"`,
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