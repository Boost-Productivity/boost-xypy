import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import LoadVideoNode from './LoadVideoNode';
import { LoadVideoNodeData } from './LoadVideoNode.types';

export const loadVideoNodeConfig: NodeTypeConfig = {
    type: 'loadVideo',
    displayName: 'Load Video',
    description: 'Load and preview video files from directory path',
    component: LoadVideoNode,
    defaultData: {
        label: 'Load Video',
        pythonFunction: `# Video file loader
# Passes the selected video file path for downstream processing
def process(inputs):
    video_path = inputs.get("manual", "").strip()
    
    if not video_path:
        return "No video file selected"
    
    # Return the video file path for further processing
    return f"Video loaded: {video_path}"`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'loadVideo' as const,
        customData: {
            inputPath: '',
            selectedVideoFile: '',
            availableVideos: [],
            autoPlay: false,
            volume: 0.8,
            showControls: true,
        }
    } as LoadVideoNodeData,
    icon: '📽️',
    color: '#673ab7'
};

export const loadVideoNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_loadVideo',
        type: 'loadVideo',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        data: {
            label: `Load Video ${Date.now()}`,
            pythonFunction: `# Video file loader
# Passes the selected video file path for downstream processing
def process(inputs):
    video_path = inputs.get("manual", "").strip()
    
    if not video_path:
        return "No video file selected"
    
    # Return the video file path for further processing
    return f"Video loaded: {video_path}"`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'loadVideo',
            customData: {
                inputPath: '',
                selectedVideoFile: '',
                availableVideos: [],
                autoPlay: false,
                volume: 0.8,
                showControls: true,
            }
        } as BaseNodeData,
    };
}; 