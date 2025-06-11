import { BaseNodeData } from '../../base/BaseNode.types';

export interface VideoRecorderNodeData extends BaseNodeData {
    nodeType: 'videoRecorder';
    customData: {
        isRecording: boolean;
        recordingStartTime?: number;
        recordingDuration: number;
        outputDirectory: string;
        lastRecordedFile?: string;
        videoQuality: 'low' | 'medium' | 'high';
        autoSaveOnStop: boolean;
        lastSaveStatus?: 'success' | 'error';
        lastSaveMessage?: string;
        lastSaveTime?: number;
        rotation?: number; // Camera rotation in degrees (0, 90, 180, 270)
    };
} 