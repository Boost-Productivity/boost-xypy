import { BaseNodeData } from '../../base/BaseNode.types';

export interface FileDeleterNodeData extends BaseNodeData {
    nodeType: 'fileDeleter';
    customData: {
        filePath: string; // File path to delete
        lastDeleteStatus?: 'success' | 'error' | 'deleting';
        lastDeleteMessage?: string;
        lastDeleteTime?: number;
    };
} 