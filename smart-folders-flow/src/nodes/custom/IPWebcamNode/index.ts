import { NodeTypeConfig, NodeFactory, BaseNodeData } from '../../base/BaseNode.types';
import IPWebcamNode from './IPWebcamNode';
import { IPWebcamNodeData } from './IPWebcamNode.types';

export const ipWebcamNodeConfig: NodeTypeConfig = {
    type: 'ipWebcam',
    displayName: 'IP Webcam Recorder',
    description: 'Record IP camera stream into 1-minute videos with authentication',
    component: IPWebcamNode,
    defaultData: {
        label: 'IP Webcam Recorder',
        pythonFunction: `# IP Webcam video processing
# Returns the recorded video file path for downstream processing
def process(inputs):
    video_path = inputs.get("manual", "").strip()
    
    if not video_path:
        return "No video file recorded"
    
    # Return the file path for downstream nodes
    return video_path`,
        manualInput: '',
        lastOutput: '',
        streamingLogs: '',
        inputs: {},
        isExecuting: false,
        nodeType: 'ipWebcam' as const,
        customData: {
            ipAddress: '192.168.1.100',
            port: '8080',
            username: '',
            password: '',
            isRecording: false,
            recordingDuration: 0,
            outputDirectory: './webcam_recordings',
            videoQuality: 'medium' as const,
            recordingLength: 60,
            connectionStatus: 'disconnected' as const,
            showPythonFunction: false,
            isContinuousMode: false,
            currentChunkNumber: 0,
            chunkHistory: [],
            totalRecordingTime: 0,
        }
    } as IPWebcamNodeData
};

export const ipWebcamNodeFactory: NodeFactory = (position) => {
    return {
        id: Date.now().toString() + '_ipcam',
        type: 'ipWebcam',
        position: {
            x: position.x - 175,
            y: position.y - 150,
        },
        data: {
            label: `IP Webcam ${Date.now()}`,
            pythonFunction: `# IP Webcam video processing
# Returns the recorded video file path for downstream processing
def process(inputs):
    video_path = inputs.get("manual", "").strip()
    
    if not video_path:
        return "No video file recorded"
    
    # Return the file path for downstream nodes
    return video_path`,
            manualInput: '',
            lastOutput: '',
            streamingLogs: '',
            inputs: {},
            isExecuting: false,
            nodeType: 'ipWebcam',
            customData: {
                ipAddress: '192.168.1.100',
                port: '8080',
                username: '',
                password: '',
                isRecording: false,
                recordingDuration: 0,
                outputDirectory: './webcam_recordings',
                videoQuality: 'medium',
                recordingLength: 60,
                connectionStatus: 'disconnected',
                showPythonFunction: false,
                isContinuousMode: false,
                currentChunkNumber: 0,
                chunkHistory: [],
                totalRecordingTime: 0,
            }
        } as BaseNodeData,
    };
}; 