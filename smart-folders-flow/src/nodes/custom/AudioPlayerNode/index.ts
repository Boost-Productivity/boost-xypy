import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import AudioPlayerNode from './AudioPlayerNode';
import { AudioPlayerNodeData } from './AudioPlayerNode.types';

export const audioPlayerNodeConfig: NodeTypeConfig = {
    type: 'audioPlayer',
    displayName: 'Audio Player',
    description: 'Play audio files when triggered by upstream nodes',
    component: AudioPlayerNode,
    defaultData: {
        label: 'Audio Player',
        pythonFunction: `def process(inputs):
    import os
    
    # Get the audio file path from customData
    audio_path = inputs.get("audioFilePath", "").strip()
    
    if not audio_path:
        return "ERROR: No audio file path specified"
    
    try:
        # Validate the audio file exists
        if not os.path.exists(audio_path):
            return "ERROR: Audio file not found: " + audio_path
        
        if not os.path.isfile(audio_path):
            return "ERROR: Path is not a file: " + audio_path
        
        # Return confirmation that audio was triggered
        file_name = os.path.basename(audio_path)
        return "Audio triggered: " + file_name
        
    except Exception as e:
        return "ERROR: " + str(e)`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'audioPlayer' as const,
        customData: {
            audioFilePath: '',
            volume: 0.8,
            autoPlay: false,
            loop: false,
            playOnTrigger: true,
        }
    } as AudioPlayerNodeData,
    icon: '🔊',
    color: '#9c27b0'
};

export const audioPlayerNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_audioPlayer',
        type: 'audioPlayer',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        data: {
            label: `Audio Player ${Date.now()}`,
            pythonFunction: `def process(inputs):
    import os
    
    # Get the audio file path from customData
    audio_path = inputs.get("audioFilePath", "").strip()
    
    if not audio_path:
        return "ERROR: No audio file path specified"
    
    try:
        # Validate the audio file exists
        if not os.path.exists(audio_path):
            return "ERROR: Audio file not found: " + audio_path
        
        if not os.path.isfile(audio_path):
            return "ERROR: Path is not a file: " + audio_path
        
        # Return confirmation that audio was triggered
        file_name = os.path.basename(audio_path)
        return "Audio triggered: " + file_name
        
    except Exception as e:
        return "ERROR: " + str(e)`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'audioPlayer',
            customData: {
                audioFilePath: '',
                volume: 0.8,
                autoPlay: false,
                loop: false,
                playOnTrigger: true,
            }
        } as BaseNodeData,
    };
}; 