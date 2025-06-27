import { BaseNodeData } from '../../base/BaseNode.types';

export interface WebmToMp4NodeData extends BaseNodeData {
    nodeType: 'webmToMp4';
    customData: {
        inputVideoPath: string; // Input WebM file path
        outputDirectory: string; // Directory where to save the MP4 file
        lastConversionStatus?: 'success' | 'error' | 'converting';
        lastConversionMessage?: string;
        lastConversionTime?: number;
        outputFilePath?: string; // Path of the converted MP4 file
    };
} 