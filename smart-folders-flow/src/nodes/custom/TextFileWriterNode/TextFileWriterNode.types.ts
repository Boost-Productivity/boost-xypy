import { BaseNodeData } from '../../base/BaseNode.types';

export interface TextFileWriterNodeData extends BaseNodeData {
    nodeType: 'textFileWriter';
    customData: {
        textContent: string; // Text content to write
        outputDirectory: string; // Directory where to save the file
        filename: string; // Custom filename (without extension)
        overwriteExisting: boolean; // Whether to overwrite existing files
        lastWriteStatus?: 'success' | 'error';
        lastWriteMessage?: string;
        lastWriteTime?: number;
        savedFilePath?: string; // Path of the last saved file
    };
} 