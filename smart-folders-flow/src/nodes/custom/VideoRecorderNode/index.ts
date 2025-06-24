import { NodeTypeConfig, NodeFactory } from '../../base/BaseNode.types';
import VideoRecorderNode from './VideoRecorderNode';
import { VideoRecorderNodeData } from './VideoRecorderNode.types';

export const videoRecorderNodeConfig: NodeTypeConfig = {
    type: 'videoRecorder',
    displayName: 'Video Recorder',
    description: 'Simple webcam recorder that saves videos to a directory',
    component: VideoRecorderNode,
    defaultData: {
        label: 'Video Recorder',
        pythonFunction: `def process(inputs):
    # Returns the path of the last recorded video file
    video_path = inputs.get("manual", "").strip()
    
    if not video_path:
        return "No video file recorded yet"
    
    return video_path`,
        manualInput: '',
        inputs: {},
        isExecuting: false,
        lastOutput: '',
        streamingLogs: '',
        nodeType: 'videoRecorder',
        customData: {
            isRecording: false,
            outputDirectory: './recordings',
            lastRecordedFile: undefined,
            rotation: 0,
        },
    } as VideoRecorderNodeData,
};

export const videoRecorderNodeFactory: NodeFactory = (position) => ({
    id: Date.now().toString() + '_vid',
    type: 'videoRecorder',
    position,
    data: {
        ...videoRecorderNodeConfig.defaultData,
    } as VideoRecorderNodeData,
});

export default VideoRecorderNode; 