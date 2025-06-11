import { BaseNodeData } from '../../base/BaseNode.types';

export interface TimerNodeData extends BaseNodeData {
    nodeType: 'timer';
    customData: {
        minutes: number;
        isRunning: boolean;
        remainingSeconds: number;
        originalSeconds: number;
        startTime?: number;
        completedAt?: number;
    };
} 