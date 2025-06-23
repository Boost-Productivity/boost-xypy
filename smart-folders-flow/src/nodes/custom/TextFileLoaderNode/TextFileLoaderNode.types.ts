import { BaseNodeData } from '../../base/BaseNode.types';

export interface TextFileLoaderNodeData extends BaseNodeData {
    nodeType: 'textFileLoader';
    customData: {
        inputPath: string; // Directory or file path input
        selectedTextFile: string; // Currently selected text file
        availableTextFiles: string[]; // List of text files found in directory
        fileContent: string; // Content of the selected text file
        showFullContent: boolean; // Whether to show full content or preview
        maxPreviewLength: number; // Maximum characters to show in preview
        lastLoadStatus?: 'success' | 'error';
        lastLoadMessage?: string;
        lastLoadTime?: number;
    };
} 