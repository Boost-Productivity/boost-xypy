import { BaseNodeData } from '../../base/BaseNode.types';

export interface VideoRecorderNodeData extends BaseNodeData {
    nodeType: 'videoRecorder';
    customData: {
        isRecording: boolean;
        outputDirectory: string;
        lastRecordedFile?: string;
        rotation: number; // 0, 90, 180, 270 degrees
    };
} 