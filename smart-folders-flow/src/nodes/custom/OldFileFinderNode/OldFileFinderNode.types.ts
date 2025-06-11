import { BaseNodeData } from '../../base/BaseNode.types';

export interface OldFileFinderNodeData extends BaseNodeData {
    nodeType: 'oldFileFinder';
    customData: {
        directory: string;
        olderThan: string; // e.g., "7 days", "30 days", "2 weeks", "1 month"
        filePattern: string; // e.g., "*", "*.log", "*.tmp"
        includeSubdirectories: boolean;
    };
} 