import { BaseNodeData } from '../../base/BaseNode.types';

export interface BrainDumpNodeData extends BaseNodeData {
    nodeType: 'brainDump';
    customData: {
        countdownSeconds: number;
        isCountingDown: boolean;
        startTime?: number;
        brainDumpText: string;
        outputDirectory: string;
        lastSavedFile?: string;
        lastSaveTime?: number;
    };
} 