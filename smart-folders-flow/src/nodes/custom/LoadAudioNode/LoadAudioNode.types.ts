import { BaseNodeData } from '../../base/BaseNode.types';

export interface LoadAudioNodeData extends BaseNodeData {
    nodeType: 'loadAudio';
    customData: {
        inputPath: string; // Directory or file path input
        selectedAudioFile: string; // Currently selected audio file
        availableAudios: string[]; // List of audio files found in directory
        autoPlay: boolean; // Auto-play audio when loaded
        volume: number; // Audio volume (0-1)
        showControls: boolean; // Show audio player controls
        loop: boolean; // Loop audio playback
        lastLoadStatus?: 'success' | 'error';
        lastLoadMessage?: string;
        lastLoadTime?: number;
    };
} 