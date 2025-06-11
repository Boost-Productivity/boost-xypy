import { BaseNodeData } from '../../base/BaseNode.types';

export interface LoadVideoNodeData extends BaseNodeData {
    nodeType: 'loadVideo';
    customData: {
        inputPath: string; // Directory or file path input
        selectedVideoFile: string; // Currently selected video file
        availableVideos: string[]; // List of video files found in directory
        autoPlay: boolean; // Auto-play video when loaded
        volume: number; // Video volume (0-1)
        showControls: boolean; // Show video player controls
        lastLoadStatus?: 'success' | 'error';
        lastLoadMessage?: string;
        lastLoadTime?: number;
    };
} 