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
    # Check multiple sources for the video path
    video_path = inputs.get("manual", "").strip()
    
    # If manual input is empty, check selectedVideoFile from customData
    if not video_path:
        video_path = inputs.get("selectedVideoFile", "").strip()
    
    if not video_path:
        return "ERROR: No video file selected"
    
    log_progress(f"📽️ Selected video: {video_path}")
    
    # Return just the video file path (no prefix text)
    return video_path`,
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
    # Check multiple sources for the video path
    video_path = inputs.get("manual", "").strip()
    
    # If manual input is empty, check selectedVideoFile from customData
    if not video_path:
        video_path = inputs.get("selectedVideoFile", "").strip()
    
    if not video_path:
        return "ERROR: No video file selected"
    
    log_progress(f"📽️ Selected video: {video_path}")
    
    # Return just the video file path (no prefix text)
    return video_path`,
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