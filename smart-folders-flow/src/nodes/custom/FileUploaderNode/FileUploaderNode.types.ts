import { BaseNodeData } from '../../base/BaseNode.types';

export interface FileUploaderNodeData extends BaseNodeData {
    nodeType: 'fileUploader';
    customData: {
        targetDirectory: string; // Target directory for uploads
        allowedExtensions: string[]; // Allowed file extensions
        maxFileSize: number; // Max file size in MB
        uploadedFiles: string[]; // List of uploaded files
        lastUploadStatus?: 'success' | 'error' | 'uploading';
        lastUploadMessage?: string;
        lastUploadTime?: number;
        totalUploaded?: number;
        overwriteExisting: boolean; // Whether to overwrite existing files
    };
} 