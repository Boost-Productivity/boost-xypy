import { BaseNodeData } from '../../base/BaseNode.types';

export interface AudioExtractorNodeData extends BaseNodeData {
    nodeType: 'audioExtractor';
    customData: {
        videoFilePath: string; // Input video file path
        outputDirectory: string; // Directory to save extracted audio
        audioFormat: 'mp3' | 'wav' | 'aac' | 'flac'; // Output audio format
        audioQuality: 'low' | 'medium' | 'high'; // Audio quality setting
        extractedAudioPath?: string; // Path to the extracted audio file
        lastExtractionStatus?: 'success' | 'error' | 'processing';
        lastExtractionMessage?: string;
        extractionTime?: number; // Time taken for extraction in seconds
        outputFileSize?: number; // Size of extracted audio file in bytes
    };
} 