import { BaseNodeData } from '../../base/BaseNode.types';

export interface VideoConcatenatorNodeCustomData {
    inputDirectory: string;
    outputDirectory: string;
    lastConcatenationResult?: {
        success: boolean;
        outputFilename?: string;
        outputPath?: string;
        fileSize?: number;
        filesConcatenated?: number;
        inputFiles?: string[];
        message?: string;
    };
    lastConcatenationTime?: number;
}

export interface VideoConcatenatorNodeData extends BaseNodeData {
    nodeType: 'videoConcatenator';
    customData: VideoConcatenatorNodeCustomData;
} 