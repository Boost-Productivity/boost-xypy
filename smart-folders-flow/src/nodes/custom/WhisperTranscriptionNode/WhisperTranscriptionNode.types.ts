import { BaseNodeData } from '../../base/BaseNode.types';

export interface WhisperTranscriptionNodeData extends BaseNodeData {
    nodeType: 'whisperTranscription';
    customData: {
        audioFilePath: string; // Path to the audio file to transcribe
        model: 'tiny' | 'base' | 'small' | 'medium' | 'large'; // Whisper model size
        language?: string; // Target language (optional, auto-detect if not specified)
        temperature: number; // Temperature for transcription (0.0 to 1.0)
        verbose: boolean; // Enable verbose output
        lastTranscriptionStatus?: 'success' | 'error' | 'processing';
        lastTranscriptionMessage?: string;
        lastTranscriptionTime?: number;
        transcriptionResult?: string; // Store the transcription result
        processingTime?: number; // Time taken to process
    };
} 