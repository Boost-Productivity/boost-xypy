import { BaseNodeData } from '../../base/BaseNode.types';

export interface ChunkInfo {
    chunkNumber: number;
    filePath: string;
    timestamp: number;
    fileSize: number;
}

export interface IPWebcamNodeData extends BaseNodeData {
    nodeType: 'ipWebcam';
    customData: {
        ipAddress: string;
        port: string;
        username: string;
        password: string;
        isRecording: boolean;
        recordingStartTime?: number;
        recordingDuration: number;
        outputDirectory: string;
        lastRecordedFile?: string;
        videoQuality: 'low' | 'medium' | 'high';
        recordingLength: number; // Duration in seconds (default 60)
        lastSaveStatus?: 'success' | 'error' | 'recording';
        lastSaveMessage?: string;
        lastSaveTime?: number;
        connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
        showPythonFunction: boolean; // Toggle for Python function visibility
        isContinuousMode: boolean; // Toggle for continuous recording
        currentChunkNumber: number; // Current chunk being recorded
        chunkHistory: ChunkInfo[]; // History of completed chunks
        totalRecordingTime: number; // Total time recorded across all chunks
    };
} 