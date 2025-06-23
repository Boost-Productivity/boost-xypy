import { BaseNodeData } from '../../base/BaseNode.types';

export interface AudioPlayerNodeData extends BaseNodeData {
    nodeType: 'audioPlayer';
    customData: {
        audioFilePath: string;
        volume: number;
        autoPlay: boolean;
        loop: boolean;
        playOnTrigger: boolean;
        lastPlayTime?: number;
        lastPlayStatus?: 'success' | 'error';
        lastPlayMessage?: string;
    };
} 