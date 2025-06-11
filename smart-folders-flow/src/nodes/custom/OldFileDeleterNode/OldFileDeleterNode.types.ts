import { BaseNodeData } from '../../base/BaseNode.types';

export interface OldFileDeleterNodeData extends BaseNodeData {
    nodeType: 'oldFileDeleter';
    customData: {
        confirmBeforeDelete: boolean;
        dryRun: boolean; // Preview what would be deleted without actually deleting
        moveToTrash: boolean; // Move to trash instead of permanent delete
        requireManualConfirmation: boolean; // Require clicking confirm button
    };
} 