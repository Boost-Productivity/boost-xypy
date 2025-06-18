import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import VideoRecorderNode from './VideoRecorderNode';
import { VideoRecorderNodeData } from './VideoRecorderNode.types';

export const videoRecorderNodeConfig: NodeTypeConfig = {
    type: 'videoRecorder',
    displayName: 'Video Recorder',
    description: 'Record webcam video and save to specified directory',
    component: VideoRecorderNode,
    defaultData: {
        label: 'Video Recorder',
        pythonFunction: `# Video file processing
# Returns the file path for downstream processing
def process(inputs):
    video_path = inputs.get("manual", "").strip()
    
    if not video_path:
        return "No video file provided"
    
    # Simply return the file path
    return video_path`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'videoRecorder' as const,
        customData: {
            isRecording: false,
            recordingDuration: 0,
            outputDirectory: './recordings',
            videoQuality: 'medium' as const,
            autoSaveOnStop: true,
            availableVideoSources: [],
            isLoadingDevices: false,
        }
    } as VideoRecorderNodeData
};

export const videoRecorderNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_vid',
        type: 'videoRecorder',
        position: {
            x: position.x - 160,
            y: position.y - 120,
        },
        data: {
            label: `Video Recorder ${Date.now()}`,
            pythonFunction: `# Video file processing
# Returns the file path for downstream processing
def process(inputs):
    video_path = inputs.get("manual", "").strip()
    
    if not video_path:
        return "No video file provided"
    
    # Simply return the file path
    return video_path`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'videoRecorder',
            customData: {
                isRecording: false,
                recordingDuration: 0,
                outputDirectory: './recordings',
                videoQuality: 'medium',
                autoSaveOnStop: true,
                availableVideoSources: [],
                isLoadingDevices: false,
            }
        } as BaseNodeData,
    };
};

export default videoRecorderNodeConfig; 