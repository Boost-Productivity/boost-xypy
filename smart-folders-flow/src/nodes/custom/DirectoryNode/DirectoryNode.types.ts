import { BaseNodeData } from '../../base/BaseNode.types';

export interface DirectoryNodeData extends BaseNodeData {
    nodeType: 'directory';
    customData: {
        directoryPath: string;
        createParents: boolean; // Create parent directories if they don't exist
        lastCreatedPath?: string; // Track last successfully created path
        permissions?: string; // Directory permissions (e.g., "755")
    };
} 